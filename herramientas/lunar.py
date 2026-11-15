"""Procesamiento de DEM LOLA: pendientes, perfiles y horizonte lunar.

Coordenadas de entrada: longitud este, latitud, en grados MOON_ME/DE421.
Alturas: metros sobre la esfera de referencia del DEM. Sin refracción.
"""
from __future__ import annotations

import argparse
import csv
import json
import math
from pathlib import Path
from urllib.request import urlopen

import numpy as np
import rasterio
from rasterio.windows import Window
from pyproj import CRS, Geod, Proj, Transformer

BASE = "https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/Site04/"
FILES = {k: f"Site04_final_adj_5mpp_{v}.tif" for k, v in {
    "dem": "surf", "slope": "slp", "height_error": "toterr", "slope_error": "slperr"
}.items()}
FILES["regional"] = "LDEM_80S_80MPP_ADJ.TIF"
REGIONAL_URL = "https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_80S_80MPP_ADJ.TIF"


def positive(value):
    value = float(value)
    if not math.isfinite(value) or value <= 0:
        raise ValueError("El valor debe ser finito y mayor que cero")
    return value


def height(value):
    if not math.isfinite(value) or value < 0:
        raise ValueError("Altura de antena inválida")
    return value


def clean(v):
    """Representación JSON estricta; NoData se representa con null."""
    if isinstance(v, dict):
        return {k: clean(x) for k, x in v.items()}
    if isinstance(v, (list, tuple, np.ndarray)):
        return [clean(x) for x in v]
    if isinstance(v, (float, np.floating)):
        return float(v) if np.isfinite(v) else None
    if isinstance(v, np.generic):
        return v.item()
    return v


def dump(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(clean(value), ensure_ascii=False, allow_nan=False), encoding="utf-8")


class DEM:
    def __init__(self, path):
        self.src = rasterio.open(path)
        try:
            self.crs = CRS(self.src.crs)
            t = self.src.transform
            radius = self.crs.ellipsoid.semi_major_metre
            if (not self.crs.is_projected or abs(radius - 1737400) > 100
                    or not math.isclose(radius, self.crs.ellipsoid.semi_minor_metre, abs_tol=0.01)):
                raise ValueError("Se requiere un DEM lunar proyectado sobre esfera de radio ~1737400 m")
            if any(a.unit_conversion_factor != 1 for a in self.crs.axis_info):
                raise ValueError("Las coordenadas proyectadas deben estar en metros")
            if t.b or t.d or t.a <= 0 or t.e >= 0:
                raise ValueError("Se requiere raster orientado al norte, sin rotación")
            if "stereographic" not in self.crs.coordinate_operation.method_name.lower():
                raise ValueError("Este prototipo admite proyección estereográfica lunar")
            self.radius = radius
            self.geo = self.crs.geodetic_crs
            self.to_geo = Transformer.from_crs(self.crs, self.geo, always_xy=True)
            self.to_xy = Transformer.from_crs(self.geo, self.crs, always_xy=True)
            self.geod = Geod(a=radius, b=radius)
            self.proj = Proj(self.crs)
        except Exception:
            self.src.close()
            raise

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.src.close()

    def read(self, window=None):
        z = self.src.read(1, window=window, masked=True).astype("float64").filled(np.nan)
        return z * self.src.scales[0] + self.src.offsets[0]

    def sample(self, lon, lat):
        """Interpolación bilineal estricta; fuera de cobertura o huecos => NaN."""
        lon, lat = np.broadcast_arrays(lon, lat)
        x, y = self.to_xy.transform(lon, lat)
        inv = ~self.src.transform
        c = inv.a*np.asarray(x) + inv.b*np.asarray(y) + inv.c
        r = inv.d*np.asarray(x) + inv.e*np.asarray(y) + inv.f
        c, r = np.asarray(c) - 0.5, np.asarray(r) - 0.5
        c0, r0 = np.floor(c).astype(int), np.floor(r).astype(int)
        valid = (c0 >= 0) & (r0 >= 0) & (c0 + 1 < self.src.width) & (r0 + 1 < self.src.height)
        out = np.full(lon.shape, np.nan)
        if np.any(valid):
            cc, rr = c0[valid], r0[valid]
            left, top, right, bottom = cc.min(), rr.min(), cc.max() + 2, rr.max() + 2
            z = self.read(Window(int(left), int(top), int(right-left), int(bottom-top)))
            i, j = rr - top, cc - left
            fc, fr = c[valid] - cc, r[valid] - rr
            out[valid] = ((1-fr)*((1-fc)*z[i,j] + fc*z[i,j+1])
                          + fr*((1-fc)*z[i+1,j] + fc*z[i+1,j+1]))
        return out

    def site(self, lon, lat):
        if not np.isfinite([lon, lat]).all() or not -90 < lat < 90:
            raise ValueError("Coordenadas inválidas; evitar el polo exacto donde el azimut es singular")
        z = float(self.sample(lon, lat))
        if not np.isfinite(z):
            raise ValueError("Sitio fuera del DEM o sin elevación válida")
        return z


