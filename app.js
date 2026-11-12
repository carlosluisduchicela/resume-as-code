"use strict";

/* resume-as-code web demo.
 * The JSON in the textarea is the only source of truth.
 * This file only reformats and checks it — it never invents a fact.
 * Mirrors resume.py (Python, stdlib) so browser and CLI outputs agree.
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
  function section(title, items, marker, emptyText) {
    const wrap = el("div", null, "check-section");
    wrap.appendChild(el("h3", title + " (" + items.length + ")"));
    const ul = el("ul");
    if (items.length === 0) ul.appendChild(el("li", emptyText, "dim"));
    items.forEach(function (item) { ul.appendChild(el("li", marker + " " + item)); });
    wrap.appendChild(ul);
    container.appendChild(wrap);
  }
  section("Matches — in both", result.matches, "✓", "none");
  section("Missing — in JSON, not in pasted text", result.missing, "✗", "none");
  section("Contradictions — in pasted text, not in JSON", result.contradictions, "⚠", "none");
}

/* ------------------------------------------------------------------ */
/* Wiring                                                              */
/* ------------------------------------------------------------------ */

function readSource(showError) {
  const input = document.getElementById("json-input");
  const errorBox = document.getElementById("json-error");
  try {
    const data = JSON.parse(input.value);
    errorBox.hidden = true;
    return data;
  } catch (err) {
    if (showError) {
      errorBox.textContent = "JSON error: " + err.message;
      errorBox.hidden = false;
    }
    return null;
  }
}

let lastMarkdown = "";

function generateAll() {
  const data = readSource(true);
  if (!data) return;
  document.getElementById("ats-output").textContent = generateAts(data);
  document.getElementById("linkedin-output").textContent = generateLinkedin(data);
  renderHuman(data, document.getElementById("human-output"));
  lastMarkdown = generateMarkdown(data);
}

function runCheck() {
  const data = readSource(true);
  if (!data) return;
  const text = document.getElementById("profile-input").value;
  renderCheck(checkConsistency(data, text), document.getElementById("check-results"));
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

document.addEventListener("DOMContentLoaded", function () {
  const jsonInput = document.getElementById("json-input");
  const profileInput = document.getElementById("profile-input");

  function loadSample() {
    jsonInput.value = JSON.stringify(SAMPLE, null, 2);
    profileInput.value = SAMPLE_LINKEDIN;
    generateAll();
    runCheck();
  }

  document.getElementById("load-sample").addEventListener("click", loadSample);
  document.getElementById("generate").addEventListener("click", generateAll);
  document.getElementById("run-check").addEventListener("click", runCheck);
  document.getElementById("download-ats").addEventListener("click", function () {
    const data = readSource(true);
    if (data) download("ats.txt", generateAts(data));
  });
  document.getElementById("download-md").addEventListener("click", function () {
    const data = readSource(true);
    if (data) download("resume.md", lastMarkdown || generateMarkdown(data));
  });

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

  loadSample();
});
