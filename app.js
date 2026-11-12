"use strict";

/* resume-as-code web demo.
 * The structured source is the only source of truth.
 * This file only reformats and checks it — it never invents a fact.
 * The generators + consistency checker mirror resume.py (Python, stdlib)
 * so browser and CLI outputs agree. The lint panel is a web-only extra.
 */

const SAMPLE = {
  name: "Alex Rivera",
  headline: "Senior Product Manager, Growth | PLG, Onboarding & Monetization",
  location: "New York, NY",
  email: "alex.rivera@example.com",
  phone: "555-010-2030",
  links: [
    "linkedin.com/in/alexrivera-example",
    "github.com/alexrivera-example",
  ],
  summary:
    "Product manager with 8 years building consumer and B2B products across onboarding, pricing, and self-serve growth. I work from data, ship small experiments quickly, and write the specs I prototype.",
  skills: [
    "Product Strategy",
    "Growth & PLG",
    "Experimentation / A/B Testing",
    "Pricing & Packaging",
    "SQL",
    "Python",
    "User Research",
    "Analytics Instrumentation",
  ],
  experience: [
    {
      title: "Senior Product Manager, Growth",
      company: "Helios Health",
      location: "New York, NY",
      start: "2023",
      end: "Present",
      bullets: [
        "Led onboarding redesign that raised trial-to-paid conversion by 18% across 40,000 monthly signups.",
        "Ran a 12-experiment pricing and paywall program that added $1.2M in annualized revenue.",
        "Built a self-serve analytics dashboard used weekly by a 15-person product and design team.",
      ],
    },
    {
      title: "Product Manager, Checkout",
      company: "Cartloop",
      location: "Remote, US",
      start: "2020",
      end: "2023",
      bullets: [
        "Owned checkout funnel for an e-commerce platform processing $85M in annual volume.",
        "Cut checkout abandonment by 9% by removing two form steps and adding wallet payments.",
        "Shipped address validation that reduced failed deliveries by 14%.",
      ],
    },
    {
      title: "Associate Product Manager",
      company: "Finch Financial",
      location: "Chicago, IL",
      start: "2017",
      end: "2020",
      bullets: [
        "Launched a budgeting feature adopted by 22% of active users in its first quarter.",
        "Wrote SQL analyses that identified the top 3 churn drivers for a 200,000-user base.",
        "Coordinated releases across a 6-person engineering team on a two-week cadence.",
      ],
    },
  ],
  education: [
    {
      school: "State University (Example)",
      degree: "B.S., Business Administration",
      year: "2017",
    },
  ],
};

/* Deliberately contains ONE contradiction vs. SAMPLE:
 * "OldCo Logistics" appears here but not in the JSON. */
const SAMPLE_LINKEDIN = [
  "Alex Rivera",
  "Senior Product Manager, Growth | PLG, Onboarding & Monetization",
  "New York, NY",
  "",
  "About",
  "Product manager with 8 years building consumer and B2B products across",
  "onboarding, pricing, and self-serve growth.",
  "",
  "Experience",
  "Senior Product Manager, Growth at Helios Health",
  "2023 - Present, New York, NY",
  "",
  "Product Manager, Checkout at Cartloop",
  "2020 - 2023, Remote, US",
  "",
  "Associate Product Manager at Finch Financial",
  "2017 - 2020, Chicago, IL",
  "",
  "Product Intern at OldCo Logistics",
  "2016 - 2017, Chicago, IL",
  "",
  "Education",
  "State University (Example)",
  "B.S., Business Administration, 2017",
  "",
].join("\n");

/* ------------------------------------------------------------------ */
/* Generators (mirror resume.py)                                       */
/* ------------------------------------------------------------------ */

function contactLine(data) {
  const parts = [data.location || "", data.email || "", data.phone || ""];
  (data.links || []).forEach(function (l) { parts.push(l); });
  return parts.filter(Boolean).join(" | ");
}

function generateAts(data) {
  const lines = [(data.name || "").toUpperCase(), data.headline || "", contactLine(data), ""];
  if (data.summary) lines.push("SUMMARY", data.summary, "");
  if (data.skills && data.skills.length) lines.push("SKILLS", data.skills.join(", "), "");
  lines.push("EXPERIENCE");
  (data.experience || []).forEach(function (role) {
    lines.push(
      [role.title, role.company, role.location || "", (role.start || "") + " - " + (role.end || "")]
        .filter(Boolean).join(" | ")
    );
    (role.bullets || []).forEach(function (b) { lines.push("- " + b); });
    lines.push("");
  });
  if (data.education && data.education.length) {
    lines.push("EDUCATION");
    data.education.forEach(function (e) {
      lines.push([e.degree, e.school, e.year].filter(Boolean).join(", "));
    });
  }
  return lines.join("\n").replace(/\s+$/, "") + "\n";
}

