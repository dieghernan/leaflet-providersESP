"""Audit the live catalog. Requires Node.js; --images also requires Pillow.

py dev/audit-providers.py --output audit.json
py dev/audit-providers.py --provider Cartociudad --images --output cartociudad.json

The output is evidence from one run, not a guarantee of future availability.
"""

import argparse
import concurrent.futures
import datetime
import io
import json
import math
import pathlib
import subprocess
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET


def local(tag):
    return tag.rsplit("}", 1)[-1]


def fetch(url):
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "leaflet-providersESP service audit"})
        with urllib.request.urlopen(request, timeout=25) as response:
            return response.read()
    except urllib.error.URLError as error:
        # Windows curl uses the system TLS store, unlike some Python installs.
        if "CERTIFICATE_VERIFY_FAILED" not in str(error):
            raise
        return subprocess.run(
            ["curl", "--fail", "--silent", "--show-error", "--max-time", "25", url],
            check=True, capture_output=True,
        ).stdout


def catalog(source):
    script = """
const fs = require('node:fs'), vm = require('node:vm');
const context = {L: {CRS: {EPSG4326: {code: 'EPSG:4326'}}, tileLayer: {}, Util: {extend: Object.assign}}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const rows = [];
for (const [provider, definition] of Object.entries(context.providersESP)) {
    const names = [provider, ...Object.keys(definition.variants || {}).map(v => provider + '.' + v)];
    for (const name of names) rows.push({name, ...context.providerOpts(name)});
}
process.stdout.write(JSON.stringify(rows));
"""
    result = subprocess.run(
        ["node", "-e", script, str(source)], check=True, capture_output=True,
        encoding="utf-8",
    )
    return json.loads(result.stdout)


def endpoint(row):
    url = urllib.parse.urlsplit(row["url"])
    return urllib.parse.urlunsplit((url.scheme, url.netloc, url.path, "", ""))


def capabilities(item):
    (base, kind), rows = item
    result = {"endpoint": base, "service": kind}
    version = "1.0.0" if kind == "WMTS" else "1.3.0"
    result["url"] = base + "?" + urllib.parse.urlencode({
        "service": kind, "request": "GetCapabilities", "version": version,
    })
    try:
        root = ET.fromstring(fetch(result["url"]))
        if local(root.tag) not in ("Capabilities", "WMS_Capabilities", "WMT_MS_Capabilities"):
            raise ValueError("OGC exception: " + " ".join(root.itertext()).strip()[:300])
        result["version"] = root.get("version")
        result["layers"] = []
        result["formats"] = sorted({
            c.text for e in root.iter() if local(e.tag) == "GetMap"
            for c in e if local(c.tag) == "Format"
        })

        def visit(element, inherited_crs=()):
            crs = set(inherited_crs)
            crs.update(c.text for c in element if local(c.tag) in ("CRS", "SRS"))
            if local(element.tag) == "Layer":
                record = {"crs": sorted(crs)}
                for child in element:
                    name = local(child.tag)
                    if name in ("Name", "Identifier", "Title", "MinScaleDenominator", "MaxScaleDenominator"):
                        record[name] = child.text
                    elif name == "Format":
                        record.setdefault("formats", []).append(child.text)
                    elif name == "Style":
                        record.setdefault("styles", []).extend(
                            c.text for c in child if local(c.tag) in ("Name", "Identifier")
                        )
                    elif name == "TileMatrixSetLink":
                        record.setdefault("matrix_sets", []).extend(
                            c.text for c in child if local(c.tag) == "TileMatrixSet"
                        )
                if "Name" in record or "Identifier" in record:
                    result["layers"].append(record)
            for child in element:
                visit(child, crs)

        visit(root)
        names = {layer.get("Name", layer.get("Identifier")) for layer in result["layers"]}
        missing = []
        issues = []
        configured = set()
        for row in rows:
            if kind == "WMS":
                layer = row["options"]["layers"]
            else:
                layer = dict(urllib.parse.parse_qsl(urllib.parse.urlsplit(row["url"]).query))["layer"]
                layer = layer.replace("{variant}", row["options"].get("variant", ""))
            configured.update(layer.split(","))
            options = row["options"]
            identifiers = layer.split(",") if kind == "WMS" else [layer]
            absent = [identifier for identifier in identifiers if identifier not in names]
            if absent:
                missing.append({"name": row["name"], "layer": ",".join(absent)})
                continue
            advertised = next(item for item in result["layers"] if item.get("Name", item.get("Identifier")) == identifiers[0])
            if kind == "WMS":
                if options.get("version", "1.1.1") != result["version"]:
                    issues.append({"name": row["name"], "issue": "Configured WMS version differs from negotiated capabilities"})
                crs = options.get("crs", {}).get("code", "EPSG:3857")
                for identifier in identifiers:
                    record = next(item for item in result["layers"] if item.get("Name", item.get("Identifier")) == identifier)
                    if crs not in record["crs"]:
                        issues.append({"name": row["name"], "issue": crs + " not advertised for " + identifier})
                if options.get("format", "image/jpeg") not in result["formats"]:
                    issues.append({"name": row["name"], "issue": "Image format not advertised"})
            else:
                url = row["url"]
                for key, value in options.items():
                    url = url.replace("{" + key + "}", str(value))
                params = urllib.parse.parse_qs(urllib.parse.urlsplit(url).query)
                for parameter, supported in [
                    ("version", [result["version"]]),
                    ("Format", advertised.get("formats", [])),
                    ("style", advertised.get("styles", [])),
                    ("tilematrixset", advertised.get("matrix_sets", [])),
                ]:
                    values = params.get(parameter, [])
                    if len(values) != 1 or values[0] not in supported:
                        issues.append({"name": row["name"], "issue": "Invalid or duplicate WMTS " + parameter})
        result["missing"] = missing
        result["issues"] = issues
        result["configured_layers"] = sorted(configured)
        result["additional_layers"] = [
            layer for layer in result["layers"]
            if layer.get("Name", layer.get("Identifier")) not in configured
        ]
    except Exception as error:
        result["error"] = str(error)
    return result


