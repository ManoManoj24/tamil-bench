/* Tamil Bench SPA — renders data/scores.json */
(function () {
  "use strict";

  var REPO = "https://github.com/ManoManoj24/tamil-bench";
  var state = {
    tab: "overall",
    sortKey: null,
    sortDir: 1,
    query: "",
    lang: localStorage.getItem("tb-lang") || "en",
    data: null,
  };

  /* ---------- i18n ---------- */
  var I18N = {
    en: {
      "skip": "Skip to leaderboard", "nav.board": "Leaderboard", "nav.charts": "Charts",
      "nav.method": "Methodology", "nav.run": "Run it",
      "hero.eyebrow": "Open benchmark · API-only · No GPU needed",
      "hero.h1a": "How well do AI models", "hero.h1b": "know Tamil?",
      "hero.lede": "We sit AI models for Tamil exams — multiple-choice, reading comprehension, logic — and publish the marks. Every score is auditable down to the individual answer.",
      "stat.models": "models evaluated", "stat.questions": "questions in the exam",
      "stat.tasks": "tasks", "stat.updated": "last updated",
      "board.h2": "Leaderboard", "board.sub": "Click a column to sort. Click a model for its full report card.",
      "board.search": "Search models…", "board.empty": "No models match your search.",
      "charts.h2": "Score charts", "charts.sub": "All models, side by side, per task.",
      "method.h2": "Methodology", "method.c1h": "The exams", "method.c2h": "The rules",
      "method.c3h": "The Overall score",
      "method.c1a": "<b>MILU</b> — 199 Tamil MCQs from Indian competitive exams (AI4Bharat + IBM Research, CC-BY-4.0). Metric: accuracy.",
      "method.c1b": "<b>IndicQA</b> — 100 reading-comprehension questions over Tamil Wikipedia passages (AI4Bharat, CC-BY-SA-4.0). Metrics: exact match + F1.",
      "method.c1c": "<b>IndicXNLI</b> — 200 three-way logic questions: entail, contradict, or neutral (repaired mirror of AI4Bharat's IndicXNLI). Metric: accuracy.",
      "method.c1d": "<b>Bluff catch</b> — unanswerable IndicQA traps: does the model abstain or invent an answer? Lower bluff rate wins.",
      "method.c2a": "Zero-shot for MILU/XNLI; 5-shot for MILU only where noted. Temperature 0.",
      "method.c2b": "Fixed random seed (42); MILU sampled stratified by subject.",
      "method.c2c": "API errors and unparseable answers count as wrong — they stay in the denominator.",
      "method.c2d": "95% Wilson confidence intervals on every accuracy-style score.",
      "method.c2e": "API-only models, no GPUs. Every answer sheet is saved in the repo.",
      "method.c3a": "Overall is the mean of a model's available task scores — MILU accuracy, IndicQA F1, IndicXNLI accuracy — each on a 0–100 scale, rounded to one decimal.",
      "method.c3b": "Bluff rate is excluded: lower is better there, so it can't average with accuracy-style metrics. It has its own tab.",
      "eli5.h2": "What is Tamil Bench?",
      "eli5.p1": "AI chatbots are tested on English constantly, and on a handful of other big languages. Tamil — spoken by ~85 million people — usually gets one line in a table, if it appears at all. Tamil Bench fixes the measuring stick: three exams, entirely in Tamil script, marks published for all to see.",
      "eli5.p2": "Think of it as a report card. Anyone can re-run the exam on any model through its API — no GPU, a few dollars at most — and every answer sheet is saved in the repo, so no score is taken on trust.",
      "eli5.p3": "The headline finding so far: models ace the exam MCQs but stumble on reading comprehension — knowing facts in Tamil and reading Tamil precisely are two different skills.",
      "run.h2": "Run it yourself", "run.sub": "One model, all three exams, one command. Bring an OpenRouter API key.",
      "run.setup": "Setup", "run.copy": "Copy", "run.bench": "Run the bench", "run.copy2": "Copy",
      "run.note": "MILU needs a free Hugging Face gate accept (HF_TOKEN). Results land in results/ as JSONL — one line per question, fully auditable.",
      "foot.tag": "An open, runnable exam for AI models in Tamil.",
      "foot.data": "Data", "foot.by": "by AI4Bharat", "foot.code": "Code",
      "foot.fork": "Usability + leaderboard rebuild — forked from",
      "noscript": "This leaderboard needs JavaScript to render the scores."
    },
    ta: {
      "skip": "மதிப்பெண் பலகைக்குச் செல்க", "nav.board": "மதிப்பெண் பலகை", "nav.charts": "விளக்கப்படங்கள்",
      "nav.method": "முறையியல்", "nav.run": "இயக்குக",
      "hero.eyebrow": "திறந்த அளவுகோல் · API மட்டும் · GPU தேவையில்லை",
      "hero.h1a": "AI மாதிரிகளுக்கு", "hero.h1b": "தமிழ் எவ்வளவு தெரியும்?",
      "hero.lede": "AI மாதிரிகளைத் தமிழ்த் தேர்வுகளில் உட்கார வைத்து மதிப்பெண்களை வெளியிடுகிறோம் — பல்தேர்வு, வாசிப்புப் புரிதல், தர்க்கம். ஒவ்வொரு மதிப்பெண்ணையும் சரிபார்க்கலாம்.",
      "stat.models": "மதிப்பிடப்பட்ட மாதிரிகள்", "stat.questions": "மொத்த வினாக்கள்",
      "stat.tasks": "தேர்வுகள்", "stat.updated": "புதுப்பிக்கப்பட்டது",
      "board.h2": "மதிப்பெண் பலகை", "board.sub": "வரிசைப்படுத்த நெடுவரிசையைச் சொடுக்குக. முழு அறிக்கைக்கு மாதிரியைச் சொடுக்குக.",
      "board.search": "மாதிரிகளைத் தேடுக…", "board.empty": "தேடலுக்கு எந்த மாதிரியும் பொருந்தவில்லை.",
      "charts.h2": "விளக்கப்படங்கள்", "charts.sub": "ஒவ்வொரு தேர்விலும் அனைத்து மாதிரிகளும்.",
      "method.h2": "முறையியல்", "method.c1h": "தேர்வுகள்", "method.c2h": "விதிகள்",
      "method.c3h": "மொத்த மதிப்பெண்",
      "eli5.h2": "Tamil Bench என்றால் என்ன?",
      "run.h2": "நீங்களே இயக்குங்கள்", "run.sub": "ஒரு மாதிரி, மூன்று தேர்வுகள், ஒரே கட்டளை. OpenRouter API விசை தேவை.",
      "run.setup": "அமைப்பு", "run.copy": "நகலெடு", "run.bench": "தேர்வை இயக்குக", "run.copy2": "நகலெடு",
      "run.note": "MILU-க்கு இலவச Hugging Face அனுமதி (HF_TOKEN) தேவை. முடிவுகள் results/ கோப்புறையில் JSONL ஆகச் சேமிக்கப்படும்.",
      "foot.tag": "தமிழில் AI மாதிரிகளுக்கான திறந்த, இயக்கக்கூடிய தேர்வு.",
      "foot.data": "தரவு", "foot.by": "— AI4Bharat", "foot.code": "நிரல்",
      "foot.fork": "பயன்பாட்டு மேம்பாடுகள் + மதிப்பெண் பலகை மறுவடிவமைப்பு — மூலம்:",
      "noscript": "மதிப்பெண்களைக் காட்ட JavaScript தேவை."
    }
  };
  /* JS-rendered UI strings */
  var T = {
    en: {
      tab_overall: "Overall", tab_milu: "MILU", tab_indicqa: "IndicQA", tab_indicxnli: "XNLI", tab_bluff: "Bluff",
      col_rank: "#", col_model: "Model", col_org: "Org", col_overall: "Overall",
      col_milu: "MILU acc", col_f1: "IndicQA F1", col_em: "IndicQA EM", col_xnli: "XNLI acc",
      col_score: "Accuracy", col_ci: "95% CI", col_n: "n", col_err: "Errors", col_upd: "Updated",
      col_bluff: "Bluff rate", col_abstain: "Abstain", col_traps: "Traps",
      note_overall: "Overall = mean of available task scores (MILU accuracy, IndicQA F1, XNLI accuracy). Bluff excluded — lower is better there.",
      note_bluff: "Lower bluff rate is better: on unanswerable questions, did the model abstain or invent an answer?",
      click_model: "Report card", close: "Close",
      m_overall: "Overall", m_best: "Strongest", m_worst: "Weakest", m_of: "of",
      m_n: "questions", m_err: "errors", m_date: "tested", m_sheet: "answer sheet",
      m_bluff_note: "Share of unanswerable trap questions where the model bluffed an answer instead of abstaining.",
      copied: "Copied", load_err: "Could not load scores.json — are you serving this over http?"
    },
    ta: {
      tab_overall: "மொத்தம்", tab_milu: "MILU", tab_indicqa: "IndicQA", tab_indicxnli: "XNLI", tab_bluff: "பொய் பிடிப்பு",
      col_rank: "#", col_model: "மாதிரி", col_org: "நிறுவனம்", col_overall: "மொத்தம்",
      col_milu: "MILU", col_f1: "IndicQA F1", col_em: "IndicQA EM", col_xnli: "XNLI",
      col_score: "சரியான %", col_ci: "95% நம்பிக்கை", col_n: "எண்", col_err: "பிழை", col_upd: "தேதி",
      col_bluff: "பொய் விகிதம்", col_abstain: "தவிர்ப்பு", col_traps: "பொறிகள்",
      note_overall: "மொத்தம் = தேர்வு மதிப்பெண்களின் சராசரி (MILU, IndicQA F1, XNLI). பொய் விகிதம் சேர்க்கப்படவில்லை.",
      note_bluff: "குறைவான பொய் விகிதம் நல்லது: விடையற்ற கேள்விகளில் மாதிரி தவிர்த்ததா, பொய் சொன்னதா?",
      click_model: "அறிக்கை", close: "மூடுக",
      m_overall: "மொத்தம்", m_best: "சிறந்தது", m_worst: "பலவீனம்", m_of: "/",
      m_n: "வினாக்கள்", m_err: "பிழைகள்", m_date: "தேதி", m_sheet: "விடைத்தாள்",
      m_bluff_note: "விடையற்ற பொறி கேள்விகளில் மாதிரி பொய் சொன்ன விகிதம்.",
      copied: "நகலெடுக்கப்பட்டது", load_err: "scores.json ஏற்ற முடியவில்லை."
    }
  };
  function t(k) { return (T[state.lang] && T[state.lang][k]) || T.en[k] || k; }

  function applyI18n() {
    var d = I18N[state.lang] || I18N.en;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      if (d[k] !== undefined) el.innerHTML = d[k];
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-ph");
      if (d[k] !== undefined) el.setAttribute("placeholder", d[k]);
    });
    document.querySelectorAll("#langToggle [data-lang-opt]").forEach(function (el) {
      el.classList.toggle("on", el.getAttribute("data-lang-opt") === state.lang);
    });
    document.documentElement.lang = state.lang === "ta" ? "ta" : "en";
  }

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function fmt(v) { return v === null || v === undefined ? "–" : (Math.round(v * 10) / 10).toFixed(1); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
  function slug(id) { return id.replace("/", "_"); }
  function latestDate(m) {
    var ds = ["milu", "indicqa", "indicxnli"].map(function (k) { return m.tasks[k] && m.tasks[k].date; }).filter(Boolean);
    return ds.length ? ds.sort().pop() : "–";
  }

  var SHEET_PREFIX = { milu: "milu", indicqa: "indicqa", indicxnli: "xnli" };
  function sheetUrl(taskKey, m) {
    var rec = m.tasks[taskKey === "bluff" ? "indicqa" : taskKey];
    if (!rec || !rec.sheet) return null;
    return REPO + "/blob/main/" + rec.sheet;
  }

  /* task value extractors for table / sort */
  var TABS = ["overall", "milu", "indicqa", "indicxnli", "bluff"];
  function tabValue(m, tab) {
    switch (tab) {
      case "overall": return m.overall;
      case "milu": return m.tasks.milu && m.tasks.milu.score;
      case "indicqa": return m.tasks.indicqa && m.tasks.indicqa.f1;
      case "indicxnli": return m.tasks.indicxnli && m.tasks.indicxnli.score;
      case "bluff": return m.tasks.bluff && m.tasks.bluff.bluff_rate;
    }
  }
  function tabDir(tab) { return tab === "bluff" ? 1 : -1; } // bluff: ascending

  var COLUMNS = {
    overall: [
      { key: "rank", label: "col_rank" },
      { key: "model", label: "col_model", sort: true },
      { key: "org", label: "col_org", sort: true },
      { key: "overall", label: "col_overall", sort: true, strong: true },
      { key: "milu", label: "col_milu", sort: true },
      { key: "f1", label: "col_f1", sort: true },
      { key: "xnli", label: "col_xnli", sort: true },
      { key: "upd", label: "col_upd", sort: true }
    ],
    milu: [
      { key: "rank", label: "col_rank" },
      { key: "model", label: "col_model", sort: true },
      { key: "org", label: "col_org", sort: true },
      { key: "score", label: "col_score", sort: true, strong: true, bar: true },
      { key: "ci", label: "col_ci" },
      { key: "n", label: "col_n", sort: true },
      { key: "err", label: "col_err", sort: true },
      { key: "upd", label: "col_upd", sort: true }
    ],
    indicqa: [
      { key: "rank", label: "col_rank" },
      { key: "model", label: "col_model", sort: true },
      { key: "org", label: "col_org", sort: true },
      { key: "f1", label: "col_f1", sort: true, strong: true, bar: true },
      { key: "em", label: "col_em", sort: true },
      { key: "emci", label: "col_ci" },
      { key: "n", label: "col_n", sort: true },
      { key: "err", label: "col_err", sort: true },
      { key: "upd", label: "col_upd", sort: true }
    ],
    indicxnli: [
      { key: "rank", label: "col_rank" },
      { key: "model", label: "col_model", sort: true },
      { key: "org", label: "col_org", sort: true },
      { key: "score", label: "col_score", sort: true, strong: true, bar: true },
      { key: "ci", label: "col_ci" },
      { key: "n", label: "col_n", sort: true },
      { key: "err", label: "col_err", sort: true },
      { key: "upd", label: "col_upd", sort: true }
    ],
    bluff: [
      { key: "rank", label: "col_rank" },
      { key: "model", label: "col_model", sort: true },
      { key: "org", label: "col_org", sort: true },
      { key: "bluff", label: "col_bluff", sort: true, strong: true, bar: true },
      { key: "abstain", label: "col_abstain", sort: true },
      { key: "traps", label: "col_traps", sort: true }
    ]
  };

  function cellVal(m, key) {
    var tk = state.tab === "bluff" ? "bluff" : state.tab === "overall" ? null : state.tab;
    var rec = tk ? m.tasks[tk] : null;
    switch (key) {
      case "model": return m.display_name.toLowerCase();
      case "org": return m.org.toLowerCase();
      case "overall": return m.overall;
      case "milu": return m.tasks.milu && m.tasks.milu.score;
      case "f1": return m.tasks.indicqa && m.tasks.indicqa.f1;
      case "em": return m.tasks.indicqa && m.tasks.indicqa.em;
      case "xnli": return m.tasks.indicxnli && m.tasks.indicxnli.score;
      case "score": return rec && rec.score;
      case "n": return rec && rec.n;
      case "err": return rec && rec.errors;
      case "upd": return latestDate(m);
      case "bluff": return m.tasks.bluff && m.tasks.bluff.bluff_rate;
      case "abstain": return m.tasks.bluff && m.tasks.bluff.abstain_rate;
      case "traps": return m.tasks.bluff && m.tasks.bluff.n_traps;
    }
    return null;
  }

  function filtered() {
    var q = state.query.trim().toLowerCase();
    var models = state.data.models.filter(function (m) {
      if (state.tab !== "overall" && tabValue(m, state.tab) == null) return false;
      if (!q) return true;
      return (m.display_name + " " + m.org + " " + m.id).toLowerCase().indexOf(q) >= 0;
    });
    var key = state.sortKey, dir = state.sortDir;
    models.sort(function (a, b) {
      var va = key ? cellVal(a, key) : tabValue(a, state.tab);
      var vb = key ? cellVal(b, key) : tabValue(b, state.tab);
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      if (typeof va === "string") return va.localeCompare(vb) * dir;
      return (va - vb) * dir;
    });
    return models;
  }

  /* ---------- render: tabs / table ---------- */
  function renderTabs() {
    var el = $("tabs");
    el.innerHTML = "";
    TABS.forEach(function (tab) {
      var b = document.createElement("button");
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", tab === state.tab ? "true" : "false");
      b.textContent = t("tab_" + tab);
      b.addEventListener("click", function () {
        state.tab = tab; state.sortKey = null; state.sortDir = tabDir(tab);
        render();
      });
      el.appendChild(b);
    });
    $("taskNote").textContent = state.tab === "overall" ? t("note_overall") :
      state.tab === "bluff" ? t("note_bluff") :
      (state.data.tasks[state.tab].description || "");
  }

  function renderTable() {
    var cols = COLUMNS[state.tab];
    var head = $("boardHead");
    head.innerHTML = "";
    cols.forEach(function (c) {
      var th = document.createElement("th");
      th.textContent = t(c.label);
      if (c.sort) {
        th.classList.add("sortable");
        if (state.sortKey === c.key || (!state.sortKey && isDefaultSort(c.key))) {
          var s = document.createElement("span");
          s.className = "arrow";
          s.textContent = effDir(c.key) === 1 ? "▲" : "▼";
          th.appendChild(s);
        }
        th.addEventListener("click", function () {
          if (state.sortKey === c.key) state.sortDir *= -1;
          else { state.sortKey = c.key; state.sortDir = defaultDir(c.key); }
          renderTable();
        });
      }
      head.appendChild(th);
    });

    var rows = filtered();
    var body = $("boardBody");
    body.innerHTML = "";
    $("emptyState").hidden = rows.length > 0;
    rows.forEach(function (m, i) {
      var tr = document.createElement("tr");
      if (i < 3) tr.className = "r" + (i + 1);
      tr.setAttribute("tabindex", "0");
      tr.setAttribute("aria-label", m.display_name + " — " + t("click_model"));
      cols.forEach(function (c) { tr.appendChild(cell(m, c, i)); });
      function open() { openModal(m); }
      tr.addEventListener("click", open);
      tr.addEventListener("keydown", function (e) { if (e.key === "Enter") open(); });
      body.appendChild(tr);
    });
  }

  function defaultSortKey() {
    return { overall: "overall", milu: "score", indicqa: "f1", indicxnli: "score", bluff: "bluff" }[state.tab];
  }
  function isDefaultSort(key) { return key === defaultSortKey(); }
  function defaultDir(key) {
    if (key === "model" || key === "org" || key === "upd") return 1;
    if (state.tab === "bluff") return key === "bluff" || key === "abstain" || key === "traps" ? 1 : -1;
    return -1;
  }
  function effDir(key) {
    if (state.sortKey) return state.sortKey === key ? state.sortDir : 0;
    return isDefaultSort(key) ? tabDir(state.tab) : 0;
  }

  function cell(m, c, rank) {
    var td = document.createElement("td");
    var v = cellVal(m, c.key);
    switch (c.key) {
      case "rank":
        td.className = "rank";
        td.innerHTML = '<span class="rank-badge">' + (rank + 1) + "</span>";
        break;
      case "model":
        td.className = "model-cell";
        td.textContent = m.display_name;
        break;
      case "org":
        td.className = "org"; td.textContent = m.org; break;
      case "overall": case "milu": case "f1": case "em": case "xnli":
      case "score": case "bluff": case "abstain":
        td.innerHTML = '<span class="' + (c.strong ? "score-strong" : "") + '">' + fmt(v) + "</span>" +
          (c.bar && v !== null ? '<span class="mini-bar"><i style="width:' + Math.max(0, Math.min(100, v)) + '%"></i></span>' : "");
        break;
      case "ci": {
        var r = m.tasks[state.tab];
        td.innerHTML = '<span class="ci">' + fmt(r.ci_lo) + "–" + fmt(r.ci_hi) + "</span>";
        break;
      }
      case "emci": {
        var q = m.tasks.indicqa;
        td.innerHTML = '<span class="ci">' + fmt(q.em_ci_lo) + "–" + fmt(q.em_ci_hi) + "</span>";
        break;
      }
      case "traps": case "n": case "err":
        td.textContent = v === null || v === undefined ? "–" : v;
        break;
      case "upd":
        td.textContent = v; break;
    }
    return td;
  }

  /* ---------- charts ---------- */
  function renderCharts() {
    var grid = $("chartGrid");
    grid.innerHTML = "";
    var defs = [
      { key: "milu", get: function (m) { return m.tasks.milu && m.tasks.milu.score; }, suffix: "" },
      { key: "indicqa", get: function (m) { return m.tasks.indicqa && m.tasks.indicqa.f1; }, suffix: " F1" },
      { key: "indicxnli", get: function (m) { return m.tasks.indicxnli && m.tasks.indicxnli.score; }, suffix: "" },
      { key: "bluff", get: function (m) { return m.tasks.bluff && m.tasks.bluff.bluff_rate; }, suffix: "", asc: true }
    ];
    defs.forEach(function (d) {
      var rows = state.data.models
        .map(function (m) { return { name: m.display_name, v: d.get(m) }; })
        .filter(function (r) { return r.v !== null && r.v !== undefined; })
        .sort(function (a, b) { return d.asc ? a.v - b.v : b.v - a.v; });
      if (!rows.length) return;
      var card = document.createElement("div");
      card.className = "chart-card";
      var meta = state.data.tasks[d.key];
      card.innerHTML = "<h3>" + esc(meta.label) + esc(d.suffix) + ' <span class="ta-h" lang="ta">' + esc(meta.label_ta) + "</span></h3>" +
        '<p class="csub">' + esc(meta.description) + "</p>";
      card.appendChild(barChart(rows, d.asc));
      grid.appendChild(card);
    });
  }

  function barChart(rows, asc) {
    var W = 560, rowH = 26, labelW = 190, valW = 46, pad = 8;
    var max = Math.max.apply(null, rows.map(function (r) { return r.v; }));
    var H = rows.length * rowH + pad * 2;
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("role", "img");
    var bw = W - labelW - valW - pad * 2;
    var accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#b91c1c";
    var muted = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() || "#8a8b94";
    var ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#16161d";
    rows.forEach(function (r, i) {
      var y = pad + i * rowH;
      var w = max > 0 ? (r.v / max) * bw : 0;
      var label = document.createElementNS(NS, "text");
      label.setAttribute("x", labelW - 8); label.setAttribute("y", y + 17);
      label.setAttribute("text-anchor", "end"); label.setAttribute("font-size", "12.5");
      label.setAttribute("fill", ink);
      var nm = r.name.length > 26 ? r.name.slice(0, 25) + "…" : r.name;
      label.textContent = nm;
      svg.appendChild(label);
      var rect = document.createElementNS(NS, "rect");
      rect.setAttribute("x", labelW); rect.setAttribute("y", y + 5);
      rect.setAttribute("width", Math.max(2, w)); rect.setAttribute("height", 15);
      rect.setAttribute("rx", 4); rect.setAttribute("fill", accent);
      rect.setAttribute("opacity", asc ? String(1 - (i / rows.length) * 0.55) : String(0.45 + (1 - i / rows.length) * 0.55));
      svg.appendChild(rect);
      var val = document.createElementNS(NS, "text");
      val.setAttribute("x", labelW + w + 8); val.setAttribute("y", y + 17);
      val.setAttribute("font-size", "12.5"); val.setAttribute("fill", muted);
      val.setAttribute("font-variant-numeric", "tabular-nums");
      val.textContent = fmt(r.v);
      svg.appendChild(val);
    });
    return svg;
  }

  /* ---------- modal ---------- */
  function openModal(m) {
    var body = $("modalBody");
    var html = '<h2 id="modalTitle">' + esc(m.display_name) + "</h2>" +
      '<p class="m-org">' + esc(m.org) + " · " + esc(m.id) + "</p>";
    if (m.overall !== null) {
      html += '<div class="m-overall"><span class="big">' + fmt(m.overall) + '</span>' +
        '<span class="lbl">' + esc(t("m_overall")) + " · mean of MILU / IndicQA F1 / XNLI</span></div>";
    }
    var order = ["milu", "indicqa", "indicxnli", "bluff"];
    var names = { milu: "MILU", indicqa: "IndicQA", indicxnli: "IndicXNLI", bluff: t("tab_bluff") };
    // best / worst task by rank
    var ranks = [];
    order.forEach(function (k) {
      if (!m.tasks[k]) return;
      var val = k === "indicqa" ? m.tasks[k].f1 : (m.tasks[k].score !== undefined ? m.tasks[k].score : m.tasks[k].bluff_rate);
      var all = state.data.models.map(function (x) {
        return k === "indicqa" ? (x.tasks[k] && x.tasks[k].f1) :
          x.tasks[k] && (x.tasks[k].score !== undefined ? x.tasks[k].score : x.tasks[k].bluff_rate);
      }).filter(function (v) { return v !== null && v !== undefined; });
      var sorted = all.slice().sort(function (a, b) { return k === "bluff" ? a - b : b - a; });
      ranks.push({ k: k, rank: sorted.indexOf(val) + 1, of: sorted.length });
    });
    order.forEach(function (k) {
      var r = m.tasks[k];
      if (!r) return;
      html += '<div class="m-task"><h4><span>' + esc(names[k]) + '</span>';
      if (k === "indicqa") html += '<span class="v">F1 ' + fmt(r.f1) + " · EM " + fmt(r.em) + "</span>";
      else if (k === "bluff") html += '<span class="v">' + fmt(r.bluff_rate) + "%</span>";
      else html += '<span class="v">' + fmt(r.score) + "</span>";
      html += "</h4>";
      if (k !== "bluff") {
        var s = k === "indicqa" ? r.f1 : r.score;
        var lo = k === "indicqa" ? null : r.ci_lo, hi = k === "indicqa" ? null : r.ci_hi;
        html += '<div class="m-bar"><span class="fill" style="width:' + s + '%"></span>';
        if (lo !== null) html += '<span class="whisk" style="left:' + lo + '%;width:' + Math.max(0, hi - lo) + '%"></span>';
        html += "</div>";
      } else {
        html += '<div class="m-bar"><span class="fill" style="width:' + r.bluff_rate + '%"></span></div>';
        html += '<p class="m-meta"><span>' + esc(t("m_bluff_note")) + "</span></p>";
      }
      var meta = [];
      if (r.n) meta.push(r.n + " " + t("m_n"));
      if (r.errors !== undefined) meta.push(r.errors + " " + t("m_err"));
      if (r.date) meta.push(t("m_date") + " " + r.date);
      if (k === "bluff") meta.push(r.n_traps + " " + t("col_traps").toLowerCase());
      if (k === "indicqa") meta.push("EM 95% CI " + fmt(r.em_ci_lo) + "–" + fmt(r.em_ci_hi));
      html += '<p class="m-meta">' + meta.map(esc).join(" · ") + "</p></div>";
    });
    if (ranks.length > 1) {
      var byRank = ranks.slice().sort(function (a, b) { return a.rank - b.rank; });
      var best = byRank[0], worst = byRank[byRank.length - 1];
      html += '<p class="m-insight">' + esc(t("m_best")) + ": " + esc(names[best.k]) +
        " (#" + best.rank + " " + t("m_of") + " " + best.of + ") · " + esc(t("m_worst")) + ": " +
        esc(names[worst.k]) + " (#" + worst.rank + " " + t("m_of") + " " + worst.of + ")</p>";
    }
    html += '<div class="m-links"><span>' + esc(t("m_sheet")) + ": </span>";
    ["milu", "indicqa", "indicxnli"].forEach(function (k) {
      var u = sheetUrl(k, m);
      if (u) html += '<a href="' + u + '" target="_blank" rel="noopener">' + esc(names[k]) + " JSONL</a>";
    });
    html += "</div>";
    body.innerHTML = html;
    $("modalBackdrop").hidden = false;
    document.body.style.overflow = "hidden";
    $("modalClose").focus();
  }
  function closeModal() {
    $("modalBackdrop").hidden = true;
    document.body.style.overflow = "";
  }

  /* ---------- stats ---------- */
  function renderStats() {
    var d = state.data;
    $("statModels").textContent = d.models.length;
    $("statQuestions").textContent = Object.keys(d.tasks).reduce(function (a, k) { return a + d.tasks[k].n_target; }, 0);
    $("statTasks").textContent = Object.keys(d.tasks).length;
    $("statUpdated").textContent = d.meta.generated_at;
  }

  function render() {
    renderTabs();
    renderTable();
    renderCharts();
  }

  /* ---------- init ---------- */
  function init() {
    // theme
    var theme = localStorage.getItem("tb-theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);
    $("themeToggle").addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var nxt = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nxt);
      localStorage.setItem("tb-theme", nxt);
      renderCharts(); // re-read CSS vars for svg colors
    });
    // language
    applyI18n();
    $("langToggle").addEventListener("click", function () {
      state.lang = state.lang === "en" ? "ta" : "en";
      localStorage.setItem("tb-lang", state.lang);
      applyI18n();
      render();
    });
    // search
    var deb;
    $("search").addEventListener("input", function (e) {
      clearTimeout(deb);
      deb = setTimeout(function () { state.query = e.target.value; renderTable(); }, 150);
    });
    // modal
    $("modalClose").addEventListener("click", closeModal);
    $("modalBackdrop").addEventListener("click", function (e) { if (e.target === this) closeModal(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("modalBackdrop").hidden) closeModal(); });
    // copy buttons
    document.querySelectorAll(".copy").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var txt = $(btn.getAttribute("data-copy")).innerText;
        function done() {
          var orig = btn.textContent;
          btn.textContent = t("copied") + " ✓";
          setTimeout(function () { btn.textContent = orig; }, 1400);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, done);
        else {
          var ta = document.createElement("textarea");
          ta.value = txt; document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); } catch (e) {}
          document.body.removeChild(ta); done();
        }
      });
    });
    // data
    state.sortDir = tabDir(state.tab);
    fetch("data/scores.json")
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
      .then(function (d) { state.data = d; renderStats(); render(); })
      .catch(function () {
        $("boardBody").innerHTML = '<tr><td colspan="9" class="empty">' + esc(t("load_err")) + "</td></tr>";
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
