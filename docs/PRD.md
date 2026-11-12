# PRD — resume-as-code

**One-liner:** One structured JSON file generates every resume surface (ATS text, human resume, LinkedIn) and checks those surfaces against each other, so they can never silently contradict each other.

## Problem

Senior candidates maintain 3–5 versions of the same career facts: an ATS resume, a one-page human resume, lane/tailored variants, and a LinkedIn profile. They are edited by hand, in different tools, at different times. The copies drift: titles differ, employers appear in one surface and not another, and keywords that real job descriptions actually use never make it into the resume. Recruiters and automated screeners cross-check these surfaces — drift reads as inaccuracy.

## Users

- Senior job seekers (primary: product leaders) maintaining multiple resume variants and a LinkedIn profile.
- Career coaches / resume reviewers who need a single verifiable source to audit against.

## Scope (v1)

- A documented JSON schema for one person's resume (contact, summary, skills, experience with metric bullets, education).
- Generators: ATS plain text, Markdown/human resume, LinkedIn headline + About text. Web demo (static, offline) plus a Python CLI (stdlib only) with identical output logic.
- A consistency checker: employers/titles from the JSON compared against pasted profile text, reporting matches, missing entries, and contradictions (employers in the text that are not in the source).
- Sample data that is entirely fictional, including one deliberately planted contradiction so the checker can be seen catching a real inconsistency.

## Non-goals

- No writing or improving of content: no AI rewriting, no keyword stuffing, no invented or embellished facts.
- No job-board integration, no application submitting, no LinkedIn API access or scraping.
- No multi-person / team database, no server, no accounts. Everything runs locally or as a static page.

## Guardrail

The source JSON is the only truth. Generators and the checker may reformat and compare, but may never add a fact that is not in the source. Any feature that would violate this is out of scope by definition.

## Success criteria

- Editing one fact in the JSON and regenerating updates all three surfaces with zero hand edits.
- The checker catches 100% of planted contradictions in the test fixtures, and passes a fully matching profile text.
- The web demo works offline from a plain static file host (e.g. GitHub Pages), with no build step and no CDN.
- The CLI test suite passes: `python3 -m unittest discover -s tests -v`.