function generateMarkdown(data) {
  const lines = ["# " + (data.name || ""), "**" + (data.headline || "") + "**", "", contactLine(data), ""];
  if (data.summary) lines.push("## Summary", data.summary, "");
  if (data.skills && data.skills.length) lines.push("## Skills", data.skills.join(", "), "");
  lines.push("## Experience");
  (data.experience || []).forEach(function (role) {
    lines.push("### " + role.title + " — " + role.company + " (" + (role.start || "") + " – " + (role.end || "") + ")");
    (role.bullets || []).forEach(function (b) { lines.push("- " + b); });
    lines.push("");
  });
  if (data.education && data.education.length) {
    lines.push("## Education");
    data.education.forEach(function (e) {
      lines.push("- " + [e.degree, e.school, e.year].filter(Boolean).join(", "));
    });
  }
  return lines.join("\n").replace(/\s+$/, "") + "\n";
}

function generateLinkedin(data) {
  const lines = ["Headline: " + (data.headline || ""), "", "About:"];
  if (data.summary) lines.push(data.summary);
  const roles = data.experience || [];
  if (roles.length) {
    const current = roles[0];
    let line = "Currently: " + current.title + " at " + current.company + ".";
    if (roles.length > 1) {
      line += " Previously: " + roles.slice(1).map(function (r) {
        return r.title + " at " + r.company;
      }).join(", ") + ".";
    }
    lines.push(line);
  }
  if (data.skills && data.skills.length) lines.push("Skills: " + data.skills.join(", "));
  if (data.location) lines.push("Based in " + data.location + ".");
  return lines.join("\n").replace(/\s+$/, "") + "\n";
}

/* ------------------------------------------------------------------ */
/* Consistency checker (mirror resume.py)                              */
/* ------------------------------------------------------------------ */

function extractTextEmployers(text) {
  const companies = [];
  text.split(/\r?\n/).forEach(function (raw) {
    const line = raw.trim().replace(/^[-*•]\s*/, "");
    if (!line || ["experience", "about", "education"].indexOf(line.toLowerCase()) !== -1) return;
    const m = line.match(/^(.+?)\s+at\s+(.+?)\s*$/);
    if (m) {
      const company = m[2].replace(/\.+$/, "").trim();
      if (company && companies.indexOf(company) === -1) companies.push(company);
    }
  });
  return companies;
}

function checkConsistency(data, text) {
  const haystack = text.toLowerCase();
  const matches = [], missing = [], jsonCompanies = {};
  (data.experience || []).forEach(function (role) {
    jsonCompanies[(role.company || "").toLowerCase()] = true;
    const label = role.company + " — " + role.title;
    if (haystack.indexOf((role.company || "").toLowerCase()) !== -1 &&
        haystack.indexOf((role.title || "").toLowerCase()) !== -1) {
      matches.push(label);
    } else {
      missing.push(label);
    }
  });
  const contradictions = extractTextEmployers(text).filter(function (c) {
    return !jsonCompanies[c.toLowerCase()];
  });
  return { matches: matches, missing: missing, contradictions: contradictions };
}

/* ------------------------------------------------------------------ */
/* Lint (web-only): structural checks on the source itself             */
/* ------------------------------------------------------------------ */

function parseYear(v) {
  const m = String(v || "").match(/(\d{4})/);
  return m ? parseInt(m[1], 10) : null;
}