def image(row, lon, lat, zoom, label):
    from PIL import Image

    options = row["options"]
    n = 2 ** zoom
    x = int((lon + 180) / 360 * n)
    y = int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n)
    url = row["url"]
    if "{x}" in url:
        for key, value in {**options, "x": x, "y": y, "z": zoom}.items():
            url = url.replace("{" + key + "}", str(value))
    else:
        half = 20037508.342789244
        size = 2 * half / n
        bounds = [-half + x * size, half - (y + 1) * size, -half + (x + 1) * size, half - y * size]
        version = options.get("version", "1.1.1")
        crs = options.get("crs", {}).get("code", "EPSG:3857")
        if crs == "EPSG:4326":
            west, east = x / n * 360 - 180, (x + 1) / n * 360 - 180
            north = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
            south = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y + 1) / n))))
            bounds = [south, west, north, east] if version == "1.3.0" else [west, south, east, north]
        params = {
            "service": "WMS", "request": "GetMap", "version": version,
            "layers": options["layers"], "styles": options.get("styles", ""),
            "format": options.get("format", "image/jpeg"),
            "transparent": str(options.get("transparent", False)).lower(),
            "crs" if version == "1.3.0" else "srs": crs,
            "width": 256, "height": 256, "bbox": ",".join(map(str, bounds)),
        }
        url += ("" if url.endswith("?") else "&" if "?" in url else "?")
        url += urllib.parse.urlencode(params)
    result = {"name": row["name"], "location": label, "zoom": zoom, "url": url}
    try:
        data = fetch(url)
        try:
            bitmap = Image.open(io.BytesIO(data)).convert("RGBA")
        except Exception:
            raise ValueError("Not an image: " + data[:300].decode("utf-8", errors="replace")) from None
        result.update(size=list(bitmap.size), visible_pixels=sum(bitmap.getchannel("A").histogram()[1:]))
    except Exception as error:
        result["error"] = str(error)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=pathlib.Path, default=pathlib.Path(__file__).resolve().parents[1] / "dist/leaflet-providersESP.js")
    parser.add_argument("--provider", help="Audit only this provider")
    parser.add_argument("--images", action="store_true", help="Also request sample images (requires Pillow)")
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    rows = catalog(args.source)
    if args.provider:
        rows = [row for row in rows if row["name"].split(".")[0] == args.provider]
        if not rows:
            parser.error("Unknown provider: " + args.provider)
    services = {}
    for row in rows:
        if "{x}" in row["url"] and "service=WMTS" not in row["url"]:
            continue  # XYZ providers do not have OGC capabilities.
        kind = "WMTS" if "{x}" in row["url"] else "WMS"
        services.setdefault((endpoint(row), kind), []).append(row)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(capabilities, services.items()))
    report = {"checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(), "catalog": rows, "services": results}
    if args.images:
        jobs = []
        for row in rows:
            if row["name"].split(".")[0] == "Cartociudad":
                for label, lon, lat in [("Madrid", -3.7038, 40.4166), ("Logrono", -2.4456, 42.465)]:
                    for zoom in range(9, 19):
                        jobs.append((row, lon, lat, zoom, label))
            else:
                lon, lat, zoom, label = -3.7038, 40.4166, max(12, row["options"].get("minZoom", 0)), "Madrid"
                if row["name"].startswith("IDErioja"):
                    lon, lat, label = -2.4456, 42.465, "Logrono"
                jobs.append((row, lon, lat, zoom, label))
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            report["images"] = list(pool.map(lambda job: image(*job), jobs))
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    errors = sum("error" in service or bool(service.get("missing")) or bool(service.get("issues")) for service in results)
    errors += sum("error" in sample for sample in report.get("images", []))
    print(f"{len(rows)} configurations; {len(results)} services; {errors} failed checks. Evidence: {args.output}")
    raise SystemExit(bool(errors))


if __name__ == "__main__":
    main()
