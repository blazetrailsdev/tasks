---
title: "ar console / runner: error on empty config for env"
status: ready
rfc: "0003-activerecord-cli"
cluster: cli
deps: ["cli-package-scaffold"]
deps-rfc: []
est-loc: 30
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Post-merge finding from the ar-cli series (#2736). Neither `ar console` nor
`ar runner` errors when `configsFor()` returns an empty array for the requested
environment, whereas the `db:*` commands do. Add the same guard for Rails
fidelity.

## Acceptance criteria

- [ ] `ar console` errors with a clear message when no config resolves for the
      environment (mirroring the `db:*` guard).
- [ ] `ar runner` gets the same guard.
- [ ] `console.ts` / `runner.ts` covered by a test.

## Notes

Migrated from `activerecord-gaps.md` (ar-cli follow-ups) during the RFC 0011
cutover.