function lintResume(data) {
  const issues = []; // {level: "error"|"warn"|"ok", text}
  function err(t) { issues.push({ level: "error", text: t }); }
  function warn(t) { issues.push({ level: "warn", text: t }); }
  function ok(t) { issues.push({ level: "ok", text: t }); }

  /* Contact basics */
  if (data.name && data.name.trim()) ok("Name is set"); else err("Name is missing");
  if (data.headline && data.headline.trim()) ok("Headline is set"); else err("Headline is missing");
  if (!data.email || !data.email.trim()) err("Email is missing — recruiters can't reach out");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) err("Email doesn't look valid: " + data.email);
  else ok("Email looks valid");
  if (data.location && data.location.trim()) ok("Location is set"); else warn("Location is empty");
  if (!data.phone || !String(data.phone).trim()) warn("No phone number — some ATS forms require one");

  /* Summary */
  const sum = (data.summary || "").trim();
  if (!sum) warn("Summary is empty");
  else if (sum.length > 420) warn("Summary is " + sum.length + " characters — over ~420 it stops being skimmed");
  else ok("Summary length is skim-friendly (" + sum.length + " chars)");

  /* Skills */
  const skills = data.skills || [];
  if (!skills.length) err("No skills listed");
  else {
    const seen = {}, dupes = [];
    skills.forEach(function (s) {
      const k = String(s).toLowerCase().trim();
      if (seen[k]) dupes.push(s); seen[k] = true;
    });
    if (dupes.length) err("Duplicate skills: " + dupes.join(", "));
    else ok(skills.length + " skills, no duplicates");
    if (skills.length > 14) warn(skills.length + " skills is a lot — the top ~10 carry the signal");
  }

  /* Experience */
  const roles = data.experience || [];
  if (!roles.length) err("No experience entries");
  const allBullets = {};
  let unquantified = 0, totalBullets = 0, prevStart = null, orderWarned = false;
  roles.forEach(function (role, i) {
    const label = (role.title || "Untitled role") + " at " + (role.company || "Unknown company");
    if (!role.title || !role.company) err("Role #" + (i + 1) + " is missing a title or company");
    if (!role.start) err(label + " has no start date");
    const s = parseYear(role.start), e = parseYear(role.end);
    const isCurrent = /present|current|now/i.test(role.end || "");
    if (s && e && e < s) err(label + ": end (" + role.end + ") is before start (" + role.start + ")");
    if (prevStart !== null && s !== null && s > prevStart && !orderWarned) {
      warn("Roles look out of order — newest-first is the convention");
      orderWarned = true;
    }
    if (s !== null) prevStart = s;
    if (i === 0 && roles.length > 1 && !isCurrent && e) warn("Most recent role has an end date — fine if you've left, worth a check");
    const bullets = role.bullets || [];
    if (!bullets.length) warn(label + " has no bullets");
    bullets.forEach(function (b) {
      totalBullets++;
      const key = String(b).toLowerCase().trim();
      if (allBullets[key]) err("Duplicate bullet: “" + String(b).slice(0, 60) + "…”");
      allBullets[key] = true;
      if (!/\d/.test(b)) unquantified++;
      if (String(b).length > 220) warn("A bullet under " + label + " runs " + String(b).length + " chars — trim it");
    });
  });
  if (roles.length && totalBullets) {
    if (unquantified === 0) ok("Every bullet carries a number");
    else warn(unquantified + " of " + totalBullets + " bullets have no number — quantified bullets get read");
  }

  /* Education */
  if (!(data.education || []).length) warn("No education entries");
  else ok("Education is present");

  return issues;
}

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function renderHuman(data, container) {
  container.textContent = "";
  container.appendChild(el("h3", data.name, "rp-name"));
  container.appendChild(el("p", data.headline, "rp-headline"));
  container.appendChild(el("p", contactLine(data), "rp-contact"));
  if (data.summary) {
    container.appendChild(el("h4", "Summary"));
    container.appendChild(el("p", data.summary));
  }
  if (data.skills && data.skills.length) {
    container.appendChild(el("h4", "Skills"));
    container.appendChild(el("p", data.skills.join(" · ")));
  }
  container.appendChild(el("h4", "Experience"));
  (data.experience || []).forEach(function (role) {
    container.appendChild(el("h5", role.title + " — " + role.company));
    container.appendChild(el("p",
      [role.location, (role.start || "") + " – " + (role.end || "")].filter(Boolean).join(" · "),
      "rp-meta"));
    const ul = el("ul");
    (role.bullets || []).forEach(function (b) { ul.appendChild(el("li", b)); });
    container.appendChild(ul);
  });
  if (data.education && data.education.length) {
    container.appendChild(el("h4", "Education"));
    data.education.forEach(function (e) {
      container.appendChild(el("p", [e.degree, e.school, e.year].filter(Boolean).join(", ")));
    });
  }
}

