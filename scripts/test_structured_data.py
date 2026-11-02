"""Check structured data on the built public landing page and map tools."""

import json
from pathlib import Path
import re
import unittest

SITE = Path(__file__).resolve().parents[1] / "docs/_site"


def schemas(path):
    html = path.read_text(encoding="utf-8")
    return [json.loads(raw) for raw in re.findall(
        r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S)]


class StructuredDataTests(unittest.TestCase):
    def test_datasets_and_access_services_are_distinct(self):
        for route in ("visor", "preview", "allproviders", "wms", "wmts"):
            with self.subTest(route=route):
                blocks = schemas(SITE / route / "index.html")
                app, = [item for item in blocks if item.get("@type") == "WebApplication"]
                graph, = [item["@graph"] for item in blocks if "@graph" in item]
                self.assertEqual(len({item["@id"] for item in graph}), len(graph))
                datasets = {item["@id"]: item for item in graph if item["@type"] == "Dataset"}
                self.assertEqual({item["@id"] for item in app["about"]}, set(datasets))
                self.assertEqual(len(datasets), 1 if route == "wms" else 2)
                for dataset in datasets.values():
                    self.assertGreaterEqual(len(dataset["description"]), 50)
                    self.assertEqual(dataset["publisher"]["url"], "https://www.ign.es/")
                    self.assertEqual(dataset["license"], "https://creativecommons.org/licenses/by/4.0/")
                    self.assertNotIn("distribution", dataset)
                for service in (item for item in graph if item["@type"] == "Service"):
                    self.assertIn(service["serviceOutput"]["@id"], datasets)
                    if route in ("wms", "wmts"):
                        self.assertEqual(service["serviceType"], "OGC " + route.upper())

    def test_plugin_and_tools_have_distinct_linked_identities(self):
        code, = [item for item in schemas(SITE / "index.html")
                 if item.get("@type") == "SoftwareSourceCode"]
        self.assertEqual(code["codeRepository"], "https://github.com/dieghernan/leaflet-providersESP")
        self.assertEqual(code["programmingLanguage"], "JavaScript")
        self.assertEqual(code["license"], "https://opensource.org/licenses/MIT")
        ids = []
        for name in ("preview/index.html", "visor/index.html"):
            with self.subTest(page=name):
                app, = [item for item in schemas(SITE / name) if item.get("@type") == "WebApplication"]
                ids.append(app["@id"])
                self.assertEqual(app["isBasedOn"]["@id"], code["@id"])
                for key, value in app["isBasedOn"].items():
                    self.assertEqual(value, code[key])
                self.assertEqual(app["author"]["sameAs"], "https://orcid.org/0000-0001-8457-4658")
                self.assertGreater(len(app["description"]), 40)
        self.assertEqual(len(set(ids)), 2)

    def test_demos_do_not_advertise_the_full_dataset_catalog(self):
        for name in ("leafletproviders", "minimal", "overlays"):
            with self.subTest(demo=name):
                blocks = schemas(SITE / "demo" / name / "index.html")
                app, = [item for item in blocks if item.get("@type") == "WebApplication"]
                self.assertNotIn("about", app)
                self.assertEqual([item for item in blocks if "@graph" in item], [])


if __name__ == "__main__":
    unittest.main()
