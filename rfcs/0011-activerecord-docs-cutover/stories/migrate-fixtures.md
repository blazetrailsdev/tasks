---
title: "RFC from 3 fixtures docs"
status: done
rfc: "0011-activerecord-docs-cutover"
cluster: migrate
deps: ["reconcile-existing-rfcs"]
deps-rfc: []
est-loc: 200
pr: 6
claim: null
assignee: null
blocked-by: null
---

## Context

The fixtures-adoption effort spans three docs: `defineschema-to-fixtures-
migration.md`, `fixtures-adoption-inventory.md`, and `fixtures-migration-
backlog.md`. Consolidate the actionable backlog into one RFC. See RFC 0011
§Phase 2.

## Acceptance criteria

- [ ] New RFC authored from the three docs via the placeholder → PR flow.
- [ ] The migration inventory / backlog → dep-aware stories; the
      excluded-file rationale (blocked migrations) preserved in §Deferred.
- [ ] Memory facts on resolved/blocked fixture migrations cross-checked so
      already-migrated files aren't re-storied.
- [ ] All three docs queued for deletion in `decommission-docs`.

## Notes

Many fixture migrations are recorded done/blocked in the memory index (HABTM,
callbacks, length-validation, query-logs, etc.) — reconcile against those.

## Result (2026-06-04)

RFC authored as `draft-fixtures-adoption` in its RFC PR, scoped (per decision) to
the **tracked** `fixtures-adoption-inventory.md` only. Reality check at
`origin/main`: the other two "docs" (`defineschema-to-fixtures-migration.md`,
`fixtures-migration-backlog.md`) are **untracked local scratch** — never
committed to `origin/main` — so they are out of scope (noted in the new RFC's
§Alternatives; if the perf angle is promoted it gets its own RFC).

The tracked inventory's bottom line is **defer the sweep**: only ~5 unconverted
Tier-1 files; 146 bespoke (Tier-3) + 342 no-DB (Tier-4) can't be served by a
canonical loader. The RFC captures that as one low-priority opportunistic story

- explicit non-goals. **Decommission caveat surfaced:** the inventory doc is
  script-generated into `docs/`, so deleting it fights regeneration — the RFC
  §Open-questions flags retargeting the script output or allowlisting. Only
  `fixtures-adoption-inventory.md` is queued for deletion (the other two aren't in
  the repo). Flips to `done` when that PR merges.