function renderCheck(result, container) {
  container.textContent = "";
  function group(title, items, kind, emptyText) {
    const wrap = el("div", null, "check-group " + kind);
    const head = el("p", null, "check-head");
    head.appendChild(el("span", kind === "good" ? "✓" : kind === "bad" ? "✗" : "⚠", "check-icon"));
    head.appendChild(el("span", title + " (" + items.length + ")"));
    wrap.appendChild(head);
    const ul = el("ul");
    if (items.length === 0) ul.appendChild(el("li", emptyText, "dim"));
    items.forEach(function (item) { ul.appendChild(el("li", item)); });
    wrap.appendChild(ul);
    container.appendChild(wrap);
  }
  group("Matches — in both", result.matches, "good", "none yet");
  group("Missing — in the source, not in the paste", result.missing, "bad", "none — every role is accounted for");
  group("Contradictions — in the paste, not in the source", result.contradictions, "warn", "none — nothing here contradicts the source");
}

function renderLint(issues, listEl, summaryEl) {
  listEl.textContent = "";
  const errors = issues.filter(function (i) { return i.level === "error"; }).length;
  const warns = issues.filter(function (i) { return i.level === "warn"; }).length;
  issues.forEach(function (issue) {
    const li = el("li", null, "lint-item " + issue.level);
    li.appendChild(el("span", issue.level === "error" ? "✗" : issue.level === "warn" ? "⚠" : "✓", "lint-icon"));
    li.appendChild(el("span", issue.text));
    listEl.appendChild(li);
  });
  summaryEl.textContent = errors === 0 && warns === 0
    ? "✓ all clear"
    : (errors ? errors + " error" + (errors > 1 ? "s" : "") : "") +
      (errors && warns ? " · " : "") +
      (warns ? warns + " warning" + (warns > 1 ? "s" : "") : "");
  summaryEl.className = "lint-summary " + (errors ? "has-error" : warns ? "has-warn" : "all-clear");
}

/* ------------------------------------------------------------------ */
/* Form editor                                                         */
/* ------------------------------------------------------------------ */

let state = null;         // the parsed source (single source of truth)
let onCommit = null;      // set in wiring; called after every state change

function field(labelText, value, onInput, opts) {
  opts = opts || {};
  const wrap = el("label", null, "field");
  wrap.appendChild(el("span", labelText, "field-label"));
  const input = opts.area ? document.createElement("textarea") : document.createElement("input");
  if (!opts.area) input.type = "text";
  if (opts.area) input.rows = opts.rows || 3;
  input.value = value == null ? "" : value;
  input.spellcheck = false;
  input.placeholder = opts.placeholder || "";
  input.addEventListener("input", function () { onInput(input.value); });
  wrap.appendChild(input);
  return wrap;
}

