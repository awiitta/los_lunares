"""Prepara recortes reales de Site01 y conserva el visor del equipo como referencia.

El criterio de práctica no identifica cráteres ni certifica seguridad de aterrizaje.
"""
from pathlib import Path
import hashlib
import json
import shutil
import warnings

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.errors import NotGeoreferencedWarning
from rasterio.windows import Window

if __package__:
    from .lunar import DEM, dump, slope_formula
else:
    from lunar import DEM, dump, slope_formula

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"fuentes/site01_luna"
DEST=ROOT/"dist/minijuego"


def classify(slope,elevation):
    valid=np.isfinite(slope)&np.isfinite(elevation)
    if valid.mean()<0.99:
        return {"status":"unknown","valid_fraction":float(valid.mean())}
    s,z=slope[valid],elevation[valid]
    pct=float(np.mean(s<8)*100)
    relief=float(np.percentile(z,95)-np.percentile(z,5))
    return {"status":"candidate" if pct>=80 and relief<=20 else "review",
            "valid_fraction":float(valid.mean()),"median_slope_deg":float(np.median(s)),
            "fraction_below_8_deg_percent":pct,"relief_p95_p5_m":relief,
            "min_elevation_m":float(z.min()),"max_elevation_m":float(z.max())}


def png(path,rgb):
    with warnings.catch_warnings():
        warnings.simplefilter("ignore",NotGeoreferencedWarning)
        with rasterio.open(path,"w",driver="PNG",height=rgb.shape[0],width=rgb.shape[1],count=3,dtype="uint8") as dst:
            dst.write(np.moveaxis(rgb,-1,0))


