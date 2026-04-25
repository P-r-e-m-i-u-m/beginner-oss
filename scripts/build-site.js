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

function difficultyStars(d) {
  const level = Math.min(5, Math.max(1, d || 1));
  const labels = ["","Absolute beginner","Easy","Moderate","Challenging","Expert"];
  const colors = ["","#22c55e","#84cc16","#eab308","#f97316","#ef4444"];
  const filled = "★".repeat(level);
  const empty  = "☆".repeat(5 - level);
  return `<span class="diff-stars" title="${labels[level]}" style="--diff-color:${colors[level]}">${filled}<span class="diff-empty">${empty}</span></span><span class="diff-label" style="color:${colors[level]}">${labels[level]}</span>`;
}

function autoDifficulty(repo) {
  if (repo.difficulty) return repo.difficulty;
  if (repo.contributors >= 1000 || repo.stars >= 100000) return 4;
  if (repo.contributors >= 200  || repo.stars >= 10000)  return 3;
  if (repo.contributors >= 50)  return 2;
  return 1;
}

function repoCard(repo) {
  const cat = inferCategory(repo);
  const catCfg = CATEGORIES[cat] || CATEGORIES["Other"];
  const fresh = freshnessBadge(repo.last_commit_days || 0);
  const langColor = languageColor(repo.language);
  const diff = autoDifficulty(repo);
  const issueLinks = (repo.good_first_issue_links || []).slice(0, 3).map(i =>
    `<a href="${i.url}" target="_blank" rel="noopener" class="issue-link"><span class="issue-arrow">↗</span><span>${i.title.slice(0,58)}${i.title.length>58?"…":""}</span></a>`
  ).join("");

  return `
<div class="card" data-lang="${repo.language||"Unknown"}" data-cat="${cat}" data-name="${repo.full_name.toLowerCase()}" data-gfi="${repo.good_first_issues}" data-stars="${repo.stars}" data-diff="${diff}">
  <div class="card-top">
    <div class="card-badges">
      <span class="cat-pill" style="--cat-color:${catCfg.color}">${catCfg.icon} ${cat}</span>
      <span class="fresh-pill" style="--fresh-color:${fresh.color}">${fresh.label}</span>
    </div>
    <div class="card-title-row">
      <a href="${repo.url}" target="_blank" rel="noopener" class="repo-name">${repo.full_name}</a>
      <div class="diff-wrap">${difficultyStars(diff)}</div>
    </div>
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
    .cat-pill{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;background:color-mix(in srgb,var(--cat-color) 14%,transparent);border:1px solid color-mix(in srgb,var(--cat-color) 35%,transparent);color:var(--cat-color)}
    .fresh-pill{display:inline-flex;align-items:center;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;background:color-mix(in srgb,var(--fresh-color) 12%,transparent);border:1px solid color-mix(in srgb,var(--fresh-color) 30%,transparent);color:var(--fresh-color)}
    .card-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;flex-wrap:wrap}
    .repo-name{font-size:15px;font-weight:700;color:var(--accent);line-height:1.3;display:block;transition:color .15s}
    .repo-name:hover{color:#79b8ff;text-decoration:underline}
    .diff-wrap{display:flex;align-items:center;gap:5px;flex-shrink:0;margin-top:2px}
    .diff-stars{font-size:13px;color:var(--diff-color);letter-spacing:1px}
    .diff-empty{color:var(--border2)}
    .diff-label{font-size:10px;font-weight:700;letter-spacing:.3px;white-space:nowrap}
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
  Know a beginner-friendly repo? → <a href="https://github.com/P-r-e-m-i-u-m/beginner-oss/compare" target="_blank">Open a PR to suggest it</a> — bot reviews automatically &nbsp;·&nbsp; <a href="why-add.html">Why add your repo? →</a>
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
    <select class="filter-select" id="diff-filter" onchange="applyFilters()">
      <option value="">Any difficulty</option>
      <option value="1">⭐ Absolute beginner</option>
      <option value="2">⭐⭐ Easy</option>
      <option value="3">⭐⭐⭐ Moderate</option>
      <option value="4">⭐⭐⭐⭐ Challenging</option>
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
    const diff = document.getElementById("diff-filter").value;
    const sort = document.getElementById("sort-select").value;
    let visible = allCards.filter(card => {
      const matchCat = activeCat === "All" || card.dataset.cat === activeCat;
      const matchLang = !lang || card.dataset.lang === lang;
      const matchDiff = !diff || card.dataset.diff === diff;
      const matchQ = !q || card.dataset.name.includes(q) || card.textContent.toLowerCase().includes(q);
      return matchCat && matchLang && matchDiff && matchQ;
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

const whyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Why add your repo? — beginner-oss</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#0d1117;--surface:#161b22;--surface2:#1c2128;--border:#30363d;--text:#e6edf3;--text2:#9198a1;--text3:#656d76;--accent:#58a6ff}
    body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;line-height:1.6;min-height:100vh}
    a{color:var(--accent);text-decoration:none}
    a:hover{text-decoration:underline}
    .topbar{border-bottom:1px solid var(--border);padding:14px 24px;display:flex;align-items:center;gap:12px}
    .topbar-back{font-size:13px;color:var(--text2)}
    .topbar-back:hover{color:var(--text)}
    .topbar-logo{font-weight:800;font-size:16px;color:var(--text)}
    .hero{padding:64px 24px 48px;text-align:center;background:radial-gradient(ellipse 80% 60% at 50% -10%,#1f2d4a 0%,transparent 70%);border-bottom:1px solid var(--border)}
    .hero-badge{display:inline-flex;align-items:center;gap:6px;background:#238636;color:#aff5b4;border-radius:999px;padding:5px 14px;font-size:12px;font-weight:600;margin-bottom:20px}
    .hero h1{font-size:clamp(28px,5vw,48px);font-weight:800;letter-spacing:-1px;line-height:1.15;margin-bottom:16px;background:linear-gradient(135deg,#e6edf3 30%,#58a6ff 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .hero p{color:var(--text2);font-size:17px;max-width:500px;margin:0 auto}
    .content{max-width:800px;margin:0 auto;padding:56px 24px 80px}
    .section{margin-bottom:56px}
    .section h2{font-size:22px;font-weight:800;margin-bottom:6px}
    .section-sub{color:var(--text2);font-size:14px;margin-bottom:24px}
    .benefit-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
    .benefit-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px}
    .benefit-icon{font-size:24px;margin-bottom:10px}
    .benefit-card h3{font-size:14px;font-weight:700;margin-bottom:6px}
    .benefit-card p{font-size:13px;color:var(--text2);line-height:1.55}
    .criteria-list{display:flex;flex-direction:column;gap:10px}
    .criteria-item{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 16px;display:flex;gap:14px}
    .criteria-check{width:28px;height:28px;border-radius:50%;background:#23863620;border:1px solid #23863650;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
    .criteria-text h4{font-size:14px;font-weight:700;margin-bottom:3px}
    .criteria-text p{font-size:13px;color:var(--text2);line-height:1.5}
    .faq{display:flex;flex-direction:column;gap:12px}
    .faq-item{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px}
    .faq-item h4{font-size:14px;font-weight:700;margin-bottom:6px;color:var(--accent)}
    .faq-item p{font-size:13px;color:var(--text2);line-height:1.55}
    .faq-item code{background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:1px 6px;font-size:12px;color:var(--text)}
    .cta-box{background:linear-gradient(135deg,#1a2d1a,#1f3d2a);border:1px solid #238636;border-radius:14px;padding:36px;text-align:center}
    .cta-box h2{font-size:22px;font-weight:800;margin-bottom:10px}
    .cta-box p{color:var(--text2);font-size:14px;margin-bottom:24px}
    .cta-btn{display:inline-flex;background:#238636;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none}
    .cta-btn:hover{background:#2ea043;text-decoration:none}
    .steps-list{display:flex;flex-direction:column}
    .step-row{display:flex;gap:16px;padding:16px 0;border-bottom:1px solid var(--border)}
    .step-row:last-child{border-bottom:none}
    .step-num{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#1f3d6e,#388bfd);color:#fff;font-weight:800;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .step-content h4{font-size:14px;font-weight:700;margin-bottom:4px}
    .step-content p{font-size:13px;color:var(--text2);line-height:1.5}
    .step-content code{background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:1px 6px;font-size:12px;color:var(--text)}
    footer{border-top:1px solid var(--border);padding:24px;text-align:center;font-size:13px;color:var(--text3)}
    footer a{color:var(--text3)}
  </style>
</head>
<body>
<div class="topbar">
  <a href="index.html" class="topbar-back">← Back to directory</a>
  <span style="color:var(--border);margin:0 4px">|</span>
  <span class="topbar-logo">beginner-oss</span>
</div>
<div class="hero">
  <div class="hero-badge">📢 For maintainers</div>
  <h1>Why add your repo to beginner-oss?</h1>
  <p>Get your project in front of motivated beginners actively looking for their first contribution.</p>
</div>
<div class="content">
  <div class="section">
    <h2>What you get</h2>
    <p class="section-sub">Every listed repo gets real visibility with developers ready to contribute.</p>
    <div class="benefit-grid">
      <div class="benefit-card"><div class="benefit-icon">🎯</div><h3>Targeted traffic</h3><p>Visitors are actively looking for their first PR — motivated contributors, not browsers.</p></div>
      <div class="benefit-card"><div class="benefit-icon">🔗</div><h3>Direct issue links</h3><p>Your good first issues show as clickable links. Zero friction for contributors.</p></div>
      <div class="benefit-card"><div class="benefit-icon">🤖</div><h3>Quality signal</h3><p>The verified badge shows contributors your repo is genuinely welcoming.</p></div>
      <div class="benefit-card"><div class="benefit-icon">🔄</div><h3>Always fresh</h3><p>Issue counts refresh weekly. Dead listings removed automatically.</p></div>
      <div class="benefit-card"><div class="benefit-icon">📊</div><h3>Category placement</h3><p>Listed under your tech category so the right people find you.</p></div>
      <div class="benefit-card"><div class="benefit-icon">⚡</div><h3>Zero maintenance</h3><p>List once, stay listed. Bot re-validates every Monday.</p></div>
    </div>
  </div>
  <div class="section">
    <h2>What the bot checks</h2>
    <p class="section-sub">All 6 criteria checked automatically. Fix any that fail and re-submit.</p>
    <div class="criteria-list">
      <div class="criteria-item"><div class="criteria-check">✅</div><div class="criteria-text"><h4>README exists</h4><p>Beginners need to understand what your project does before contributing.</p></div></div>
      <div class="criteria-item"><div class="criteria-check">✅</div><div class="criteria-text"><h4>CONTRIBUTING.md exists</h4><p>Tells contributors how to fork, set up, and open a PR. Without it, beginners bounce.</p></div></div>
      <div class="criteria-item"><div class="criteria-check">✅</div><div class="criteria-text"><h4>Open source license</h4><p>Contributors need legal clarity. MIT, Apache, GPL — any recognized OSS license works.</p></div></div>
      <div class="criteria-item"><div class="criteria-check">✅</div><div class="criteria-text"><h4>10+ contributors</h4><p>Shows active community. Single-maintainer repos risk unreviewed PRs.</p></div></div>
      <div class="criteria-item"><div class="criteria-check">✅</div><div class="criteria-text"><h4>Active in last 90 days</h4><p>At least one commit in 90 days. Inactive repos mean unreviewed PRs.</p></div></div>
      <div class="criteria-item"><div class="criteria-check">✅</div><div class="criteria-text"><h4>Open good first issues</h4><p>At least one open issue tagged <code>good first issue</code>. No issues = nothing to work on.</p></div></div>
    </div>
  </div>
  <div class="section">
    <h2>How to add your repo</h2>
    <p class="section-sub">Takes 3 minutes. Bot handles the rest.</p>
    <div class="steps-list">
      <div class="step-row"><div class="step-num">1</div><div class="step-content"><h4>Fork beginner-oss</h4><p>Go to <a href="https://github.com/P-r-e-m-i-u-m/beginner-oss" target="_blank">github.com/P-r-e-m-i-u-m/beginner-oss</a> and click Fork.</p></div></div>
      <div class="step-row"><div class="step-num">2</div><div class="step-content"><h4>Create a suggestion file</h4><p>Create <code>suggestions/owner-reponame.md</code> with the repo URL and why it is beginner-friendly.</p></div></div>
      <div class="step-row"><div class="step-num">3</div><div class="step-content"><h4>Open a PR</h4><p>Bot validates within minutes. Pass = auto-merged and live. Fail = closed with exact reasons.</p></div></div>
      <div class="step-row"><div class="step-num">4</div><div class="step-content"><h4>Done</h4><p>Your repo is live. Bot re-checks every Monday to keep it fresh.</p></div></div>
    </div>
  </div>
  <div class="section">
    <h2>Common questions</h2>
    <div class="faq">
      <div class="faq-item"><h4>Can I suggest my own repo?</h4><p>No. The bot auto-closes self-promotions. Listings are community-verified, not self-reported.</p></div>
      <div class="faq-item"><h4>My repo has no CONTRIBUTING.md. What do I do?</h4><p>Create one — explain how to fork, clone, run locally, and open a PR. Then ask a contributor to suggest it.</p></div>
      <div class="faq-item"><h4>What if my listing gets removed?</h4><p>The weekly bot removes repos inactive 180+ days. If your repo becomes active again, suggest it again.</p></div>
      <div class="faq-item"><h4>How long does the bot take?</h4><p>Under 2 minutes from PR open to bot comment. Site rebuilds within 5 minutes if it passes.</p></div>
    </div>
  </div>
  <div class="cta-box">
    <h2>Ready to get contributors?</h2>
    <p>Ask someone who has used your repo to suggest it.</p>
    <a href="https://github.com/P-r-e-m-i-u-m/beginner-oss/compare" target="_blank" class="cta-btn">Open a PR to suggest a repo →</a>
  </div>
</div>
<footer><p>Built by <a href="https://github.com/P-r-e-m-i-u-m">@P-r-e-m-i-u-m</a> · <a href="index.html">Back to directory</a> · <a href="https://github.com/P-r-e-m-i-u-m/beginner-oss">Source on GitHub</a></p></footer>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, "why-add.html"), whyHtml);
console.log(`Built: ${repos.length} repos → docs/index.html + docs/why-add.html`);