function buildForm(container) {
  container.textContent = "";
  const d = state;

  const basics = el("div", null, "form-block");
  basics.appendChild(el("h4", "Basics"));
  const grid = el("div", null, "field-grid");
  grid.appendChild(field("Name", d.name, function (v) { d.name = v; commit(false); }));
  grid.appendChild(field("Headline", d.headline, function (v) { d.headline = v; commit(false); }));
  grid.appendChild(field("Location", d.location, function (v) { d.location = v; commit(false); }));
  grid.appendChild(field("Email", d.email, function (v) { d.email = v; commit(false); }));
  grid.appendChild(field("Phone", d.phone, function (v) { d.phone = v; commit(false); }));
  grid.appendChild(field("Links (one per line)", (d.links || []).join("\n"), function (v) {
    d.links = v.split(/\n/).map(function (s) { return s.trim(); }).filter(Boolean); commit(false);
  }, { area: true, rows: 2 }));
  basics.appendChild(grid);
  basics.appendChild(field("Summary", d.summary, function (v) { d.summary = v; commit(false); }, { area: true, rows: 4 }));
  basics.appendChild(field("Skills (comma-separated)", (d.skills || []).join(", "), function (v) {
    d.skills = v.split(",").map(function (s) { return s.trim(); }).filter(Boolean); commit(false);
  }, { area: true, rows: 2 }));
  container.appendChild(basics);

  const exp = el("div", null, "form-block");
  exp.appendChild(el("h4", "Experience"));
  (d.experience || []).forEach(function (role, i) {
    const card = el("div", null, "role-card");
    const head = el("div", null, "role-head");
    head.appendChild(el("span", (role.title || "New role") + " — " + (role.company || ""), "role-title"));
    const del = el("button", "Remove", "mini danger");
    del.type = "button";
    del.addEventListener("click", function () { d.experience.splice(i, 1); commit(true); });
    head.appendChild(del);
    card.appendChild(head);
    const g = el("div", null, "field-grid");
    g.appendChild(field("Title", role.title, function (v) { role.title = v; commit(false); }));
    g.appendChild(field("Company", role.company, function (v) { role.company = v; commit(false); }));
    g.appendChild(field("Location", role.location, function (v) { role.location = v; commit(false); }));
    g.appendChild(field("Start", role.start, function (v) { role.start = v; commit(false); }, { placeholder: "2023" }));
    g.appendChild(field("End", role.end, function (v) { role.end = v; commit(false); }, { placeholder: "Present" }));
    card.appendChild(g);
    card.appendChild(field("Bullets (one per line)", (role.bullets || []).join("\n"), function (v) {
      role.bullets = v.split(/\n/).map(function (s) { return s.trim(); }).filter(Boolean); commit(false);
    }, { area: true, rows: 4 }));
    exp.appendChild(card);
  });
  const addRole = el("button", "+ Add a role", "mini");
  addRole.type = "button";
  addRole.addEventListener("click", function () {
    d.experience = d.experience || [];
    d.experience.unshift({ title: "New Role", company: "New Company", location: "", start: "2025", end: "Present", bullets: ["Describe a result, with a number."] });
    commit(true);
  });
  exp.appendChild(addRole);
  container.appendChild(exp);

  const edu = el("div", null, "form-block");
  edu.appendChild(el("h4", "Education"));
  (d.education || []).forEach(function (e, i) {
    const g = el("div", null, "field-grid");
    g.appendChild(field("School", e.school, function (v) { e.school = v; commit(false); }));
    g.appendChild(field("Degree", e.degree, function (v) { e.degree = v; commit(false); }));
    g.appendChild(field("Year", e.year, function (v) { e.year = v; commit(false); }));
    edu.appendChild(g);
    const del = el("button", "Remove education entry", "mini danger");
    del.type = "button";
    del.addEventListener("click", function () { d.education.splice(i, 1); commit(true); });
    edu.appendChild(del);
  });
  const addEdu = el("button", "+ Add education", "mini");
  addEdu.type = "button";
  addEdu.addEventListener("click", function () {
    d.education = d.education || [];
    d.education.push({ school: "", degree: "", year: "" });
    commit(true);
  });
  edu.appendChild(addEdu);
  container.appendChild(edu);
}

/* ------------------------------------------------------------------ */
/* Commit / sync                                                       */
/* ------------------------------------------------------------------ */

function commit(rebuildForm) {
  if (onCommit) onCommit(rebuildForm);
}

function download(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 500);
}

function copyText(text, btn) {
  function done() {
    const old = btn.textContent;
    btn.textContent = "Copied ✓";
    btn.classList.add("copied");
    setTimeout(function () { btn.textContent = old; btn.classList.remove("copied"); }, 1400);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, done);
  } else { done(); }
}

/* ------------------------------------------------------------------ */
/* Quick edits (operate on the parsed sample, then re-render)          */
/* ------------------------------------------------------------------ */

function quickEdit(kind) {
  const d = JSON.parse(JSON.stringify(state));
  if (kind === "reset") {
    state = JSON.parse(JSON.stringify(SAMPLE));
    commit(true);
    return "Sample reset — outputs in sync.";
  }
  if (kind === "promote") {
    d.experience[0].title = "Staff Product Manager, Growth";
    d.headline = "Staff Product Manager, Growth | PLG, Onboarding & Monetization";
  } else if (kind === "newjob") {
    d.experience[0].end = "2025";
    d.experience.unshift({
      title: "Principal Product Manager, Growth",
      company: "Northwind Labs",
      location: "New York, NY",
      start: "2025",
      end: "Present",
      bullets: ["Leading growth for a fictional demo company — this role appeared everywhere at once."],
    });
    d.headline = "Principal Product Manager, Growth | PLG, Onboarding & Monetization";
  } else if (kind === "bullet") {
    d.experience[0].bullets.push("Shipped a referral program that drove 12% of new signups in its first quarter.");
  } else if (kind === "break") {
    d.email = "";
    d.skills.push("SQL");
    d.experience[1].end = "2019"; // before its 2020 start
    d.experience[0].bullets.push(d.experience[0].bullets[0]); // duplicate bullet
  }
  state = d;
  commit(true);
  return kind === "break"
    ? "Broken on purpose — watch the lint panel, then hit Reset sample."
    : "Applied — every output and the form updated from the one source.";
}

