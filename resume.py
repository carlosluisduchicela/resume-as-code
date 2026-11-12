#!/usr/bin/env python3
"""resume-as-code: generate every resume surface from one source JSON file.

Usage:
    python3 resume.py sample/resume.json
    python3 resume.py sample/resume.json --out out --check sample/linkedin.txt

The source JSON is the only truth. This tool reformats and checks it;
it never adds, infers, or embellishes a fact. Standard library only.
"""

import argparse
import json
import re
import sys
from pathlib import Path


# --------------------------------------------------------------------------
# Generators
# --------------------------------------------------------------------------

def _contact_line(data):
    parts = [data.get("location", ""), data.get("email", ""), data.get("phone", "")]
    parts += data.get("links", [])
    return " | ".join(p for p in parts if p)


def generate_ats(data):
    """Plain-text resume: single column, no tables, no graphics. ATS-safe."""
    lines = [data["name"].upper(), data.get("headline", ""), _contact_line(data), ""]
    if data.get("summary"):
        lines += ["SUMMARY", data["summary"], ""]
    if data.get("skills"):
        lines += ["SKILLS", ", ".join(data["skills"]), ""]
    lines.append("EXPERIENCE")
    for role in data.get("experience", []):
        lines.append(
            f"{role['title']} | {role['company']} | {role.get('location', '')} | "
            f"{role.get('start', '')} - {role.get('end', '')}".rstrip(" |")
        )
        for bullet in role.get("bullets", []):
            lines.append(f"- {bullet}")
        lines.append("")
    if data.get("education"):
        lines.append("EDUCATION")
        for edu in data["education"]:
            lines.append(f"{edu.get('degree', '')}, {edu.get('school', '')}, {edu.get('year', '')}")
    return "\n".join(lines).rstrip() + "\n"


def generate_markdown(data):
    """Human-readable Markdown resume."""
    lines = [f"# {data['name']}", f"**{data.get('headline', '')}**", "", _contact_line(data), ""]
    if data.get("summary"):
        lines += ["## Summary", data["summary"], ""]
    if data.get("skills"):
        lines += ["## Skills", ", ".join(data["skills"]), ""]
    lines.append("## Experience")
    for role in data.get("experience", []):
        lines.append(
            f"### {role['title']} — {role['company']} "
            f"({role.get('start', '')} – {role.get('end', '')})"
        )
        for bullet in role.get("bullets", []):
            lines.append(f"- {bullet}")
        lines.append("")
    if data.get("education"):
        lines.append("## Education")
        for edu in data["education"]:
            lines.append(f"- {edu.get('degree', '')}, {edu.get('school', '')}, {edu.get('year', '')}")
    return "\n".join(lines).rstrip() + "\n"


def generate_linkedin(data):
    """LinkedIn headline + About text, derived only from the JSON."""
    lines = [f"Headline: {data.get('headline', '')}", "", "About:"]
    if data.get("summary"):
        lines.append(data["summary"])
    roles = data.get("experience", [])
    if roles:
        current = roles[0]
        lines.append(
            f"Currently: {current['title']} at {current['company']}. "
            f"Previously: " + ", ".join(
                f"{r['title']} at {r['company']}" for r in roles[1:]
            ) + "."
        )
    if data.get("skills"):
        lines.append("Skills: " + ", ".join(data["skills"]))
    lines.append(f"Based in {data.get('location', '')}.")
    return "\n".join(lines).rstrip() + "\n"


# --------------------------------------------------------------------------
# Consistency checker
# --------------------------------------------------------------------------

# Experience lines in pasted profile text are expected in the common form
# "Title at Company" (one per line), as exported / copied from LinkedIn.
_EXPERIENCE_LINE = re.compile(r"^(?:[-*\u2022]\s*)?(?P<title>.+?)\s+at\s+(?P<company>.+?)\s*$")


def extract_text_employers(text):
    """Return company names parsed from 'Title at Company' lines in text."""
    companies = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.lower() in {"experience", "about", "education"}:
            continue
        m = _EXPERIENCE_LINE.match(line)
        if m:
            company = m.group("company").strip(" .")
            if company and company not in companies:
                companies.append(company)
    return companies


def check_consistency(data, text):
    """Compare JSON employers/titles against pasted profile text.

    Returns a dict with three lists:
      matches:       "Company — Title" pairs found in the text
      missing:       "Company — Title" pairs in the JSON but absent from text
      contradictions: employers named in the text but not in the JSON
    Matching is case-insensitive substring matching; see README limitations.
    """
    haystack = text.lower()
    matches, missing = [], []
    json_companies = set()
    for role in data.get("experience", []):
        company = role.get("company", "")
        title = role.get("title", "")
        json_companies.add(company.lower())
        label = f"{company} — {title}"
        if company.lower() in haystack and title.lower() in haystack:
            matches.append(label)
        else:
            missing.append(label)
    contradictions = [
        c for c in extract_text_employers(text) if c.lower() not in json_companies
    ]
    return {"matches": matches, "missing": missing, "contradictions": contradictions}


def format_report(result):
    out = ["Consistency check", "-----------------"]
    out.append(f"Matches ({len(result['matches'])}):")
    out += [f"  OK       {m}" for m in result["matches"]] or ["  (none)"]
    out.append(f"Missing from pasted text ({len(result['missing'])}):")
    out += [f"  MISSING  {m}" for m in result["missing"]] or ["  (none)"]
    out.append(f"Contradictions — in pasted text but not in source JSON ({len(result['contradictions'])}):")
    out += [f"  EXTRA    {c}" for c in result["contradictions"]] or ["  (none)"]
    return "\n".join(out)


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------

def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Generate ATS text, Markdown, and LinkedIn outputs from one resume JSON file."
    )
    parser.add_argument("input", help="Path to the source resume JSON file.")
    parser.add_argument(
        "-o", "--out", default="out",
        help="Output directory for ats.txt, resume.md, linkedin.txt (default: out).",
    )
    parser.add_argument(
        "--check", metavar="FILE",
        help="Optional file of pasted LinkedIn profile text to consistency-check "
             "against the source JSON. Its result is printed, never overwritten.",
    )
    args = parser.parse_args(argv)

    try:
        data = json.loads(Path(args.input).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"error: cannot read {args.input}: {exc}", file=sys.stderr)
        return 1

    outdir = Path(args.out)
    outdir.mkdir(parents=True, exist_ok=True)
    outputs = {
        "ats.txt": generate_ats(data),
        "resume.md": generate_markdown(data),
        "linkedin.txt": generate_linkedin(data),
    }
    for name, content in outputs.items():
        (outdir / name).write_text(content, encoding="utf-8")
        print(f"wrote {outdir / name}")

    if args.check:
        try:
            text = Path(args.check).read_text(encoding="utf-8")
        except OSError as exc:
            print(f"error: cannot read {args.check}: {exc}", file=sys.stderr)
            return 1
        result = check_consistency(data, text)
        print()
        print(format_report(result))
        if result["contradictions"] or result["missing"]:
            return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
