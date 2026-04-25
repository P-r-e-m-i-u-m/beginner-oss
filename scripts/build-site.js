#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const dataFile = path.join(__dirname, "../data/repos.json");
const outDir = path.join(__dirname, "../docs");

let repos = [];
if (fs.existsSync(dataFile)) {
  repos = JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

// Sort by good first issues desc, then stars
repos.sort((a, b) => b.good_first_issues - a.good_first_issues || b.stars - a.stars);

function languageColor(lang) {
  const colors = {
    JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
    Go: "#00ADD8", Rust: "#dea584", Java: "#b07219", "C++": "#f34b7d",
    C: "#555555", Ruby: "#701516", PHP: "#4F5D95", Swift: "#F05138",
    Kotlin: "#A97BFF", Dart: "#00B4AB", Shell: "#89e051",
    HTML: "#e34c26", CSS: "#563d7c", Vue: "#41b883", Unknown: "#858585"
  };
  return colors[lang] || "#858585";
}

function freshnessBadge(days) {
  if (days <= 7) return { label: "Active this week", color: "#22c55e" };
  if (days <= 30) return { label: "Active this month", color: "#84cc16" };
  if (days <= 90) return { label: "Active recently", color: "#eab308" };
  return { label: `${days}d ago`, color: "#f97316" };
}

function repoCard(repo) {
  const fresh = freshnessBadge(repo.last_commit_days || 0);
  const langColor = languageColor(repo.language);
  const issueLinks = (repo.good_first_issue_links || []).slice(0, 3).map(i =>
    `<a href="${i.url}" target="_blank" rel="noopener" class="issue-link">↗ ${i.title.slice(0, 55)}${i.title.length > 55 ? "…" : ""}</a>`
  ).join("");

  return `
<div class="card" data-lang="${repo.language || "Unknown"}" data-name="${repo.full_name.toLowerCase()}">
  <div class="card-header">
    <div class="card-title-row">
      <a href="${repo.url}" target="_blank" rel="noopener" class="repo-name">${repo.full_name}</a>
      <span class="fresh-badge" style="background:${fresh.color}22;color:${fresh.color};border:1px solid ${fresh.color}44">${fresh.label}</span>
    </div>
    <p class="description">${repo.description || "No description provided."}</p>
  </div>

  <div class="why-box">
    <span class="why-icon">🤖</span>
    <span class="why-text">${repo.why || "Manually verified as beginner-friendly."}</span>
  </div>

  <div class="issue-links">
    ${issueLinks || '<span class="no-issues">Check repo for current issues</span>'}
  </div>

  <div class="card-footer">
    <div class="meta-row">
      <span class="lang-dot" style="background:${langColor}"></span>
      <span class="meta-item">${repo.language || "Unknown"}</span>
      <span class="meta-item">⭐ ${repo.stars?.toLocaleString() || 0}</span>
      <span class="meta-item">👥 ${repo.contributors}+ contributors</span>
      <span class="gfi-count">${repo.good_first_issues} good first issue${repo.good_first_issues !== 1 ? "s" : ""}</span>
    </div>
    <div class="added-by">Added by <a href="https://github.com/${repo.added_by}" target="_blank">@${repo.added_by}</a> · ${repo.added_at || ""}</div>
  </div>
</div>`;
}

const langs = [...new Set(repos.map(r => r.language || "Unknown"))].sort();

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="A human-curated, bot-verified directory of open source repos that are genuinely ready for beginners. No scrapers. No dead repos. Just quality.">
  <meta property="og:title" content="beginner-oss — Real repos. Real beginner issues.">
  <meta property="og:description" content="Every repo here passed an automated quality check. Good docs, welcoming maintainers, open issues waiting for you.">
  <title>beginner-oss — Real repos. Real beginner issues.</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0d1117;
      --surface: #161b22;
      --surface2: #21262d;
      --border: #30363d;
      --text: #e6edf3;
      --text2: #8b949e;
      --accent: #58a6ff;
      --accent2: #3fb950;
      --danger: #f85149;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      min-height: 100vh;
    }

    /* HERO */
    .hero {
      padding: 64px 24px 48px;
      text-align: center;
      border-bottom: 1px solid var(--border);
      background: linear-gradient(180deg, #161b22 0%, #0d1117 100%);
    }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: #238636; color: #aff5b4;
      border-radius: 999px; padding: 4px 12px;
      font-size: 12px; font-weight: 600; margin-bottom: 20px;
    }
    .hero h1 {
      font-size: clamp(28px, 5vw, 52px);
      font-weight: 800; letter-spacing: -1px;
      line-height: 1.15; margin-bottom: 16px;
    }
    .hero h1 span { color: var(--accent); }
    .hero p {
      color: var(--text2); font-size: 18px;
      max-width: 560px; margin: 0 auto 32px; line-height: 1.6;
    }
    .hero-stats {
      display: flex; justify-content: center; gap: 32px; flex-wrap: wrap;
    }
    .stat { text-align: center; }
    .stat-num { font-size: 28px; font-weight: 700; color: var(--accent); }
    .stat-label { font-size: 13px; color: var(--text2); }

    /* CTA */
    .cta-bar {
      padding: 20px 24px;
      text-align: center;
      background: #238636;
      font-size: 15px; font-weight: 600;
    }
    .cta-bar a { color: #aff5b4; text-decoration: none; }
    .cta-bar a:hover { text-decoration: underline; }

    /* CONTROLS */
    .controls {
      max-width: 1200px; margin: 0 auto;
      padding: 24px 24px 0;
      display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
    }
    .search-wrap { position: relative; flex: 1; min-width: 200px; }
    .search-wrap input {
      width: 100%;
      background: var(--surface); border: 1px solid var(--border);
      color: var(--text); border-radius: 8px;
      padding: 10px 16px 10px 40px; font-size: 14px;
      outline: none; transition: border-color 0.2s;
    }
    .search-wrap input:focus { border-color: var(--accent); }
    .search-icon {
      position: absolute; left: 12px; top: 50%;
      transform: translateY(-50%); color: var(--text2); font-size: 16px;
    }
    .filter-select {
      background: var(--surface); border: 1px solid var(--border);
      color: var(--text); border-radius: 8px;
      padding: 10px 14px; font-size: 14px; cursor: pointer; outline: none;
    }
    .count-label { color: var(--text2); font-size: 14px; margin-left: auto; white-space: nowrap; }

    /* GRID */
    .grid {
      max-width: 1200px; margin: 0 auto;
      padding: 20px 24px 60px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 16px;
    }

    /* CARD */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      display: flex; flex-direction: column; gap: 14px;
      transition: border-color 0.2s, transform 0.15s;
    }
    .card:hover { border-color: var(--accent); transform: translateY(-2px); }

    .card-title-row { display: flex; align-items: flex-start; gap: 8px; flex-wrap: wrap; }
    .repo-name {
      font-weight: 700; font-size: 15px;
      color: var(--accent); text-decoration: none;
    }
    .repo-name:hover { text-decoration: underline; }
    .fresh-badge {
      font-size: 11px; font-weight: 600;
      padding: 2px 8px; border-radius: 999px;
      white-space: nowrap; margin-left: auto;
    }
    .description { font-size: 13px; color: var(--text2); line-height: 1.5; margin-top: 4px; }

    .why-box {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 8px; padding: 10px 12px;
      display: flex; gap: 8px; align-items: flex-start;
    }
    .why-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
    .why-text { font-size: 12px; color: var(--text2); line-height: 1.5; }

    .issue-links { display: flex; flex-direction: column; gap: 6px; }
    .issue-link {
      font-size: 12px; color: var(--accent2);
      text-decoration: none; line-height: 1.4;
      padding: 4px 8px; border-radius: 6px;
      background: #23863622; border: 1px solid #23863644;
      display: block; transition: background 0.15s;
    }
    .issue-link:hover { background: #23863644; }
    .no-issues { font-size: 12px; color: var(--text2); }

    .card-footer { margin-top: auto; }
    .meta-row {
      display: flex; align-items: center; gap: 10px;
      flex-wrap: wrap; font-size: 12px; color: var(--text2);
    }
    .lang-dot {
      width: 10px; height: 10px;
      border-radius: 50%; flex-shrink: 0;
    }
    .meta-item { white-space: nowrap; }
    .gfi-count {
      margin-left: auto;
      background: #388bfd22; color: var(--accent);
      border: 1px solid #388bfd44;
      border-radius: 999px; padding: 2px 10px;
      font-weight: 700; font-size: 11px;
    }
    .added-by { font-size: 11px; color: var(--text2); margin-top: 8px; }
    .added-by a { color: var(--text2); }

    /* EMPTY STATE */
    .empty {
      grid-column: 1 / -1; text-align: center;
      padding: 80px 24px; color: var(--text2);
    }
    .empty h2 { font-size: 20px; margin-bottom: 8px; }

    /* HOW IT WORKS */
    .how {
      border-top: 1px solid var(--border);
      padding: 60px 24px;
      text-align: center;
      background: var(--surface);
    }
    .how h2 { font-size: 24px; font-weight: 700; margin-bottom: 36px; }
    .steps {
      display: flex; justify-content: center;
      gap: 32px; flex-wrap: wrap; max-width: 900px; margin: 0 auto;
    }
    .step { max-width: 220px; text-align: center; }
    .step-num {
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--accent); color: #000;
      font-weight: 700; font-size: 16px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px;
    }
    .step h3 { font-size: 15px; margin-bottom: 6px; }
    .step p { font-size: 13px; color: var(--text2); line-height: 1.5; }

    /* FOOTER */
    footer {
      border-top: 1px solid var(--border);
      padding: 24px; text-align: center;
      font-size: 13px; color: var(--text2);
    }
    footer a { color: var(--text2); }

    @media (max-width: 640px) {
      .grid { grid-template-columns: 1fr; }
      .hero-stats { gap: 20px; }
    }
  </style>
