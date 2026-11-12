"""Tests for resume.py — run: python3 -m unittest discover -s tests -v"""

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import resume  # noqa: E402


def load_sample():
    return json.loads((ROOT / "sample" / "resume.json").read_text(encoding="utf-8"))


class GeneratorTests(unittest.TestCase):
    def setUp(self):
        self.data = load_sample()

    def test_ats_contains_name_and_headline(self):
        ats = resume.generate_ats(self.data)
        self.assertIn("ALEX RIVERA", ats)
        self.assertIn("Senior Product Manager, Growth", ats)

    def test_ats_contains_all_skills_and_companies(self):
        ats = resume.generate_ats(self.data)
        for skill in self.data["skills"]:
            self.assertIn(skill, ats)
        for role in self.data["experience"]:
            self.assertIn(role["company"], ats)
            self.assertIn(role["title"], ats)
            for bullet in role["bullets"]:
                self.assertIn(bullet, ats)

    def test_linkedin_output_is_derived_from_json(self):
        out = resume.generate_linkedin(self.data)
        self.assertIn(self.data["headline"], out)
        self.assertIn(self.data["experience"][0]["company"], out)

    def test_markdown_contains_education(self):
        md = resume.generate_markdown(self.data)
        self.assertIn(self.data["education"][0]["school"], md)


class ConsistencyTests(unittest.TestCase):
    def setUp(self):
        self.data = load_sample()

    def test_checker_flags_planted_contradiction(self):
        text = (ROOT / "sample" / "linkedin.txt").read_text(encoding="utf-8")
        result = resume.check_consistency(self.data, text)
        self.assertIn("OldCo Logistics", result["contradictions"])
        self.assertEqual(result["missing"], [])
        self.assertEqual(len(result["matches"]), 3)

    def test_checker_passes_matching_text(self):
        lines = ["Alex Rivera", "", "Experience"]
        for role in self.data["experience"]:
            lines.append(f"{role['title']} at {role['company']}")
        result = resume.check_consistency(self.data, "\n".join(lines))
        self.assertEqual(result["contradictions"], [])
        self.assertEqual(result["missing"], [])
        self.assertEqual(len(result["matches"]), len(self.data["experience"]))

    def test_checker_reports_missing_role(self):
        first = self.data["experience"][0]
        text = f"{first['title']} at {first['company']}"
        result = resume.check_consistency(self.data, text)
        self.assertEqual(len(result["missing"]), len(self.data["experience"]) - 1)


if __name__ == "__main__":
    unittest.main()
