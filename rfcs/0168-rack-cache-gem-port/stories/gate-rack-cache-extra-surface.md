---
title: "Enroll rack-cache in the extra-surface gate"
status: claimed
updated: 2026-11-22
rfc: "0168-rack-cache-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: "2026-11-22T03:35:34Z"
assignee: "gate-rack-cache-extra-surface"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:changed` on a rack-cache change reds its extra-ratchet step with
"extra-surface gate: rack-cache is not a gated package"
(`scripts/api-compare/lint-extra-surface-ratchet.ts:100-101`, `GATED_PACKAGES`).
Seen on trails#10523, which ported the first rack-cache files. rack-cache has
no row in `scripts/api-compare/extra-surface-mark.json`, so its extra surface
is unmeasured.

## Acceptance criteria

- [ ] rack-cache is in `GATED_PACKAGES` with a mark in `extra-surface-mark.json` at its current novel/total.
- [ ] `pnpm parity:changed` on a rack-cache-only change passes extra-ratchet.
