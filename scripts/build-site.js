#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const dataFile = path.join(__dirname, "../data/repos.json");
const outDir = path.join(__dirname, "../docs");

let repos = [];
if (fs.existsSync(dataFile)) {
  repos = JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

repos.sort((a, b) => b.good_first_issues - a.good_first_issues || b.stars - a.stars);

const CATEGORIES = {
  "All":        { icon: "✦", color: "#58a6ff" },
  "Web Dev":    { icon: "🌐", color: "#38bdf8" },
  "AI / ML":    { icon: "🤖", color: "#a78bfa" },
  "CLI Tools":  { icon: "⚡", color: "#34d399" },
  "DevOps":     { icon: "🔧", color: "#fb923c" },
  "Data":       { icon: "📊", color: "#f472b6" },
  "Education":  { icon: "📚", color: "#facc15" },
  "Other":      { icon: "◈",  color: "#8b949e" },
};

function inferCategory(repo) {
  if (repo.category && CATEGORIES[repo.category]) return repo.category;
  const t = (repo.topics || []).join(" ").toLowerCase();
  const l = (repo.language || "").toLowerCase();
  if (/ai|ml|machine.learning|deep.learning|llm|nlp|neural|pytorch|tensorflow|genai/.test(t)) return "AI / ML";
  if (/cli|terminal|shell|command.line|bash|zsh/.test(t) || l === "shell") return "CLI Tools";
  if (/devops|docker|kubernetes|k8s|ci|cd|deploy|infra|cloud/.test(t)) return "DevOps";
  if (/data|analytics|pandas|spark|sql|database|etl/.test(t)) return "Data";
  if (/education|learn|course|tutorial|curriculum/.test(t)) return "Education";
  if (/web|frontend|backend|react|vue|next|api|http|css|html/.test(t) || ["javascript","typescript","html","css","php","ruby"].includes(l)) return "Web Dev";
  return "Other";
}

function languageColor(lang) {
  const colors = {
    JavaScript:"#f1e05a",TypeScript:"#3178c6",Python:"#3572A5",Go:"#00ADD8",
    Rust:"#dea584",Java:"#b07219","C++":"#f34b7d",C:"#555555",Ruby:"#701516",
    PHP:"#4F5D95",Swift:"#F05138",Kotlin:"#A97BFF",Dart:"#00B4AB",Shell:"#89e051",
    HTML:"#e34c26",CSS:"#563d7c",Vue:"#41b883",Unknown:"#858585"
  };
  return colors[lang] || "#858585";
}

function freshnessBadge(days) {
  if (days <= 7)  return { label: "This week",  color: "#22c55e" };
  if (days <= 30) return { label: "This month", color: "#84cc16" };
  if (days <= 90) return { label: "Recent",     color: "#eab308" };
  return { label: `${days}d ago`, color: "#f97316" };
}

function formatStars(n) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k";
  return String(n);
}

function repoCard(repo) {
  const cat = inferCategory(repo);
  const catCfg = CATEGORIES[cat] || CATEGORIES["Other"];
  const fresh = freshnessBadge(repo.last_commit_days || 0);
  const langColor = languageColor(repo.language);
  const issueLinks = (repo.good_first_issue_links || []).slice(0, 3).map(i =>
    `<a href="${i.url}" target="_blank" rel="noopener" class="issue-link"><span class="issue-arrow">↗</span><span>${i.title.slice(0,58)}${i.title.length>58?"…":""}</span></a>`
  ).join("");

  return `
<div class="card" data-lang="${repo.language||"Unknown"}" data-cat="${cat}" data-name="${repo.full_name.toLowerCase()}" data-gfi="${repo.good_first_issues}" data-stars="${repo.stars}">
  <div class="card-top">
    <div class="card-badges">
      <span class="cat-pill" style="--cat-color:${catCfg.color}">${catCfg.icon} ${cat}</span>
      <span class="fresh-pill" style="--fresh-color:${fresh.color}">${fresh.label}</span>
    </div>
    <a href="${repo.url}" target="_blank" rel="noopener" class="repo-name">${repo.full_name}</a>
    <p class="description">${repo.description||"No description provided."}</p>
  </div>
  <div class="why-box">
    <span class="why-label">🤖 Why it's verified</span>
    <p class="why-text">${repo.why||"Manually verified as beginner-friendly."}</p>
  </div>
  ${issueLinks?`<div class="issue-links">${issueLinks}</div>`:""}
  <div class="card-footer">
    <div class="meta-row">
      ${repo.language&&repo.language!=="Unknown"?`<span class="lang-tag"><span class="lang-dot" style="background:${langColor}"></span>${repo.language}</span>`:""}
      <span class="meta-chip">⭐ ${formatStars(repo.stars||0)}</span>
      <span class="meta-chip">👥 ${repo.contributors}+</span>
      <span class="gfi-chip">${repo.good_first_issues} beginner issue${repo.good_first_issues!==1?"s":""}</span>
    </div>
    <div class="card-added">Added by <a href="https://github.com/${repo.added_by}" target="_blank">@${repo.added_by}</a></div>
  </div>
</div>`;
}

