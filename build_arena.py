#!/usr/bin/env python3
"""tamil-bench arena data: pick high-disagreement IndicQA questions for blind battles.

Reads full IndicQA sheets in results/, scores each question by how split the
models were (some right, some wrong), and emits data/arena.json with the real
recorded predictions. No re-runs, no API cost — pure presentation layer over
existing evidence.

Usage: python3 build_arena.py [--n 24]
"""
import json
import re
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).parent
RESULTS = ROOT / "results"
OUT = ROOT / "data" / "arena.json"

N_BATTLES = int(sys.argv[sys.argv.index("--n") + 1]) if "--n" in sys.argv else 24


def parse_stem(stem):
    m = re.match(r"indicqa_(.+)_n(\d+)$", stem)
    if not m:
        return None
    ident, n = m.group(1), int(m.group(2))
    org, model = ident.split("_", 1)
    return f"{org}/{model}", n


def tamil_ratio(s):
    ta = sum(1 for c in s if "\u0b80" <= c <= "\u0bff")
    return ta / max(len(s), 1)


JUNK = ("we need", "reading comprehension", "```", "json", "as an ai", "as an ai,")


def clean_pred(pr):
    pr = (pr or "").strip()
    if len(pr) < 3:
        return ""
    low = pr.lower()
    if any(j in low for j in JUNK):
        return ""
    # unbalanced truncation artifacts
    if pr.count('"') % 2 == 1 and len(pr) > 80:
        return ""
    if tamil_ratio(pr) < 0.25 and len(pr) > 40:
        return ""
    return pr


def main():
    # qid -> {question, context, golds, preds: {model: (prediction, em)}}
    questions = {}
    for f in sorted(RESULTS.glob("indicqa_*.jsonl")):
        p = parse_stem(f.stem)
        if not p:
            continue
        model, n = p
        if n < 90:  # full sheets only
            continue
        for line in f.open():
            line = line.strip()
            if not line:
                continue
            r = json.loads(line)
            qid = r["id"]
            q = questions.setdefault(qid, {
                "question": r["question"],
                "context": r.get("context") or "",
                "golds": r.get("golds") or [],
                "preds": {},
            })
            q["preds"][model] = (clean_pred(r.get("prediction")), r.get("em", 0))

    battles = []
    for qid, q in questions.items():
        preds = {m: pr for m, (pr, em) in q["preds"].items() if pr}
        if len(preds) < 6:
            continue
        ems = [em for m, (pr, em) in q["preds"].items() if m in preds]
        frac_right = sum(1 for e in ems if e >= 0.5) / len(ems)
        # split decisions are the interesting battles: 15%-85% got it right
        if not (0.10 <= frac_right <= 0.90):
            continue
        uniq_texts = len({pr.strip() for pr in preds.values()})
        avg_len = sum(len(pr) for pr in preds.values()) / len(preds)
        # disagreement score: split-ness x textual diversity, prefer meatier answers
        score = (1 - abs(frac_right - 0.5) * 2) * (uniq_texts / len(preds)) * min(avg_len / 60, 1.5)
        battles.append((score, qid, q))

    battles.sort(reverse=True, key=lambda b: b[0])
    picked = []
    for score, qid, q in battles[:N_BATTLES]:
        picked.append({
            "qid": qid,
            "question": q["question"],
            "context": q["context"][:400],
            "golds": q["golds"],
            "answers": {m: pr for m, pr in
                        sorted({m: pr for m, (pr, em) in q["preds"].items() if pr.strip()}.items())},
        })

    OUT.write_text(json.dumps({
        "generated_at": str(date.today()),
        "n_battles": len(picked),
        "note": "Real recorded predictions from results/indicqa_*_n100.jsonl. Names hidden until you vote.",
        "battles": picked,
    }, ensure_ascii=False, indent=2) + "\n")
    print(f"wrote {OUT} with {len(picked)} battles")


if __name__ == "__main__":
    main()
