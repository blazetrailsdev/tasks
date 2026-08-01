---
title: "codegen-async-cross-file-propagation"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
pr: 5814
claim: "2026-08-01T18:51:00Z"
assignee: "codegen-async-cross-file-propagation"
blocked-by: null
closed-reason: null
---

## Context

RFC 0065 roadmap item 2, unbuilt. `scripts/prism-codegen/async-source.ts`
resolves the async method-name set from the ONE port file matching the Rails
file (`asyncMethodsForRailsFile`, plus the `relation.ts` supplement), so the
spike doc's Honest limits #3 records the two residual holes: (a) files with no
port yet fall back to sync, and (b) `await` placement is file-local, so a call
to an async method defined in a different file is never awaited. Hole (b) is
now the more expensive one, because PR #5727's global port index proved 27 defs
resolve in a different port file than their Rails twin — the same cross-file
population whose calls go un-awaited. Build a whole-program async manifest over
`packages/activerecord/src` (the same index shape the scorer's global fallback
uses) and drive `await` insertion from it, keeping the receiver-blind await
rule safe by requiring an unambiguous global hit, exactly as the scorer does.

## Acceptance criteria

- A whole-program async manifest replaces the per-file async name set; calls
  into async methods defined in other port files are awaited.
- Ambiguous global names (same method name in multiple port files) do not
  trigger an await; the existing intersect-with-Rails-defs guard is preserved
  so unrelated same-named calls are not swept in.
- `pnpm codegen:score` matched count does not regress; tests cover a
  cross-file async call and an ambiguous-name decline.
