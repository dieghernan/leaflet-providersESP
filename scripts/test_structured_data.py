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
                self.assertEqual(app["author"]["sameAs"], "https://orcid.org/0000-0001-8457-4658")
                self.assertGreater(len(app["description"]), 40)
        self.assertEqual(len(set(ids)), 2)


if __name__ == "__main__":
    unittest.main()
