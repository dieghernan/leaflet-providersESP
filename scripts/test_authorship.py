"""Check author identity in the generated documentation, tools and demos."""

from pathlib import Path
import unittest

import mf2py

SITE = Path(__file__).resolve().parents[1] / "docs/_site"
HOME = "https://dieghernan.github.io/"
PROJECT = HOME + "leaflet-providersESP/"


class AuthorshipTests(unittest.TestCase):
    def test_pages_keep_canonical_authorship_with_the_visual_card_hidden(self):
        routes = ("", "guia/", "capas/", "visor/", "preview/", "allproviders/",
                  "wms/", "wmts/", "demo/minimal/", "demo/overlays/", "demo/leafletproviders/")
        for route in routes:
            with self.subTest(route=route):
                url = PROJECT + route
                parsed = mf2py.parse(doc=(SITE / route / "index.html").read_text(encoding="utf-8"), url=url)
                entry, = [item for item in parsed["items"] if "h-entry" in item["type"]]
                self.assertEqual(entry["properties"]["url"], [url])
                self.assertEqual(len(entry["properties"]["name"]), 1)
                author, = entry["properties"]["author"]
                self.assertIn("h-card", author["type"])
                self.assertEqual(author["properties"]["name"], ["Diego HH"])
                self.assertEqual(author["properties"]["url"], [HOME])


if __name__ == "__main__":
    unittest.main()
