# tamil-bench — Runnable Tamil LLM bench for API-only models

> **Fork note:** this is a usability fork of [LogicIncZo/tamil-bench](https://github.com/LogicIncZo/tamil-bench) (MIT), maintained by [ManoManoj24](https://github.com/ManoManoj24). All benchmark credit goes to Srikanth / CashlessConsumer — this fork only makes the runner easier to install, resume, and test.

Zero-setup generative eval runner for OpenAI-compatible chat endpoints (OpenRouter default). Built because lm-eval MCQ tasks need loglikelihood (chat APIs don't return it) and SEA-HELM's harness needs vLLM/GPU.

**Live scoreboard (this fork):** https://tamil-bench-manomanoj24.vercel.app/ — data-driven SPA (`index.html` + `app.js` reading `data/scores.json`). Upstream's original exam-paper site: https://logicinczo.github.io/tamil-bench/.

## Benchmarks

| Task | Dataset | Metric | Status |
| --- | --- | --- | --- |
| `milu` | ai4bharat/MILU, Tamil config (6,372 MCQs, India state-exam material) | accuracy (0-shot, letter parse; dev split not on parquet API) | open — gate accepted programmatically via `POST huggingface.co/datasets/ai4bharat/MILU/ask-access` (Bearer HF_TOKEN) |
| `indicqa` | ai4bharat/IndicQA Tamil (SQuAD-style, 1,804 questions) | EM + F1 (official SQuAD normalization) | open |
| `xnli` | AdaMLLab/indicxnli_repaired Tamil test split (3-way entailment) | accuracy (0-shot, A/B/C parse; 3-way chance = 33%) | open |

Individual sortable score tables are published at [`milu.html`](https://logicinczo.github.io/tamil-bench/milu.html), [`indicqa.html`](https://logicinczo.github.io/tamil-bench/indicqa.html), and [`indicxnli.html`](https://logicinczo.github.io/tamil-bench/indicxnli.html). Each shows the latest qualifying score per model, result-sheet date, valid sample count, errors, and confidence interval.

## Setup

```bash
git clone https://github.com/ManoManoj24/tamil-bench.git
cd tamil-bench
pip install -r requirements.txt
export OPENROUTER_API_KEY=sk-or-...   # get one at https://openrouter.ai/keys
```

MILU is gated on Hugging Face — accept the gate at
https://huggingface.co/datasets/ai4bharat/MILU, then:

```bash
export HF_TOKEN=hf_...   # bench.py downloads data/milu_ta_test.parquet for you
```

No key and just want to try the pipeline? Use `--dry-run` (no key, no
downloads — it synthesizes tiny local datasets):

```bash
python3 bench.py --dry-run all --model demo/x --n 5
python3 build_site.py --no-push
```

## Usage

```bash
python3 bench.py indicqa --model z-ai/glm-5.3-flash --n 100
python3 bench.py milu --model deepseek/deepseek-v4.1-flash --n 200   # after gate accept
python3 bench.py xnli --model google/gemini-3.8-flash --n 200
python3 bench.py all --model x-ai/grok-4.7 --n 200   # all three tasks, in sequence
python3 bench.py indicqa --model x-ai/grok-4.7 --n 5  # smoke-test before a full run
python3 bench.py --list-models                        # what can I run? (needs key)
```

- `--n` stratified sample size (seed 42, reproducible); omit for full dataset.
- `--workers` concurrency (default 8).
- `--dry-run` (before the subcommand) skips real API calls and synthesizes
  fake answers, so the whole run → results → site pipeline works with no key.
  Dry-run writes real files into `results/` — delete the `*_dryrun_*` sheets
  afterwards if you don't want them near real data.
- Uses `OPENROUTER_API_KEY` from env. Results: JSONL per question + summary in `results/`.
- **Resumable:** answers are appended to `results/<task>_<model>_n<N>.jsonl` as
  they arrive. Kill a run mid-way and re-run the same command — answered
  questions are skipped, the rest continue. A tqdm progress bar shows while it
  runs (falls back to print-every-N if tqdm isn't installed).

## Baseline (2026-09-11/12, OpenRouter, 0-shot, n≈200 stratified by domain)

| Model | MILU-Tamil acc | IndicQA-Tamil EM (n=100) | F1 |
| --- | --- | --- | --- |
| google/gemini-3.8-flash | **0.945** | 0.200 | **0.424** |
| openai/gpt-5.6-luna | 0.864 | 0.170 | 0.407 |
| deepseek/deepseek-v4.1-flash | 0.809 | 0.180 | 0.389 |
| z-ai/glm-5.3-flash | 0.799 | 0.190 | 0.368 |
| xiaomi/mimo-v2.5 | 0.759 | 0.200 | 0.401 |
| qwen/qwen3.8-flash | 0.688 | **0.220** | 0.381 |
| inclusionai/ling-3.0-flash-vl | 0.643 | 0.140 | 0.374 |
| google/gemma-4-26b-a4b-it | 0.583 | 0.190 | 0.369 |
| poolside/laguna-s-2.1 | 0.497 | 0.140 | 0.291 |
| nvidia/nemotron-3.5-lightning:free | 0.412 | 0.000 | 0.008 |

95% CIs and per-question records in `results/` (errors count as wrong, in-denominator). Nemotron 3.5 Lightning (free tier) completed 2026-09-12 07:15 IST after the daily-quota reset: MILU 0.412 (95% CI 0.346–0.481), IndicQA EM 0.000 / F1 0.008 — 0 API errors both runs. It answers with verbose reasoning dumps instead of the extracted span, so EM collapses to zero, while exam MCQ lands last of the ten models.

**Reading:** Gemini 3.8 Flash is the clear Tamil leader (+8pp MILU over Luna, non-overlapping CI vs everything). GLM/DeepSeek statistically tied. MiMo v2.5 is a strong mid-board model — 5th on MILU but 2nd-best F1 (0.401). Qwen 3.8 flash is weakest on exam MCQ but posts the best IndicQA EM. Nine of ten beat GPT-4o's ~74% cross-language MILU average (2024); Nemotron 3.5 Lightning (0.412) does not. Qwen flagship tier exists (`qwen/qwen3.8-max-0902`) — untested.

## IndicXNLI (2026-09-11, OpenRouter, 0-shot, n=200)

Natural-language-inference: given a Tamil premise and hypothesis, the model picks
whether the hypothesis is entailed (A), contradicts (B), or is neutral (C) —
3-way chance = 33%. Same 9-model cohort as the other papers.

| Model | IndicXNLI acc | valid n |
| --- | --- | --- |
| google/gemini-3.8-flash | **0.758** | 198/200 |
| z-ai/glm-5.3-flash | 0.715 | 200/200 |
| google/gemma-4-26b-a4b-it | 0.648 | 193/200 |
| qwen/qwen3.8-flash | 0.630 | 200/200 |
| deepseek/deepseek-v4.1-flash | 0.620 | 200/200 |
| openai/gpt-5.6-luna | 0.610 | 200/200 |
| xiaomi/mimo-v2.5 | 0.605 | 200/200 |
| inclusionai/ling-3.0-flash-vl | parked | 0/200 |
| nvidia/nemotron-3.5-lightning | parked | 0/200 |

As with MILU, Gemini 3.8 Flash leads. XNLI tests a different skill from IndicQA:
entailment logic in Tamil is separate from quoting a passage. Accuracy is
computed over valid responses only; failed API calls are excluded, not counted
as wrong. Ling and Nemotron returned no responses on XNLI day (OpenRouter
endpoint failures after retries — Ling had scored normally on MILU/IndicQA
earlier), so they are parked on this table rather than shown as 0%.

## Known gaps

- No Tamil in Global-MMLU (repo verified 2026-09-11 — no `ta` config).
- OpenAI IndQA: dataset never released (github.com/openai/indqa → 404); headroom signal only (GPT-5 best = 34.9%).
- SEA-HELM: cite the leaderboard (SEA-LION v4 tops Tamil at 68.47); don't run its harness on API models.

## Refresh pipeline

`python3 build_site.py [--no-push]` is the single repeatable refresh command:
it rescans `results/*.jsonl`, recomputes scores (identical math to `bench.py` —
errors count as wrong and stay in the denominator), rewrites
`results/summary.json`, and emits `data/scores.json` — one normalized record
per model (per-task score, 95% CI, valid n, errors, run date, source sheet
filename, plus an `overall` mean). The static site (`index.html` +
`styles.css` + `app.js`) is data-driven: it fetches `data/scores.json` and
renders the leaderboard, charts, and model report cards client-side — no HTML
patching, no build step. Then it commits/pushes unless `--no-push`.

`data/scores.json` is the one generated file committed to git (see the
`.gitignore` exception); raw datasets under `data/` stay ignored.

**Overall score:** mean of the model's three core task scores (MILU accuracy,
IndicQA F1, IndicXNLI accuracy), each 0–100, rounded to 1 decimal. A model
missing any core task gets no Overall and is listed as partial below the
ranked models. Bluff rate is excluded — lower is better there, so it can't
average with accuracy-style metrics. The formula is documented in
`data/scores.json` (`meta.methodology_note`) and on the site.

## Data sources & attribution

- **MILU** — AI4Bharat + IBM Research India, "MILU: A Multi-task Indic Language
  Understanding Benchmark" (arXiv:2411.02538), CC-BY-4.0, gated on HF
  (github.com/AI4Bharat/MILU). Tamil split: 6,372 MCQs from UPSC/state-PSC
  exams, 41 subjects, 8 domains (1,524 machine-translated, rest curated).
  This bench samples 199 questions stratified by subject (seed 42).
- **IndicQA** — AI4Bharat, "Towards Leaving No Indic Language Behind" (ACL 2023),
  CC-BY-SA-4.0 (github.com/AI4Bharat/IndicQA). Tamil: 1,804 questions
  (1,276 answerable) over 253 Wikipedia-derived articles; we use the
  answerable subset sample of 100 (seed 42), SQuAD-style EM/F1 scoring.
- **IndicXNLI** — AdaMLLab, "IndicXNLI: Evaluating Multilingual Inferences
  Robustness" (arXiv:2104.03284), the repaired Tamil test split
  (github.com/divyanshu99/indicxnli-repaired). 200-item shuffle sample
  (seed 42), 3-way label A/B/C; an unanswerable-format refusal scores 0.
- Charts are CC-BY-SA too — attribute "tamil-bench" and share freely.
