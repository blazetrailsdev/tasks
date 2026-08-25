---
title: "extra-surface: run the allowlist gate in CI so stale entries can't rot"
status: closed
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Done, verified 2026-08-17: every acceptance criterion is met. .github/workflows/ci.yml:1397 runs 'pnpm exec tsx scripts/api-compare/extra-surface.ts' in the Rails API/Test Comparison job, after the step that writes the manifests, and the step comment records deliberately passing no --exclude-glob ('an exclusion disarms the stale gate'). The report is unchanged, so the stats pipeline is unaffected. The 2026-08-17 run reports 149 tags, 149 matched, 0 unclassified. Note the allowlist itself (extra-surface-allow.json) was retired by RFC 0080 in favour of @noRailsEquivalent tags, which the gate now enforces instead. Duplicate coverage with wire-extra-surface-into-ci, which has been narrowed to the one piece neither story delivered: a per-package only-shrink NOVEL high-water mark."
---

## Context

> Re-homed from RFC 0072 (api-compare parity burndown), which was pruned to
> ActiveRecord-scoped work. This story changes `scripts/api-compare/` tooling,
> not a package, so it belongs with the fidelity-verification tooling.

PR #5317 added `scripts/api-compare/extra-surface-allow.json` plus stale- and
malformed-entry enforcement inside `extra-surface.ts` `main()` (exit 1 after
the report prints). But `parity:api:extra` is only a `package.json` script
(`package.json:26`) — no workflow in `.github/` invokes it, so the gate fires
only when someone runs it by hand. A stale entry (the extra converged, or the
TS method was deleted) can therefore sit in the allowlist indefinitely,
which is the same rot `lint-call-mismatches.ts` avoids by being wired into CI.

Wiring it requires the api-compare manifests (`output/rails-api.json`,
`output/ts-api.json`), so it has to ride whatever job already runs
`pnpm parity:api` rather than standing up its own vendor+extract pass.

## Acceptance criteria

- `pnpm parity:api:extra` (or a thin gate-only entry point) runs in the CI job that
  already produces the api-compare manifests, failing on stale/malformed
  allowlist entries.
- The report/JSON output still reaches the stats pipeline unchanged — the gate
  annotates, it must NOT suppress or reshape `parity:api:extra` output.
- `--exclude-glob` runs skip stale enforcement (existing behavior); the CI
  invocation must not pass `--exclude-glob`, or the gate is a no-op.

## Fidelity-first policy

Moving toward Rails fidelity is the stated goal of this (and every)
extra-surface story; the allow-set/allowlist is a **last resort**. Before
admitting or keeping any name in the allow-set, first make — or file as its own
story — the fidelity change that would make the entry unnecessary: converge the
TS surface onto the Rails name and Rails-layout file (relocate + rename),
delete the invention, or justify an `@internal` at the declaration site. Only
names that are faithful-but-unmappable (e.g. genuine Ruby file constants or
nested class names present in the matched Rails file) belong in the allow-set;
any other allowlisted entry must cite the filed fidelity story next to it.