/* ------------------------------------------------------------------ */
/* Wiring                                                              */
/* ------------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", function () {
  const jsonInput = document.getElementById("json-input");
  const jsonError = document.getElementById("json-error");
  const profileInput = document.getElementById("profile-input");
  const formEditor = document.getElementById("form-editor");
  const status = document.getElementById("sync-status");
  let statusTimer = null;

  state = JSON.parse(JSON.stringify(SAMPLE));

  function flashStatus(msg) {
    status.textContent = msg;
    status.classList.add("flash");
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () { status.classList.remove("flash"); }, 1200);
  }

  function renderOutputs() {
    document.getElementById("ats-output").textContent = generateAts(state);
    document.getElementById("linkedin-output").textContent = generateLinkedin(state);
    renderHuman(state, document.getElementById("human-output"));
    renderLint(lintResume(state), document.getElementById("lint-list"), document.getElementById("lint-summary"));
    renderCheck(checkConsistency(state, profileInput.value), document.getElementById("check-results"));
    ["tab-human", "tab-ats", "tab-linkedin"].forEach(function (id) {
      const p = document.getElementById(id);
      p.classList.remove("pulse");
      void p.offsetWidth; // restart the animation
      p.classList.add("pulse");
    });
  }

  onCommit = function (rebuildForm) {
    jsonError.hidden = true;
    jsonInput.value = JSON.stringify(state, null, 2);
    if (rebuildForm) buildForm(formEditor);
    renderOutputs();
  };

  /* JSON editing: parse on input; keep last good outputs if invalid. */
  let jsonTimer = null;
  jsonInput.addEventListener("input", function () {
    clearTimeout(jsonTimer);
    jsonTimer = setTimeout(function () {
      try {
        state = JSON.parse(jsonInput.value);
        jsonError.hidden = true;
        buildForm(formEditor);
        renderOutputs();
        flashStatus("JSON parsed — outputs in sync.");
      } catch (err) {
        jsonError.textContent = "JSON error: " + err.message + " (outputs still show the last valid version)";
        jsonError.hidden = false;
      }
    }, 300);
  });

  /* Checker re-runs live as the paste changes. */
  let checkTimer = null;
  profileInput.addEventListener("input", function () {
    clearTimeout(checkTimer);
    checkTimer = setTimeout(function () {
      renderCheck(checkConsistency(state, profileInput.value), document.getElementById("check-results"));
    }, 250);
  });

  /* Editor mode toggle */
  const modeForm = document.getElementById("mode-form");
  const modeJson = document.getElementById("mode-json");
  function setMode(json) {
    modeForm.classList.toggle("active", !json);
    modeJson.classList.toggle("active", json);
    modeForm.setAttribute("aria-selected", json ? "false" : "true");
    modeJson.setAttribute("aria-selected", json ? "true" : "false");
    document.getElementById("form-editor").hidden = json;
    document.getElementById("json-editor").hidden = !json;
    if (json) jsonInput.value = JSON.stringify(state, null, 2);
  }
  modeForm.addEventListener("click", function () { setMode(false); });
  modeJson.addEventListener("click", function () { setMode(true); });

  /* Output tabs */
  document.querySelectorAll(".tab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (b) {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      document.querySelectorAll(".tab-panel").forEach(function (panel) {
        panel.hidden = panel.id !== "tab-" + btn.getAttribute("data-tab");
      });
    });
  });

  /* Downloads + copy */
  document.getElementById("download-ats").addEventListener("click", function () { download("ats.txt", generateAts(state)); });
  document.getElementById("download-md").addEventListener("click", function () { download("resume.md", generateMarkdown(state)); });
  document.getElementById("download-linkedin").addEventListener("click", function () { download("linkedin.txt", generateLinkedin(state)); });
  document.getElementById("copy-ats").addEventListener("click", function () { copyText(generateAts(state), this); });
  document.getElementById("copy-md").addEventListener("click", function () { copyText(generateMarkdown(state), this); });
  document.getElementById("copy-linkedin").addEventListener("click", function () { copyText(generateLinkedin(state), this); });

  /* Quick edits */
  document.querySelectorAll("[data-quick]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      flashStatus(quickEdit(btn.getAttribute("data-quick")));
    });
  });

  /* Init */
  profileInput.value = SAMPLE_LINKEDIN;
  buildForm(formEditor);
  commit(false);
});
