---
title: "Move changes-job gate prose out of the size-limited inline run: script"
status: ready
updated: 2026-07-28
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The `changes` job's `- id: filter` step in `.github/workflows/ci.yml` is one
inline `run:` script holding every `*_PKGS_RE` / `INFRA_RE` gate plus years of
accreted prose comments. It sits just under a hard GitHub Actions size limit:
main measured 20,695 B, and the empirical startup-failure bracket is between
20,695 B and 20,919 B. Crossing it fails the WHOLE workflow at startup — zero
jobs, no checks reported, and no `pull_request` run created at all.

PR #5530 bought roughly 280 B of headroom (20,695 → 20,412) by folding the
hand-rolled `comparison_files` block into `set_gate`'s new exclusion argument
and dropping the comments it would otherwise have added. That is a reprieve,
not a fix: the next gate change reintroduces the same cliff, and comments cost
exactly as much as code here.

Measure with:

```bash
python3 -c "import yaml;d=yaml.safe_load(open('.github/workflows/ci.yml'));\
print(len([s for s in d['jobs']['changes']['steps'] if s.get('id')=='filter'][0]['run']))"
```

## Acceptance criteria

- The gate prose moves out of the inline `run:` script — either to a checked-in
  shell script the step invokes, or to `scripts/ci-suite-coverage.test.ts`
  (which already documents gates and executes the lifted gate block in bash).
- Gate behaviour is unchanged: `scripts/ci-suite-coverage.test.ts`'s bash gate
  runner still traces the same outcomes for the same probe paths.
- The filter step's rendered `run:` size drops well clear of the ceiling, with
  the measured before/after recorded in the PR body.
