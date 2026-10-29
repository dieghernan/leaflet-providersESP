"""Build a single-file review page: py dev/manual/build-state-review.py."""
import base64
import json
import pathlib
import re

root = pathlib.Path(__file__).resolve().parents[2]
read = lambda path: (root / path).read_text(encoding='utf-8')
html = read('dev/manual/visual-check.html')
css = read('node_modules/leaflet/dist/leaflet.css')
def asset(match):
    name = match.group(1)
    data = (root / 'node_modules/leaflet/dist' / name).read_bytes()
    return 'url(data:image/png;base64,' + base64.b64encode(data).decode() + ')'
css = re.sub(r'url\((images/[^)]+)\)', asset, css)
html = html.replace('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css">', '<style>\n' + css + '\n</style>')
def script(path):
    return '<script src="data:text/javascript;base64,' + base64.b64encode((root / path).read_bytes()).decode() + '"></script>'
html = html.replace('<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"></script>', script('node_modules/leaflet/dist/leaflet.js') + '\n' + script('dist/leaflet-providersESP.min.js'))
html = html.replace('Pruebas visuales', 'Revisión de servicios estatales')
html = html.replace('Catálogo local en desarrollo · Leaflet 1.9.4. Las imágenes se solicitan a los servicios reales y necesitan conexión.', 'Archivo autónomo del PR #26 · nueva distribución minificada y Leaflet 1.9.4 incluidos. Abre este archivo con doble clic, sin instalar nada. Solo las imágenes de los mapas requieren conexión a Internet.')
html = html.replace('<label for="build">Distribución</label>\n\t\t<select id="build"><option value="source">Fuente</option><option value="minified">Minificada</option></select>', '<p class="small">Empieza por los casos pendientes, recorre los 15 servicios y explora cualquiera de las 45 capas. Cargar una imagen no garantiza que contenga datos en esa zona.</p>')
html = re.sub(r'\t\t<p class="small">ADIF.*?</p>', '<p class="small">Anota el nombre de capa, ubicación, zoom y lo observado. Usa Copiar informe para compartirlo. Los errores de red se cuentan por separado del contenido vacío.</p>', html)
start = html.index("const build = document.getElementById('build');")
end = html.index('\n\tconst places =', start)
html = html[:start] + '(() => {' + html[end:]
html = html.replace('};\ndocument.head.appendChild(plugin);', '})();')
html = html.replace("'Distribución: ' + build.value", "'Distribución minificada incluida · PR #26'")
places = dict(Madrid=[40.4166,-3.7038,13],Valencia=[39.4699,-0.3763,14],Guadarrama=[40.8,-4.05,11],Albufera=[39.3,-0.35,12],Cordoba=[37.8,-4.8,17],Jarama=[40.25,-3.5,15],Centro=[40.7,-3.8,8],Canarias=[28.3,-16.6,8],Espana=[39.4,-3.7,6])
scenarios = [
['GEODE.Cuaternario','Jarama',13,'Pendiente · Cuaternario','Busca polígonos de depósitos cuaternarios en vegas fluviales. Compara con GEODE.Geologia. Las muestras anteriores fueron transparentes.'],
['SIGPAC.PaisajeAreas','Cordoba',17,'Pendiente · Elementos del paisaje: áreas','Busca pequeños polígonos agrícolas. Prueba otras zonas rurales si no hay datos; no se ha confirmado contenido visible.'],
['SIGPAC.PaisajeLineas','Cordoba',17,'Pendiente · Elementos del paisaje: líneas','Busca elementos lineales en el campo. Desplázate y cambia el zoom; las muestras anteriores fueron transparentes.'],
['SIGPAC.PaisajePuntos','Cordoba',17,'Pendiente · Elementos del paisaje: puntos','Busca símbolos puntuales en zonas agrícolas. No dar por válida la capa únicamente porque cargue teselas.'],
['PNOAHistorico.Nacional','Valencia',14,'Reintento · Vuelo Nacional en Valencia','Esta zona devolvió HTTP 502. Comprueba si ahora se ve la fotografía aérea; distingue un error de red de un área sin cobertura.'],
['SpainByBike.TiposVia','Centro',8,'Reintento · Tipos de vía ciclista','Una petición agotó el tiempo de espera. Busca itinerarios y compara también en Valencia.'],
['PNOAHistorico.Americano','Madrid',13,'PNOA histórico · Vuelo americano','Debe verse una fotografía histórica en blanco y negro. Recorre las otras nueve variantes: cada vuelo o año tiene cobertura propia.'],
['MTNHistorico.MTN50','Madrid',13,'MTN histórico · Primeras ediciones','Debe aparecer cartografía escaneada. Compara MTN25 y Minutas. Amplía a zoom 20–22: la imagen debe reutilizar teselas del nivel 19.'],
['Inundaciones.FluvialT100','Madrid',13,'Inundaciones · Fluvial y marina','Busca zonas junto al río y compara T10, T100 y T500. Para las variantes marinas, cambia a Albufera y recorre la costa.'],
['RedNatura.General','Guadarrama',9,'Red Natura 2000','Deben aparecer espacios delimitados sobre el fondo. Baja la opacidad y comprueba la alineación.'],
['EspaciosProtegidos.General','Guadarrama',9,'Espacios naturales protegidos','Busca polígonos protegidos. Su cobertura no tiene por qué coincidir con Red Natura.'],
['SeccionesINE.Secciones2026','Madrid',13,'INE · Secciones y distritos','Deben verse límites estadísticos. Compara distritos y secciones, así como 2021 y 2026. No contiene indicadores de población.'],
['Pendientes.MDP05','Guadarrama',12,'Pendientes · MDP05','Debe distinguirse el relieve por colores. Baja la opacidad para contrastar laderas y valles con el fondo.'],
['GEODE.Geologia','Madrid',13,'GEODE · Geología','Deben aparecer unidades y contactos. Comprueba que Unidades y Contactos se puedan mostrar por separado.'],
['SIGPAC.Recintos','Cordoba',17,'SIGPAC · Recintos y cultivos','Busca límites de recintos agrícolas y compara CultivoDeclarado2025. El centro de una ciudad puede no mostrar datos.'],
['MapaForestal.Usos','Guadarrama',11,'Mapa Forestal · Usos','Busca zonas forestales coloreadas y comprueba la alineación con el fondo.'],
['Planimetrias.Minutas','Madrid',13,'Planimetrías históricas','Deben verse documentos escaneados. La fecha y la cobertura varían por hoja; comprueba también zoom 20–22.'],
['CaminosNaturales.Etapas','Centro',8,'Caminos Naturales · Etapas','Busca trazados de itinerarios y acércate a uno visible. No es una red completa de caminos.'],
['SpainByBike.Etapas','Valencia',14,'Spain by Bike · Rutas y puntos','Compara Etapas y TiposVia. Explora CentrosBTT y los puertos de montaña en zonas con cobertura.'],
['ViasPecuarias.Red2024','Centro',8,'Vías pecuarias · Red 2024','Deben aparecer trazados. Acerca sobre una línea y comprueba que sigue alineada.'],
['PotencialSolar.Global','Valencia',14,'Potencial solar · Global y edificios','Compara Global con Edificios y amplía a zoom 17. Deben aparecer colores sobre las cubiertas donde exista información.']]
html = re.sub(r'\tconst places = \{.*?\n\t\};', '\tconst places = ' + json.dumps(places) + ';', html, count=1, flags=re.S)
html = re.sub(r'\tconst scenarios = \[.*?\n\t\];', '\tconst scenarios = ' + json.dumps(scenarios,ensure_ascii=False,indent=2) + ';', html, count=1, flags=re.S)
selection = json.loads(read('dev/audit/state-selection.json'))
html = html.replace("for (const [name, provider] of Object.entries(providersESP)) {\n\t\tfor (const variant of ['', ...Object.keys(provider.variants || {})]) {", 'for (const [name, variants] of Object.entries(' + json.dumps(selection) + ')) {\n\t\tfor (const variant of Object.keys(variants)) {')
html = html.replace("map.setView(places[place].slice(0, 2), zoom);\n\t\tchangeLayer();", "if (active) map.removeLayer(active);\n\t\tmap.setView(places[place].slice(0, 2), zoom);\n\t\tchangeLayer();")
(root / 'revision-servicios-estatales.html').write_text(html,encoding='utf-8',newline='\n')
print('Built revision-servicios-estatales.html: self-contained libraries and 21 review scenarios.')