def slope_formula(z, dx, dy, scale=1):
    """θ=atan(sqrt((∂z/∂x)^2+(∂z/∂y)^2)), en grados.

    scale convierte el gradiente cartográfico al físico (proyección conforme).
    Se invalidan bordes y centros cuyo stencil de diferencias toca NoData.
    """
    gy, gx = np.gradient(z, positive(dy), positive(dx))
    result = np.degrees(np.arctan(np.hypot(gx, gy) * scale))
    valid = np.isfinite(z)
    valid[1:-1, 1:-1] &= (np.isfinite(z[:-2, 1:-1]) & np.isfinite(z[2:, 1:-1])
                            & np.isfinite(z[1:-1, :-2]) & np.isfinite(z[1:-1, 2:]))
    valid[[0, -1], :] = False
    valid[:, [0, -1]] = False
    return np.where(valid, result, np.nan)


def slopes(dem_path, output, threshold=10, block=512):
    """Procesa todo el DEM por bloques con halo: no carga el mosaico completo."""
    if not math.isfinite(threshold) or not 0 <= threshold < 90:
        raise ValueError("El umbral debe estar entre 0 y 90 grados")
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    if Path(dem_path).resolve() == (output / "slope_deg.tif").resolve():
        raise ValueError("La salida no puede sobrescribir la entrada")
    with DEM(dem_path) as dem:
        src = dem.src
        profile = src.profile.copy()
        profile.update(driver="GTiff", count=1, dtype="float32", nodata=-9999,
                       compress="deflate", tiled=True, blockxsize=256, blockysize=256, BIGTIFF="IF_SAFER")
        count, low, total = 0, 0, 0.0
        with rasterio.open(output / "slope_deg.tif", "w", **profile) as dst:
            dst.update_tags(units="degree", formula="atan(hypot(dz_dx,dz_dy))", threshold_deg=threshold)
            for row in range(0, src.height, block):
                for col in range(0, src.width, block):
                    h, w = min(block, src.height-row), min(block, src.width-col)
                    r0, c0 = max(0, row-1), max(0, col-1)
                    r1, c1 = min(src.height, row+h+1), min(src.width, col+w+1)
                    z = dem.read(Window(c0, r0, c1-c0, r1-r0))
                    if min(z.shape) < 3:
                        raise ValueError("DEM demasiado pequeño")
                    rr, cc = np.mgrid[r0:r1, c0:c1]
                    x = src.transform.a*(cc+0.5) + src.transform.c
                    y = src.transform.e*(rr+0.5) + src.transform.f
                    lon, lat = dem.to_geo.transform(x, y)
                    # Estereográfica conforme: ds_grid = k * ds_sphere.
                    k = np.asarray(dem.proj.get_factors(lon, lat).meridional_scale)
                    s = slope_formula(z, src.transform.a, -src.transform.e, k)
                    s = s[row-r0:row-r0+h, col-c0:col-c0+w]
                    finite = s[np.isfinite(s)]
                    count += finite.size
                    total += float(finite.sum())
                    low += int(np.count_nonzero(finite <= threshold))
                    dst.write(np.where(np.isfinite(s), s, -9999).astype("float32"), 1,
                              window=Window(col, row, w, h))
        summary = {"source": str(dem_path), "valid_pixels": count,
                   "mean_slope_deg": total/count if count else None,
                   "threshold_deg": threshold, "pixels_below_threshold": low,
                   "fraction_of_valid_pixels_below_threshold": low/count if count else None,
                   "warning": "Umbral configurable de demostración; no certifica seguridad de aterrizaje ni movilidad."}
        dump(output / "summary.json", summary)
        # Grilla acotada para la interfaz; el producto completo sigue en GeoTIFF.
        with rasterio.open(output / "slope_deg.tif") as slope:
            sh = (min(256, src.height), min(256, src.width))
            preview = slope.read(1, out_shape=sh, masked=True).filled(np.nan)
        dump(output / "terrain.json", {"schema_version": 1, "source": str(dem_path),
             "crs_wkt": src.crs.to_wkt(), "frame": "MOON_ME_DE421 (según producto PGDA)",
             "bounds_xy_m": list(src.bounds), "row_order": "north_to_south",
             "preview_sampling": "nearest; pendiente calculada a resolución nativa antes de reducir",
             "slope_deg": preview, "summary": summary})
        return summary


