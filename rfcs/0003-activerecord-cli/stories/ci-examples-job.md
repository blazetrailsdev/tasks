---
title: "Optional — lightweight examples/ CI job"
status: done
rfc: "0003-activerecord-cli"
cluster: deferred
deps: []
deps-rfc: []
est-loc: 50
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`examples/` is classified as `docs_only` in `ci.yml` (deliberate, per repo owner
— examples should not run in CI most of the time). If signal on the
`twitter-clone` reference app is ever wanted, add a lightweight `examples/**`-gated
job, without the full package matrix.

See RFC 0003 §Post-merge follow-ups (optional/deferred).

## Acceptance criteria

- [ ] `examples/**`-gated CI job runs
      `pnpm -C examples/twitter-clone typecheck && smoke`
- [ ] Uses `install --frozen-lockfile`; does not trigger the full package matrix
- [ ] Examples still treated as `docs_only` for the default path

## Notes

Deferred (status `draft`) — only pursue if example breakage signal is wanted.
Gotcha to honor: examples must **inherit** workspace dep versions (omit
`@types/node` / `typescript` pins) — a divergent `@types/node ^22` pin once pulled
a second `@types/node` into the lockfile and broke `trails-tsc` across the matrix.
Source: #2638.