</head>
<body>

<div class="hero">
  <div class="hero-badge">🤖 Bot-verified · Human-curated</div>
  <h1>Find repos that are <span>actually</span><br>ready for beginners</h1>
  <p>Every repo here passed an automated quality check. Good docs, welcoming maintainers, real open issues waiting for you.</p>
  <div class="hero-stats">
    <div class="stat"><div class="stat-num">${repos.length}</div><div class="stat-label">Verified repos</div></div>
    <div class="stat"><div class="stat-num">${repos.reduce((s, r) => s + (r.good_first_issues || 0), 0)}</div><div class="stat-label">Open beginner issues</div></div>
    <div class="stat"><div class="stat-num">${langs.length}</div><div class="stat-label">Languages</div></div>
  </div>
</div>

<div class="cta-bar">
  Know a beginner-friendly repo? → <a href="https://github.com/P-r-e-m-i-u-m/beginner-oss/compare" target="_blank">Open a PR to suggest it</a> — bot reviews it automatically
</div>

<div class="controls">
  <div class="search-wrap">
    <span class="search-icon">🔍</span>
    <input type="text" id="search" placeholder="Search by name, language, description…" oninput="filter()">
  </div>
  <select class="filter-select" id="lang-filter" onchange="filter()">
    <option value="">All languages</option>
    ${langs.map(l => `<option value="${l}">${l}</option>`).join("\n    ")}
  </select>
  <select class="filter-select" id="sort-select" onchange="filter()">
    <option value="gfi">Sort: Most beginner issues</option>
    <option value="stars">Sort: Most stars</option>
    <option value="fresh">Sort: Most recent</option>
  </select>
  <span class="count-label" id="count-label">${repos.length} repos</span>
