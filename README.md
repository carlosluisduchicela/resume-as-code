# resume-as-code

**One structured JSON file is the only source of truth for your resume — every surface (ATS text, human resume, LinkedIn) is generated from it, and a checker verifies the surfaces never contradict each other.**

![no build step](https://img.shields.io/badge/build-none-brightgreen) ![python](https://img.shields.io/badge/python-stdlib_only-blue) ![license](https://img.shields.io/badge/license-MIT-lightgrey)

## What it does

- **Generates three surfaces from one edit** — ATS-safe plain text, a human-readable resume (Markdown in the CLI, a styled preview in the web demo), and LinkedIn headline + About text. Change a fact once, in `resume.json`; regenerate; every surface updates.
- **Checks consistency across surfaces** — paste profile text (e.g. from LinkedIn) and the checker reports **matches**, **missing** entries, and **contradictions**: employers named in the pasted text that do not exist in the source JSON.
- **Runs anywhere, offline** — the web demo is plain HTML/CSS/JS with no build step, no CDN, and no network calls; the CLI is Python 3 standard library only.

The bundled sample resume belongs to **Alex Rivera, a fictional product manager**. The sample LinkedIn text in `sample/linkedin.txt` deliberately contains one extra employer (`OldCo Logistics`) that is not in the JSON — run the checker and watch it get caught.

## Guardrails

- **Never invents facts.** The source JSON is the only truth. The generators and checker reformat and compare; they never add a metric, title, employer, or keyword that is not in the source.
- **No content "improvement."** No AI rewriting, no keyword stuffing, no embellishment. Wording decisions stay with the human.
- **Nothing leaves the machine.** The web demo processes text entirely in your browser; the CLI only reads and writes local files.
- **Sample data is fake.** Names, companies, emails, and metrics in `sample/` are invented for demonstration.

## Run the web demo

No server or build step is required:

```bash
# Option A: just open the file
open index.html            # macOS; or double-click it

# Option B: serve the folder (e.g. for GitHub Pages-style hosting)
python3 -m http.server 8000
# then visit http://localhost:8000
```

Left panel: edit the resume JSON (or click **Load Sample**). Click **Generate outputs** to see the ATS text, the styled human resume, and the LinkedIn text. Paste profile text below and click **Run consistency check**. **Download** buttons export `ats.txt` and `resume.md`.

## Run the CLI

```bash
python3 resume.py --help
python3 resume.py sample/resume.json --out out
# writes out/ats.txt, out/resume.md, out/linkedin.txt

python3 resume.py sample/resume.json --out out --check sample/linkedin.txt
# additionally prints the consistency report (exit code 2 when
# contradictions or missing entries are found — the check above
# will find OldCo Logistics)
```

## Architecture

```
resume.json ──┬─► generate_ats()       ─► ats.txt        (single column, plain text)
              ├─► generate_markdown()  ─► resume.md      (human-readable)
              └─► generate_linkedin()  ─► linkedin.txt   (headline + About)

pasted profile text ─► check_consistency(source, text)
                         ├─ matches        (employer + title in both)
                         ├─ missing        (in JSON, absent from text)
                         └─ contradictions (employer in text, absent from JSON)
```

- `resume.py` — generators, checker, and CLI (Python stdlib only).
- `app.js` — the same generator/checker logic for the browser; Python and JS implementations are kept in sync and covered by the same expectations.
- `index.html` / `styles.css` — static demo shell, responsive, works on mobile.
- `sample/` — fictional source JSON and a pasted-profile fixture with one planted contradiction.
- `tests/` — `unittest` suite (see below).
- `docs/PRD.md` — the one-page product requirements doc for this project.

**Checker design:** presence matching is case-insensitive substring matching on employer and title. Contradictions are extracted from experience lines written in the common `Title at Company` form (one per line), which is how LinkedIn experience entries copy out.

## Evals / tests

```bash
python3 -m unittest discover -s tests -v
node --check app.js   # if Node is available: syntax-checks the web demo
```

The suite covers: ATS output contains the name, headline, all skills, companies, titles, and bullets; LinkedIn and Markdown outputs are derived from the JSON; the checker flags the planted `OldCo Logistics` contradiction in the sample fixture, passes a fully matching profile text, and reports missing roles.

## Limitations

Stated plainly:

- **Substring matching is simple, on purpose.** A title that changed wording (not just formatting) between surfaces will read as "missing," and an employer whose name is a common substring can false-positive a match. It is a drift alarm, not a semantic judge.
- **Contradiction extraction depends on the `Title at Company` line form.** Free-form prose paragraphs mentioning "...at <Company>" mid-sentence can be parsed as an experience line, and experience entries written in other formats won't be extracted.
- **No PDF generation.** The CLI emits `.txt` and `.md`; the styled resume is a browser preview. Print the preview to PDF if you need one.
- **Single person, single file.** No multi-resume management, no version history beyond what your own git repo gives you (which is, admittedly, the point of the name).
- **Dates are free text.** The tool does not validate date ranges or overlapping roles.

## License

MIT — see [LICENSE](LICENSE).