def compare_slopes(calculated, reference):
    """Comparación descriptiva, sin asumir idéntico algoritmo o escala espacial."""
    count, absolute, squared, bias = 0, 0.0, 0.0, 0.0
    with rasterio.open(calculated) as a, rasterio.open(reference) as b:
        if a.shape != b.shape or a.crs != b.crs or a.transform != b.transform:
            raise ValueError("La comparación exige grillas y CRS idénticos")
        for _, window in a.block_windows(1):
            x = a.read(1, window=window, masked=True).astype("float64").filled(np.nan)
            y = b.read(1, window=window, masked=True).astype("float64").filled(np.nan)
            x = x*a.scales[0]+a.offsets[0]
            y = y*b.scales[0]+b.offsets[0]
            valid = np.isfinite(x) & np.isfinite(y)
            diff = (x-y)[valid]
            count += diff.size
            absolute += float(np.abs(diff).sum())
            squared += float(np.square(diff).sum())
            bias += float(diff.sum())
    return {"compared_pixels": count, "mae_deg": absolute/count if count else None,
            "rmse_deg": math.sqrt(squared/count) if count else None,
            "mean_calculated_minus_reference_deg": bias/count if count else None,
            "warning": "Diferencias de algoritmo, stencil y escala impiden exigir igualdad; esto no es certificación científica."}


def chord_radius(radius_a, radius_b, angle, fraction):
    phi = angle * np.asarray(fraction)
    return radius_a * radius_b * np.sin(angle) / (
        radius_b * np.sin(angle-phi) + radius_a * np.sin(phi))


def profile(dem, a, b, antenna_a=2, antenna_b=2, step=5):
    za, zb = dem.site(*a), dem.site(*b)
    height(antenna_a); height(antenna_b)
    az, _, distance = dem.geod.inv(*a, *b)
    if distance < 0.01 or distance > dem.radius * 0.2:
        raise ValueError("Elegir puntos separados entre 1 cm y ~347 km")
    n = math.ceil(distance/positive(step)) + 1
    if n > 200000:
        raise ValueError("Demasiadas muestras; aumentar step")
    d = np.linspace(0, distance, n)
    lon, lat, _ = dem.geod.fwd(np.full(n,a[0]), np.full(n,a[1]), np.full(n,az), d)
    z = dem.sample(lon, lat)
    ray = chord_radius(dem.radius+za+antenna_a, dem.radius+zb+antenna_b, distance/dem.radius, d/distance)
    clearance = ray - (dem.radius+z)
    interior = clearance[1:-1]
    complete = bool(np.isfinite(z).all())
    blocked = bool(np.any(interior <= 0))
    status = "blocked" if blocked else "clear_sampled" if complete else "unknown"
    return {"schema_version": 1, "model": "spherical_geometric_sampled_no_refraction",
            "status": status, "coverage_complete": complete, "a_lon_lat": a, "b_lon_lat": b,
            "antenna_a_m": antenna_a, "antenna_b_m": antenna_b,
            "distance_m": d, "terrain_elevation_m": z, "ray_elevation_m": ray-dem.radius,
            "radial_clearance_m": clearance,
            "warning": "Despeje geométrico muestreado; no incluye Fresnel, rocas subpíxel ni balance de enlace."}


