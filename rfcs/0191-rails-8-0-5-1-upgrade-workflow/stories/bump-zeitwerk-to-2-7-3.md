---
title: "bump-zeitwerk-to-2-7-3"
status: draft
updated: 2026-11-22
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0191 § 1 "Dependent sources"; owner ruling 2026-11-22: dependent gems
stop at the Rails `v8.0.5.2` lock's version (dev-Gemfile-only gems included).
`vendor/rails/v8.0.5.2/Gemfile.lock` resolves zeitwerk at 2.7.3; the pin in
`vendor/sources.ts` is `v2.7.2`. Target tag `v2.7.3`, commit `77c971c0f602bd0e5961d22dc7541d863737dbcb`
(confirmed with `git ls-remote --tags`).

Dry run (`pnpm parity:bump:dry-run --source zeitwerk --ref v2.7.3`, report
`scripts/parity/bump-ledger/reports/zeitwerk-v2.7.2-v2.7.3.2026-11-22.json`): lib +367/-287; new gate rows: 4 call, 3 call-arg, 1 param (unpinned changed), 5 unattributed extra-surface (registry.ts registerLoader, unregisterAutoload, loaderFor, onUnload, registerAutoload).

Likely needs a ledger (registry.rb reshaped); the 5 extra-surface names converge with it.

## Acceptance criteria

- [ ] Retake zeitwerk's pin floor against `v2.7.2` before the flip.
- [ ] `vendor/sources.ts` / `sources.lock.json` pin zeitwerk at `v2.7.3` (`77c971c0f602bd0e5961d22dc7541d863737dbcb`).
- [ ] Every gate row the dry run predicts is converged in the flip PR or held by the ledger; `pnpm parity:changed` green.
