export function assess(round, selected) {
  const ids=new Set(selected);
  const known=new Set(round.tiles.map(t=>t.id));
  if([...ids].some(id=>!known.has(id)))throw Error('Cuadrante desconocido');
  const favorable=round.tiles.filter(t=>t.status==='candidate');
  const correct=favorable.filter(t=>ids.has(t.id)).map(t=>t.id);
  const review=round.tiles.filter(t=>ids.has(t.id)&&t.status!=='candidate').map(t=>t.id);
  const missing=favorable.filter(t=>!ids.has(t.id)).map(t=>t.id);
  return {correct,review,missing,completed:correct.length>=1&&review.length===0};
}

export function annotation(dataset,round,selected,assisted,attempt){
  return {schema_version:1,purpose:'team_review_not_NASA_submission',created_at:new Date().toISOString(),
    dataset:dataset.dataset,dataset_sha256:dataset.dataset_sha256,rule_version:dataset.rule_version,
    sector_id:round.id,pixel_window:round.pixel_window,selected_tiles:[...selected],
    assisted:Boolean(assisted),attempt,selection_stage:'before_feedback',
    cells:round.tiles.filter(t=>selected.has(t.id)).map(t=>({id:t.id,bounds_xy_m:t.bounds_xy_m}))};
}