def horizon(dem, site, antenna=2, radius=10000, step=20, az_step=2):
    z0 = dem.site(*site)
    height(antenna); positive(radius); positive(step); positive(az_step)
    if radius > dem.radius * 0.2 or az_step > 90:
        raise ValueError("Radio máximo ~347 km; paso azimutal máximo 90°")
    distance = np.linspace(0, radius, math.ceil(radius/step)+1)[1:]
    azimuths = np.linspace(0, 360, math.ceil(360/az_step), endpoint=False)
    if len(distance)*len(azimuths) > 5000000:
        raise ValueError("Demasiadas muestras; aumentar pasos o reducir radio")
    rows = []
    for az in azimuths:
        lon, lat, _ = dem.geod.fwd(np.full(distance.size, site[0]), np.full(distance.size, site[1]),
                                  np.full(distance.size, az), distance)
        z = dem.sample(lon, lat)
        angle = distance/dem.radius
        # Componentes exactas respecto del plano tangente del observador.
        up = (dem.radius+z)*np.cos(angle) - (dem.radius+z0+antenna)
        horizontal = (dem.radius+z)*np.sin(angle)
        elev = np.degrees(np.arctan2(up, horizontal))
        valid = np.isfinite(elev)
        idx = int(np.nanargmax(elev)) if valid.any() else None
        rows.append({"azimuth_deg": float(az), "elevation_deg": float(elev[idx]) if idx is not None else None,
                     "obstacle_distance_m": float(distance[idx]) if idx is not None else None,
                     "coverage_complete": bool(valid.all()), "valid_fraction": float(valid.mean())})
    return {"schema_version": 1, "site_lon_lat": site, "ground_elevation_m": z0,
            "antenna_m": antenna, "radius_m": radius, "radial_step_m": float(distance[0]),
            "azimuth_convention": "degrees clockwise from geographic north, MOON_ME_DE421",
            "azimuth_step_deg": 360/len(azimuths), "horizon": rows,
            "warning": "Horizonte muestreado dentro del radio; comprobar convergencia radial y azimutal y cobertura regional."}


def visibility(h, azimuth, elevation, margin=0):
    if not np.isfinite([azimuth, elevation, margin]).all() or not -90 <= elevation <= 90 or margin < 0:
        raise ValueError("Ángulos o margen inválidos")
    rows = h["horizon"]
    index = (azimuth % 360)/h["azimuth_step_deg"]
    # Máximo de los dos rayos vecinos: aproximación conservadora sobre rayos muestreados.
    pair = [rows[math.floor(index) % len(rows)], rows[math.ceil(index) % len(rows)]]
    values = [r["elevation_deg"] for r in pair if r["elevation_deg"] is not None]
    if not values:
        return {"status": "unknown", "clearance_deg": None}
    clearance = elevation - max(values)
    status = "blocked_sampled" if clearance <= margin else (
        "clear_within_sampled_radius" if all(r["coverage_complete"] for r in pair) else "unknown")
    return {"status": status, "clearance_deg": clearance}