</div>

<div class="grid" id="grid">
  ${repos.length === 0
    ? `<div class="empty"><h2>No repos yet</h2><p>Be the first to <a href="https://github.com/P-r-e-m-i-u-m/beginner-oss/compare" style="color:var(--accent)">suggest a repo</a>.</p></div>`
    : repos.map(repoCard).join("\n  ")
  }
</div>

<div class="how">
  <h2>How it works</h2>
  <div class="steps">
    <div class="step">
      <div class="step-num">1</div>
      <h3>Someone suggests a repo</h3>
      <p>Open a PR with the repo URL and why it's beginner-friendly.</p>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <h3>Bot validates it</h3>
      <p>Checks README, CONTRIBUTING.md, license, activity, contributor count, and open good first issues.</p>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <h3>Auto-merged or closed</h3>
      <p>Pass = instant merge + site rebuild. Fail = PR closed with exact reasons.</p>
    </div>
    <div class="step">
      <div class="step-num">4</div>
      <h3>Stays fresh</h3>
      <p>Every Monday, the bot re-checks all repos and auto-removes dead ones.</p>
    </div>
  </div>
</div>

<footer>
  <p>Built by <a href="https://github.com/P-r-e-m-i-u-m" target="_blank">@P-r-e-m-i-u-m</a> · <a href="https://github.com/P-r-e-m-i-u-m/beginner-oss" target="_blank">Source on GitHub</a> · Last updated: ${new Date().toISOString().split("T")[0]}</p>
</footer>

<script>
  const allCards = Array.from(document.querySelectorAll(".card"));

  function filter() {
    const q = document.getElementById("search").value.toLowerCase();
    const lang = document.getElementById("lang-filter").value;
    const sort = document.getElementById("sort-select").value;

    let visible = allCards.filter(card => {
      const name = card.dataset.name || "";
      const cardLang = card.dataset.lang || "";
      const matchQ = !q || name.includes(q) || card.textContent.toLowerCase().includes(q);
      const matchLang = !lang || cardLang === lang;
      return matchQ && matchLang;
    });

    allCards.forEach(c => c.style.display = "none");

    // Sort
    visible.sort((a, b) => {
      if (sort === "stars") {
        const sa = parseInt(a.querySelector(".meta-item:nth-child(3)")?.textContent?.replace(/[^0-9]/g, "") || 0);
        const sb = parseInt(b.querySelector(".meta-item:nth-child(3)")?.textContent?.replace(/[^0-9]/g, "") || 0);
        return sb - sa;
      }
      return 0;
    });

    const grid = document.getElementById("grid");
    const empty = grid.querySelector(".empty");
    if (empty) empty.remove();

    if (visible.length === 0) {
      grid.insertAdjacentHTML("beforeend", \`<div class="empty"><h2>No results</h2><p>Try a different search or language.</p></div>\`);
    } else {
      visible.forEach(c => {
        c.style.display = "";
        grid.appendChild(c);
      });
    }

    document.getElementById("count-label").textContent = \`\${visible.length} repo\${visible.length !== 1 ? "s" : ""}\`;
  }
</script>

</body>
</html>`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "index.html"), html);
console.log(`Built: ${repos.length} repos → docs/index.html`);
