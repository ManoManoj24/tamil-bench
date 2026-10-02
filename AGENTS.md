# AGENTS.md

Guidance for AI coding agents (and humans using them) working in this repo.

## What this repo is

**tamil-bench** — a zero-setup, API-only evaluation runner for LLMs on Tamil language tasks, plus the bilingual (English + Tamil) scoreboard site it publishes. It exists because lm-eval MCQ tasks need logprobs (chat APIs don't return them) and SEA-HELM's harness needs vLLM/GPU; this bench needs nothing but an OpenAI-compatible chat endpoint (OpenRouter by default).

- Live site (this fork): https://tamil-bench-manomanoj24.vercel.app/ — data-driven SPA
  (`index.html` + `styles.css` + `app.js`, reads `data/scores.json`). Upstream:
  https://logicinczo.github.io/tamil-bench/ (GitHub Pages).
- Remote: https://github.com/ManoManoj24/tamil-bench.git (fork of LogicIncZo/tamil-bench)

## Contributing

Ways in, from least to most involved: fund API runs (UPI at `logic@ybl`), request a run for a model, improve the runner, or add a whole new task. `CONTRIBUTING.md`
holds the technical bar a new task has to clear. (The old `contribute.html` / `sponsor.html` pages were removed in the SPA rebuild; funding is via UPI directly.)

## Layout

| Path | What it is |
| --- | --- |
| `bench.py` | The runner. Three subcommands: `indicqa`, `milu`, `xnli`. Writes one JSONL sheet per run into `results/`. |
| `build_site.py` | The single refresh command: rescans `results/`, recomputes scores, rewrites `results/summary.json`, emits `data/scores.json` (the SPA data source), then commits/pushes (unless `--no-push`). |
| `bluff.py` | Zero-API analysis of existing IndicQA sheets: bluff rate on unanswerable traps + over-refusal rate on answerable questions. `--json` writes `results/bluff-summary.json`. |
| `index.html` + `styles.css` + `app.js` | The scoreboard SPA. Data-driven: fetches `data/scores.json`, renders leaderboard, charts, model report cards. No build step; deploys as static files. Bilingual EN/TA chrome via `data-i18n` keys in `app.js`. |
| `results/` | Per-question answer sheets (JSONL), one per (task, model, n). Self-contained evidence — model output + gold labels — so every published score can be re-verified without the raw datasets. |
| `data/` | Datasets, **not committed** (gitignored; MILU is gated on HF) — except `data/scores.json`, which `build_site.py` generates and which IS committed (`.gitignore` exception). See `data/README.md` for how to obtain datasets. |
| `assets/` | OG card + UPI QR. `chart-scores.png` is no longer generated (charts are SVG, rendered client-side). |
| `wire_papers.py` | One-off historical migration script (wired the XNLI/bluff sections into index.html). Do **not** re-run; kept for provenance. |
| `run_*.sh`, `xnli_sweep.sh`, `finisher.sh` | Cohort runners; resumable — they skip models that already have result sheets. |
| `*.log` | Scratch run logs (gitignored). Safe to leave behind. |

## Environment

- Python 3.12. Deps: `pandas`, `requests`, `matplotlib`, plus a parquet engine (`pyarrow`) for `pd.read_parquet`.
- Env vars: `OPENROUTER_API_KEY` (required by `bench.py`), `HF_TOKEN` (only for the MILU gated download).
- No package manifest, no linter/test suite config — plain scripts run from the repo root.

## Common commands

```bash
# Smoke-test a model on one task first (n5 sheets exist; the site build ignores them)
python3 bench.py indicqa --model z-ai/glm-5.3-flash --n 5

# Real runs (full suite per model = MILU n199 + IndicQA n100 + XNLI n200, seed 42)
python3 bench.py milu    --model deepseek/deepseek-v4.1-flash --n 199
python3 bench.py indicqa --model deepseek/deepseek-v4.1-flash --n 100
python3 bench.py xnli    --model deepseek/deepseek-v4.1-flash --n 200

# Analysis of existing sheets (no API cost)
python3 bluff.py            # print table
python3 bluff.py --json     # also write results/bluff-summary.json

# Site refresh. Use --no-push for a dry run; without it this COMMITS AND PUSHES
python3 build_site.py --no-push
```

## Invariants — do not break these

1. **Results files are append-only evidence.** Never hand-edit or delete rows in `results/*.jsonl` to fix a score. Re-run the sheet, or fix the analyzer.
2. **The naming convention is load-bearing.** `build_site.py` parses stems as `{task}_{org}_{model-slug}_n{N}.jsonl` (`/` in the model id becomes `_`). A sheet whose name does not match is silently ignored by the site build.
3. **Error accounting:** `bench.py` scores over all rows (API errors score 0, in-denominator); `build_site.py` recomputes over valid rows only and reports `n_errors` alongside, so failures are visible but never masquerade as 0% accuracy. XNLI accuracy is over valid responses only. Keep all three behaviors consistent if you touch scoring math.
4. **Sampling is seed 42** (`SEED` in `bench.py`; `df.sample(frac=1, random_state=SEED)`). Never sample differently — cross-model comparability depends on it.
5. **Small sheets stay out of the leaderboard.** `FULL_MIN` in `build_site.py` (`milu` 150, `indicqa` 90, `xnli` 150) gates which sheets count. If you add a task or change target n, update `FULL_MIN` accordingly.
6. **New models must be added to `MODELS` in `build_site.py`** (display name) or the site build will KeyError. The chart code also uses a `SHORT` name map.
7. **Charts are English-only on purpose** — matplotlib cannot shape Tamil script (no HarfBuzz). Tamil stays in `index.html`, where browsers shape it correctly. Don't "fix" Tamil into the charts.
8. **Site edits:** the SPA renders from `data/scores.json` — never hand-edit scores into `index.html`/`app.js`. Bilingual chrome: English strings live in `index.html` `data-i18n` attributes with Tamil twins in `app.js` `I18N.ta`; change both together. SVG charts are browser-rendered, so Tamil labels are fine there (unlike the old matplotlib charts).
9. **Dataset files stay out of git** (`data/*.json`, `data/*.parquet` are gitignored) — except `data/scores.json`, which is the committed site-data artifact. MILU is gated on HF — obtain it through the gate, don't commit a copy or mirror it.
10. **`build_site.py` pushes by default.** Running it bare is a publish action (commit + push → live GitHub Pages site). Use `--no-push` to preview.

## Cost & rate-limit discipline

- OpenRouter free tier is ~1000 requests/day key-wide; one full suite is ~499 requests. Cohort runners are idempotent/resumable — safe to re-invoke after a quota reset; they skip finished sheets.
- Always smoke-test with `--n 5` before a paid or long run. Chat calls use temperature 0, retries with exponential backoff; per-run logs land in `*.log` files.

## Gotchas

- `bench.py`'s XNLI "file missing" message mentions `data/ta/test-00000-of-00001.parquet`, but the path the code actually loads is `data/indicxnli_ta_test.parquet` (which is what exists in the repo). Trust the code path.
- The MILU dev split is not available via the parquet API, so few-shot (`--shots`) only works if `data/milu_ta_dev.parquet` exists locally; runs are 0-shot otherwise.
- IndicQA sheets include the unanswerable traps (empty golds). `bench.py` scores only answerable questions; `bluff.py` and `build_site.py` use the traps for the bluff metric. Empty-gold rows are intentional.
- `__pycache__/` is gitignored build cruft; ignore it.

## Before you finish a change

- Touched scoring/aggregation? Re-run `python3 build_site.py --no-push` and confirm `results/summary.json` plus the printed model counts match expectations, and that `python3 bluff.py` still runs.
- Touched the site? Re-run `python3 build_site.py --no-push`, confirm `data/scores.json` is valid, and smoke-test the render path (see `app.js` — table, tabs, charts, modal). Every edited UI string needs both `data-i18n` English and `I18N.ta` Tamil variants.
- Publishing? Then (and only then) run `python3 build_site.py` without `--no-push`, or commit/push manually.
