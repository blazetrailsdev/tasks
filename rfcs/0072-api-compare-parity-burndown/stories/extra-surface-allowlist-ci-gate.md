---
title: "extra-surface: run the allowlist gate in CI so stale entries can't rot"
status: ready
updated: 2026-07-25
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5317 added `scripts/api-compare/extra-surface-allow.json` plus stale- and
malformed-entry enforcement inside `extra-surface.ts` `main()` (exit 1 after
the report prints). But `api:extra` is only a `package.json` script
(`package.json:26`) — no workflow in `.github/` invokes it, so the gate fires
only when someone runs it by hand. A stale entry (the extra converged, or the
TS method was deleted) can therefore sit in the allowlist indefinitely,
which is the same rot `lint-call-mismatches.ts` avoids by being wired into CI.

Wiring it requires the api-compare manifests (`output/rails-api.json`,
`output/ts-api.json`), so it has to ride whatever job already runs
`pnpm api:compare` rather than standing up its own vendor+extract pass.

## Acceptance criteria

- `pnpm api:extra` (or a thin gate-only entry point) runs in the CI job that
  already produces the api-compare manifests, failing on stale/malformed
  allowlist entries.
- The report/JSON output still reaches the stats pipeline unchanged — the gate
  annotates, it must NOT suppress or reshape `api:extra` output.
- `--exclude-glob` runs skip stale enforcement (existing behavior); the CI
  invocation must not pass `--exclude-glob`, or the gate is a no-op.