const usedCats = ["All", ...Object.keys(CATEGORIES).filter(c => c !== "All" && repos.some(r => inferCategory(r) === c))];
const totalGFI = repos.reduce((s, r) => s + (r.good_first_issues || 0), 0);
const langs = [...new Set(repos.map(r => r.language||"Unknown").filter(l => l !== "Unknown"))].sort();

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="A bot-verified directory of open source repos genuinely ready for beginners.">
  <title>beginner-oss — Find your first open source contribution</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#0d1117;--surface:#161b22;--surface2:#1c2128;--surface3:#21262d;--border:#30363d;--border2:#3d444d;--text:#e6edf3;--text2:#9198a1;--text3:#656d76;--accent:#58a6ff;--green:#3fb950;--radius:12px}
    html{scroll-behavior:smooth}
    body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;min-height:100vh}
    a{color:inherit;text-decoration:none}

    .hero{padding:72px 24px 56px;text-align:center;background:radial-gradient(ellipse 80% 60% at 50% -10%,#1f2d4a 0%,transparent 70%);border-bottom:1px solid var(--border);position:relative;overflow:hidden}
    .hero::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 39px,#ffffff04 39px,#ffffff04 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,#ffffff04 39px,#ffffff04 40px);pointer-events:none}
    .hero-inner{position:relative;z-index:1}
    .hero-badge{display:inline-flex;align-items:center;gap:6px;background:#238636;color:#aff5b4;border-radius:999px;padding:5px 14px;font-size:12px;font-weight:600;letter-spacing:.3px;margin-bottom:24px}
    .hero h1{font-size:clamp(30px,6vw,56px);font-weight:800;letter-spacing:-1.5px;line-height:1.1;margin-bottom:18px;background:linear-gradient(135deg,#e6edf3 30%,#58a6ff 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .hero-sub{color:var(--text2);font-size:clamp(15px,2vw,18px);max-width:520px;margin:0 auto 40px;line-height:1.65}
    .hero-stats{display:inline-flex;gap:0;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;background:var(--surface)}
    .stat{padding:16px 28px;text-align:center;border-right:1px solid var(--border)}
    .stat:last-child{border-right:none}
    .stat-num{font-size:26px;font-weight:800;color:var(--accent);line-height:1}
    .stat-label{font-size:12px;color:var(--text2);margin-top:4px}

    .cta-bar{background:linear-gradient(90deg,#238636,#2ea043);padding:14px 24px;text-align:center;font-size:14px;font-weight:500;color:#aff5b4}
    .cta-bar a{color:#fff;font-weight:700;text-decoration:underline}

    .controls-wrap{position:sticky;top:0;z-index:100;background:var(--bg);border-bottom:1px solid var(--border);padding:12px 24px}
    .controls-inner{max-width:1280px;margin:0 auto;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
    .search-wrap{position:relative;flex:1;min-width:180px}
    .search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text3);font-size:14px;pointer-events:none}
    .search-wrap input{width:100%;background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:9px 14px 9px 36px;font-size:14px;outline:none;transition:border-color .15s}
    .search-wrap input:focus{border-color:var(--accent)}
    .search-wrap input::placeholder{color:var(--text3)}
    .filter-select{background:var(--surface);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:9px 12px;font-size:14px;cursor:pointer;outline:none}
    .filter-select:focus{border-color:var(--accent)}
    .result-count{color:var(--text3);font-size:13px;margin-left:auto;white-space:nowrap}

    .cat-nav-wrap{max-width:1280px;margin:0 auto;padding:20px 24px 0}
    .cat-nav{display:flex;gap:8px;flex-wrap:wrap}
    .cat-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:999px;font-size:13px;font-weight:600;cursor:pointer;border:1.5px solid var(--border);background:var(--surface);color:var(--text2);transition:all .15s;white-space:nowrap;user-select:none}
    .cat-btn:hover{border-color:var(--border2);color:var(--text);background:var(--surface3)}
    .cat-btn.active{background:color-mix(in srgb,var(--cat-color) 15%,transparent);border-color:var(--cat-color);color:var(--cat-color)}
    .cat-count{background:var(--surface3);color:var(--text3);border-radius:999px;padding:1px 7px;font-size:11px;font-weight:700}
    .cat-btn.active .cat-count{background:color-mix(in srgb,var(--cat-color) 25%,transparent);color:var(--cat-color)}

    .grid-wrap{max-width:1280px;margin:0 auto;padding:20px 24px 80px}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:16px}

    .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;display:flex;flex-direction:column;gap:14px;transition:border-color .2s,box-shadow .2s,transform .15s}
    .card:hover{border-color:var(--border2);box-shadow:0 8px 32px #00000040;transform:translateY(-2px)}
    .card-top{display:flex;flex-direction:column;gap:8px}
    .card-badges{display:flex;gap:6px;flex-wrap:wrap}
    .cat-pill{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;letter-spacing:.2px;padding:3px 9px;border-radius:999px;background:color-mix(in srgb,var(--cat-color) 14%,transparent);border:1px solid color-mix(in srgb,var(--cat-color) 35%,transparent);color:var(--cat-color)}
    .fresh-pill{display:inline-flex;align-items:center;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;background:color-mix(in srgb,var(--fresh-color) 12%,transparent);border:1px solid color-mix(in srgb,var(--fresh-color) 30%,transparent);color:var(--fresh-color)}
    .repo-name{font-size:15px;font-weight:700;color:var(--accent);line-height:1.3;display:block;transition:color .15s}
    .repo-name:hover{color:#79b8ff;text-decoration:underline}
    .description{font-size:13px;color:var(--text2);line-height:1.55}
    .why-box{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px 12px}
    .why-label{font-size:11px;font-weight:700;color:var(--text3);letter-spacing:.5px;text-transform:uppercase;display:block;margin-bottom:5px}
    .why-text{font-size:12px;color:var(--text2);line-height:1.55}
    .issue-links{display:flex;flex-direction:column;gap:5px}
    .issue-link{display:flex;align-items:flex-start;gap:6px;font-size:12px;color:var(--green);padding:6px 10px;border-radius:7px;background:#23863610;border:1px solid #23863628;transition:background .15s;line-height:1.4}
    .issue-link:hover{background:#23863622}
    .issue-arrow{flex-shrink:0;font-size:13px;margin-top:1px}
    .card-footer{margin-top:auto}
    .meta-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12px}
    .lang-tag{display:inline-flex;align-items:center;gap:5px;color:var(--text2)}
    .lang-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
    .meta-chip{color:var(--text2);background:var(--surface3);border:1px solid var(--border);border-radius:999px;padding:2px 9px;font-size:11px}
    .gfi-chip{margin-left:auto;background:#388bfd18;color:var(--accent);border:1px solid #388bfd35;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:700}
    .card-added{font-size:11px;color:var(--text3);margin-top:8px}
    .card-added a{color:var(--text3)}
    .card-added a:hover{color:var(--text2)}

    .empty{grid-column:1/-1;text-align:center;padding:80px 24px;color:var(--text2)}
    .empty-icon{font-size:40px;margin-bottom:16px}
    .empty h2{font-size:20px;margin-bottom:8px;color:var(--text)}
    .empty a{color:var(--accent)}

    .how{border-top:1px solid var(--border);padding:72px 24px;background:var(--surface)}
    .how-inner{max-width:1000px;margin:0 auto;text-align:center}
    .section-label{font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--accent);margin-bottom:12px}
    .how h2{font-size:28px;font-weight:800;margin-bottom:48px}
    .steps{display:flex;justify-content:center;gap:24px;flex-wrap:wrap}
    .step{max-width:200px;text-align:center}
    .step-num{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#1f3d6e,#388bfd);color:#fff;font-weight:800;font-size:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 0 20px #388bfd30}
    .step h3{font-size:14px;font-weight:700;margin-bottom:6px}
    .step p{font-size:13px;color:var(--text2);line-height:1.55}

    footer{border-top:1px solid var(--border);padding:28px 24px;text-align:center;font-size:13px;color:var(--text3)}
    footer a{color:var(--text3)}
    footer a:hover{color:var(--text2)}

    @media(max-width:640px){.grid{grid-template-columns:1fr}.hero-stats{flex-direction:column}.stat{border-right:none;border-bottom:1px solid var(--border)}.stat:last-child{border-bottom:none}}
  </style>
</head>
<body>

<section class="hero">
  <div class="hero-inner">
    <div class="hero-badge">🤖 Bot-verified · Human-curated</div>
    <h1>Find repos that are<br>actually beginner-friendly</h1>
    <p class="hero-sub">Every repo passed a 6-point automated check. No dead repos. No fake issues. No wasted time.</p>
    <div class="hero-stats">
      <div class="stat"><div class="stat-num">${repos.length}</div><div class="stat-label">Verified repos</div></div>
      <div class="stat"><div class="stat-num">${totalGFI}</div><div class="stat-label">Open beginner issues</div></div>
      <div class="stat"><div class="stat-num">${usedCats.length - 1}</div><div class="stat-label">Categories</div></div>
    </div>
  </div>
</section>

<div class="cta-bar">
  Know a beginner-friendly repo? → <a href="https://github.com/P-r-e-m-i-u-m/beginner-oss/compare" target="_blank">Open a PR to suggest it</a> — bot reviews automatically
</div>

<div class="controls-wrap">
  <div class="controls-inner">
    <div class="search-wrap">
      <span class="search-icon">🔍</span>
      <input type="text" id="search" placeholder="Search repos, languages, descriptions…" oninput="applyFilters()">
    </div>
    <select class="filter-select" id="lang-filter" onchange="applyFilters()">
      <option value="">All languages</option>
      ${langs.map(l => `<option value="${l}">${l}</option>`).join("\n      ")}
    </select>
    <select class="filter-select" id="sort-select" onchange="applyFilters()">
      <option value="gfi">Most beginner issues</option>
      <option value="stars">Most stars</option>
    </select>
    <span class="result-count" id="result-count">${repos.length} repos</span>
  </div>
</div>

<div class="cat-nav-wrap">
  <div class="cat-nav" id="cat-nav">
    ${usedCats.map(cat => {
      const cfg = CATEGORIES[cat] || CATEGORIES["Other"];
      const count = cat === "All" ? repos.length : repos.filter(r => inferCategory(r) === cat).length;
      return `<button class="cat-btn${cat === "All" ? " active" : ""}" data-cat="${cat}" style="--cat-color:${cfg.color}" onclick="selectCat(this)">${cfg.icon} ${cat} <span class="cat-count">${count}</span></button>`;
    }).join("\n    ")}
  </div>
</div>

<div class="grid-wrap">
  <div class="grid" id="grid">
    ${repos.map(repoCard).join("\n  ")}
  </div>
</div>

<section class="how">
  <div class="how-inner">
    <div class="section-label">How it works</div>
    <h2>Zero guesswork. Just quality repos.</h2>
    <div class="steps">
      <div class="step"><div class="step-num">1</div><h3>Someone suggests a repo</h3><p>Open a PR with the URL and why it's beginner-friendly.</p></div>
      <div class="step"><div class="step-num">2</div><h3>Bot validates it</h3><p>Checks README, CONTRIBUTING.md, license, activity, contributors, and open issues.</p></div>
      <div class="step"><div class="step-num">3</div><h3>Auto-merged or closed</h3><p>Pass = instant merge + site rebuild. Fail = closed with exact reasons.</p></div>
      <div class="step"><div class="step-num">4</div><h3>Stays fresh</h3><p>Every Monday the bot re-checks all repos and removes dead ones automatically.</p></div>
    </div>
  </div>
</section>

<footer>
  <p>Built by <a href="https://github.com/P-r-e-m-i-u-m" target="_blank">@P-r-e-m-i-u-m</a> · <a href="https://github.com/P-r-e-m-i-u-m/beginner-oss" target="_blank">Source on GitHub</a> · Updated ${new Date().toISOString().split("T")[0]}</p>
</footer>

<script>
  let activeCat = "All";
  const allCards = Array.from(document.querySelectorAll(".card"));

  function selectCat(btn) {
    document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeCat = btn.dataset.cat;
    applyFilters();
  }

  function applyFilters() {
    const q = document.getElementById("search").value.toLowerCase();
    const lang = document.getElementById("lang-filter").value;
    const sort = document.getElementById("sort-select").value;
    let visible = allCards.filter(card => {
      const matchCat = activeCat === "All" || card.dataset.cat === activeCat;
      const matchLang = !lang || card.dataset.lang === lang;
      const matchQ = !q || card.dataset.name.includes(q) || card.textContent.toLowerCase().includes(q);
      return matchCat && matchLang && matchQ;
    });
    visible.sort((a, b) => sort === "stars"
      ? parseInt(b.dataset.stars) - parseInt(a.dataset.stars)
      : parseInt(b.dataset.gfi) - parseInt(a.dataset.gfi));
    const grid = document.getElementById("grid");
    grid.querySelectorAll(".empty").forEach(e => e.remove());
    allCards.forEach(c => { c.style.display = "none"; });
    if (visible.length === 0) {
      grid.insertAdjacentHTML("beforeend", \`<div class="empty"><div class="empty-icon">🔍</div><h2>No repos found</h2><p>Try a different filter, or <a href="https://github.com/P-r-e-m-i-u-m/beginner-oss/compare">suggest one</a>.</p></div>\`);
    } else {
      visible.forEach(c => { c.style.display = ""; grid.appendChild(c); });
    }
    document.getElementById("result-count").textContent = \`\${visible.length} repo\${visible.length !== 1 ? "s" : ""}\`;
  }
</script>
</body>
</html>`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "index.html"), html);
console.log(`Built: ${repos.length} repos → docs/index.html`);