def timeline(h, csv_path, margin=0):
    """CSV normalizado desde SPICE/Horizons. Evalúa cada muestra, sin inventar ventanas entre ellas."""
    from datetime import datetime
    result, previous = [], None
    with open(csv_path, encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            stamp = datetime.fromisoformat(row["time_utc"].replace("Z", "+00:00"))
            if stamp.utcoffset() is None or stamp.utcoffset().total_seconds() != 0:
                raise ValueError("Usar fechas ISO UTC con Z o +00:00")
            if previous is not None and stamp <= previous:
                raise ValueError("Fechas deben estar ordenadas y sin duplicados")
            previous = stamp
            result.append({"time_utc": row["time_utc"], **{
                target: visibility(h, float(row[f"{target}_az_deg"]), float(row[f"{target}_el_deg"]), margin)
                for target in ("earth", "sun")}})
    if not result:
        raise ValueError("CSV sin observaciones")
    return {"samples": result, "margin_deg": margin,
            "warning": "Posiciones del centro aparente: no modela discos, paneles, enlace RF ni instante exacto de transición. Validar sitio, altura y marco de las efemérides."}


def download(folder, kind):
    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / FILES[kind]
    if path.exists():
        raise ValueError(f"Ya existe {path}; no se sobrescribe")
    temporary = path.with_suffix(".part")
    url = REGIONAL_URL if kind == "regional" else BASE + FILES[kind]
    with urlopen(url, timeout=60) as response, temporary.open("wb") as f:
        while chunk := response.read(1024*1024):
            f.write(chunk)
    temporary.replace(path)
    print(path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("download")
    p.add_argument("--kind", choices=FILES, default="dem")
    p.add_argument("--out", default="data")
    p = sub.add_parser("slope")
    p.add_argument("dem"); p.add_argument("--out", default="outputs/site04")
    p.add_argument("--threshold", type=float, default=10)
    p = sub.add_parser("inspect")
    p.add_argument("dem")
    p = sub.add_parser("compare")
    p.add_argument("calculated"); p.add_argument("reference")
    p.add_argument("--out", default="outputs/site04/comparison.json")
    for command in ("profile", "horizon"):
        p = sub.add_parser(command)
        p.add_argument("dem"); p.add_argument("--out", required=True)
        p.add_argument("--a", type=float, nargs=2, required=True, metavar=("LON", "LAT"))
        p.add_argument("--antenna-a", type=float, default=2)
        p.add_argument("--step", type=positive, default=5 if command == "profile" else 20)
        if command == "profile":
            p.add_argument("--b", type=float, nargs=2, required=True, metavar=("LON", "LAT"))
            p.add_argument("--antenna-b", type=float, default=2)
        else:
            p.add_argument("--radius", type=positive, default=10000)
            p.add_argument("--az-step", type=positive, default=2)
    p = sub.add_parser("timeline")
    p.add_argument("horizon_json"); p.add_argument("ephemerides_csv")
    p.add_argument("--out", required=True); p.add_argument("--margin", type=float, default=0)
    args = parser.parse_args()
    if args.command == "download":
        download(args.out, args.kind)
    elif args.command == "slope":
        print(json.dumps(slopes(args.dem, args.out, args.threshold), indent=2))
    elif args.command == "timeline":
        h = json.loads(Path(args.horizon_json).read_text(encoding="utf-8"))
        dump(args.out, timeline(h, args.ephemerides_csv, args.margin))
    elif args.command == "compare":
        result = compare_slopes(args.calculated, args.reference)
        dump(args.out, result)
        print(json.dumps(result, indent=2))
    else:
        with DEM(args.dem) as dem:
            if args.command == "inspect":
                x, y = dem.src.xy(dem.src.height//2, dem.src.width//2)
                print(json.dumps({"shape": dem.src.shape, "resolution_m": dem.src.res,
                                  "center_lon_lat": dem.to_geo.transform(x,y),
                                  "bounds_xy_m": list(dem.src.bounds), "crs": dem.crs.to_string()}, indent=2))
            elif args.command == "profile":
                dump(args.out, profile(dem, args.a, args.b, args.antenna_a, args.antenna_b, args.step))
            else:
                dump(args.out, horizon(dem, args.a, args.antenna_a, args.radius, args.step, args.az_step))


if __name__ == "__main__":
    main()
