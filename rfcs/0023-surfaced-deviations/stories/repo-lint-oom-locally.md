---
title: "pnpm lint OOMs locally at node's default heap"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Local tooling papercut (eslint heap), no Rails-fidelity content."
---

## Context

`pnpm lint` (whole-repo eslint) dies locally with
`FATAL ERROR: Ineffective mark-compacts near heap limit — JavaScript heap out
of memory` after ~225s, at node's default ~4 GB old-space. Reproduced while
verifying #5526; the run reached ~4046 MB before aborting. Individual files
lint fine with `NODE_OPTIONS=--max-old-space-size=8192 npx eslint <files>`.

CI passes, so this is a local-developer papercut, not a correctness bug — but
it means agents cannot run the repo's own lint gate before pushing and fall
back to per-file eslint, which skips whole-program rules.

## Acceptance criteria

- [ ] `pnpm lint` completes locally on a normal dev machine — via a raised
      `--max-old-space-size` in the script, eslint caching/concurrency limits,
      or chunked invocation.
- [ ] Whichever fix is chosen keeps CI's lint coverage identical (no rules or
      files silently dropped).