def main():
    assets=DEST/"assets"
    assets.mkdir(parents=True,exist_ok=True)
    dem_path=SOURCE/"datos/entrada/Site01_final_adj_5mpp_surf.tif"
    digest=hashlib.sha256(dem_path.read_bytes()).hexdigest()
    rounds=[]
    with DEM(dem_path) as dem:
        positions=[(row,col) for row in range(40,dem.src.height-120,80) for col in range(40,dem.src.width-120,80)]
        np.random.default_rng(20261115).shuffle(positions)
        for row,col in positions:
            z=dem.read(Window(col-1,row-1,82,82))
            rr,cc=np.mgrid[row-1:row+81,col-1:col+81]
            x=dem.src.transform.a*(cc+.5)+dem.src.transform.c
            y=dem.src.transform.e*(rr+.5)+dem.src.transform.f
            lon,lat=dem.to_geo.transform(x,y)
            k=np.asarray(dem.proj.get_factors(lon,lat).meridional_scale)
            slope=slope_formula(z,5,5,k)[1:-1,1:-1]
            z=z[1:-1,1:-1]
            tiles=[]
            for j in range(4):
                for i in range(4):
                    block=(slice(j*20,(j+1)*20),slice(i*20,(i+1)*20))
                    metrics=classify(slope[block],z[block])
                    window=Window(col+i*20,row+j*20,20,20)
                    bounds=list(rasterio.windows.bounds(window,dem.src.transform))
                    px,py=dem.src.xy(row+j*20+10,col+i*20+10)
                    tiles.append({"id":f"{chr(65+i)}{j+1}","row":j,"column":i,
                                  "bounds_xy_m":bounds,"center_lon_lat":list(dem.to_geo.transform(px,py)),**metrics})
            count=sum(t["status"]=="candidate" for t in tiles)
            if not 2<=count<=6 or any(t["status"]=="unknown" for t in tiles):
                continue
            if any(abs(row-r["pixel_window"][1])<160 and abs(col-r["pixel_window"][0])<160 for r in rounds):
                continue
            index=len(rounds)+1
            # Sombreado cartográfico: la iluminación no representa una fecha de misión.
            scaled=dem.src.read(1,window=Window(col,row,80,80),out_shape=(400,400),resampling=Resampling.bilinear).astype(float)
            gy,gx=np.gradient(scaled,1.,1.)
            normal=np.stack((-gx,-gy,np.ones_like(gx)),axis=-1)
            normal/=np.linalg.norm(normal,axis=-1)[...,None]
            light=np.maximum(0,np.sum(normal*np.array([-.5,.5,.70710678]),axis=-1))
            gray=45+light*155
            rgb=np.stack((gray*.80,gray*.95,gray),axis=-1).clip(0,255).astype("uint8")
            png(assets/f"sector-{index}.png",rgb)
            s_big=np.repeat(np.repeat(slope,5,axis=0),5,axis=1)
            palette=np.where((s_big<8)[...,None],np.array([74,202,163]),np.where((s_big<15)[...,None],np.array([231,175,79]),np.array([196,91,113])))
            heat=(palette*(.5+.5*light[...,None])).clip(0,255).astype("uint8")
            png(assets/f"sector-{index}-pendiente.png",heat)
            rounds.append({"id":f"site01-{index}","title":f"Sector {index} de Site01",
                           "source_kind":"real_LOLA","pixel_window":[col,row,80,80],
                           "bounds_xy_m":list(rasterio.windows.bounds(Window(col,row,80,80),dem.src.transform)),
                           "image":f"assets/sector-{index}.png","slope_image":f"assets/sector-{index}-pendiente.png",
                           "tiles":tiles})
            if len(rounds)==4:break
    if len(rounds)<4:raise RuntimeError("No se encontraron cuatro sectores válidos")
    dump(assets/"desafios.json",{"schema_version":1,"dataset":"LOLA Site01 5m",
        "dataset_sha256":digest,"source_filename":dem_path.name,"frame":"MOON_ME_DE421",
        "source_url":"https://pgda.gsfc.nasa.gov/products/78","pixel_size_m":5,"tile_size_m":100,
        "sector_size_m":400,"rule_version":"training-v1",
        "rule":{"slope_threshold_deg":8,"minimum_fraction_percent":80,"maximum_relief_p95_p5_m":20,"minimum_valid_fraction":.99},
        "limits":"Criterio de entrenamiento, no certifica seguridad. No detecta cráteres, profundidad de cráter ni rocas; el relieve local es una señal para revisar.",
        "rounds":rounds})
    for filename in ["index.html","juego.css","juego.js","game-model.js","mission-challenge.js","descenso.html","descenso-data.js","descenso-engine.js","descenso-lunares.css"]:
        shutil.copyfile(ROOT/"herramientas/plantilla_minijuego"/filename,DEST/filename)
    original=(SOURCE/"web/site01_luna3d.html").read_text(encoding="utf-8")
    themed=original.replace('</head>','<link rel="stylesheet" href="visor-equipo.css"></head>',1)
    themed=themed.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','../assets/three.min.js').replace('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js','../assets/OrbitControls.js')
    themed=themed.replace('<h1>Site01 — ¿dónde queda en la Luna?</h1>','<h1>LOS LUNARES · Visor del equipo · Site01</h1>',1)
    (DEST/"visor-equipo.html").write_text(themed,encoding="utf-8")
    (DEST/"visor-equipo.css").write_text(':root{--bg:#070e1f;--panel:#0e1a33;--line:#294460;--txt:#e7eef9;--mut:#a2b6cd;--acc:#22d3ee}body{font-family:Inter,"Segoe UI",sans-serif}header{background:#0a1429;padding:18px 20px}button.on{background:#123e50;color:#d7fcff}button,select,.info,.mini,.legend,.note{border-radius:12px}h1{color:#77dfe9}',encoding="utf-8")
    descent_moon=ROOT/"fuentes/descenso-original/assets/moon_1024.jpg"
    if descent_moon.exists():shutil.copyfile(descent_moon,assets/"moon_1024.jpg")
    shared=ROOT/"dist/assets"
    for name in ["felicette-green.png","felicette-terrain.png","los-lunares-final.png"]:
        source=shared/name
        if source.exists():shutil.copyfile(source,assets/name)
    print(json.dumps({"directory":str(DEST),"rounds":len(rounds),"candidates":[sum(t['status']=='candidate' for t in r['tiles']) for r in rounds]},indent=2))


if __name__=="__main__":main()
