"""Check selected state providers and sample tiles: py dev/audit/audit-state-providers.py."""
import concurrent.futures
import importlib.util
import json
import pathlib
import datetime

spec = importlib.util.spec_from_file_location('audit', pathlib.Path(__file__).with_name('audit-providers.py'))
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
root = pathlib.Path(__file__).resolve().parents[2]
selection = json.loads((root / 'dev/audit/state-selection.json').read_text(encoding='utf-8'))
rows = [r for r in audit.catalog(root / 'dist/leaflet-providersESP.js') if r['name'].split('.')[0] in selection and '.' in r['name']]
services = {}
for row in rows:
    kind = 'WMTS' if '{x}' in row['url'] else 'WMS'
    services.setdefault((audit.endpoint(row), kind), []).append(row)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    capabilities = list(pool.map(audit.capabilities, services.items()))
jobs = []
for row in rows:
    for label, lon, lat, z in [('Madrid', -3.7038, 40.4166, 13), ('Valencia', -0.3763, 39.4699, 14)]:
        jobs.append((row, lon, lat, 17 if row['name'].startswith(('SIGPAC.', 'PotencialSolar.Edificios')) else z, label))
for row in rows:
    if row['options'].get('transparent'):
        jobs.append((row, -3.8, 40.7, 8, 'Centro peninsular'))
        jobs.append((row, -0.35, 39.3, 9, 'Albufera'))
    if row['name'].startswith('SIGPAC.'):
        jobs.append((row, -3.5, 40.25, 15, 'Vega del Jarama'))
        jobs.append((row, -4.8, 37.8, 17, 'Campina de Cordoba'))
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
    images = list(pool.map(lambda job: audit.image(*job), jobs))
report = dict(checked_at=datetime.datetime.now(datetime.timezone.utc).isoformat(), services=capabilities, images=images)
path = root / 'dev/audit/state-providers-audit.json'
path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
for s in capabilities:
    if s.get('error') or s.get('missing') or s.get('issues'): print(s['endpoint'],s.get('error'),s.get('missing'),s.get('issues'))
for image in images:
    if image.get('error'): print(image['name'],image['location'],image['error'])
print(len(rows), 'layers;', len(images), 'images;', sum('error' in i for i in images), 'image errors;', sum(i.get('visible_pixels',0)>0 for i in images), 'nontransparent images')

raise SystemExit(bool(any(s.get('error') or s.get('missing') or s.get('issues') for s in capabilities) or any(i.get('error') for i in images)))
