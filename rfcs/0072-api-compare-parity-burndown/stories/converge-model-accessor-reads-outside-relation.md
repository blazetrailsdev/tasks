---
title: "Converge model-accessor reads outside the relation family (7 wide-ratchet entries)"
status: draft
updated: 2026-07-25
rfc: "0072-api-compare-parity-burndown"
cluster: api-compare-tooling
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5315 fixed two cases where a ported TS body reaches past Rails' `model`
accessor to the `_modelClass` field, so the body omits a call Rails makes:
`Relation#isAlreadyInScope` (`relation.rb:1337-1339`) and
`Relation#isGlobalScope` (`relation.rb:1341-1343`). The second was found by
review, and converging it made a **seeded RFC 0047 wide-ratchet baseline entry
go stale** — i.e. it was pre-existing tracked debt, filed under the generic
reason "bucket (b) equivalent or (c) noise pending per-cluster burndown
review", which had never been triaged.

Auditing the whole baseline for that same shape found **85 entries with
`"call": "model"` across 14 TS files**. The relation family (78 entries) is
covered by [[converge-relation-model-accessor-reads]]. This story covers the
remaining **7 entries in 6 files outside `relation*`**:

- `associations/collection-association.ts` — `find`
- `base.ts` — `all`
- `connection-adapters/abstract-mysql-adapter.ts` — `build_insert_sql`
- `connection-adapters/postgresql-adapter.ts` — `build_insert_sql`
- `encryption/extended-deterministic-queries.ts` — `process_arguments`
- `insert-all.ts` — `keys_including_timestamps`, `timestamps_for_create`

Reproduce the inventory by walking every JSON under
`scripts/api-compare/call-mismatches-wide-exclude/` and collecting entries
where `call === "model"`, grouped by `tsFile`.

**Not every entry is necessarily an infidelity.** The `model` reader in Rails
resolves differently per host — `Relation#model`, `InsertAll#model`,
`CollectionAssociation` reaching through `@reflection`, etc. — and some TS
hosts may legitimately have no accessor to route through, or may mirror a
Rails body that reads `@model`/`klass` directly. Each entry must be checked
against its Rails body; where the accessor exists and Rails goes through it,
route the TS call through it too, then drop the now-stale baseline entry.

Where an entry is genuinely equivalent-but-different, **replace the generic
RFC 0047 seed reason with a specific per-entry verified reason** so the next
audit does not re-derive the same conclusion (there is precedent for this
format in `connection-adapters/postgresql/database-statements.json`:
"Per-entry verified (RFC 0032 wide-entry verification): …").

Where the accessor exists, the rewrite is value-identical (e.g. trails'
`Relation#model` is `relation.ts:6242`, `return this._modelClass`), so these
are behavior-preserving.

## Acceptance criteria

- Each of the 7 entries above is checked against its Rails counterpart body.
- Entries whose Rails body reads the `model` accessor, and whose TS host has an
  equivalent accessor, are routed through it and their baseline entries removed
  (the wide baseline only ever shrinks).
- Entries that are genuinely equivalent keep their exclusion but get a specific
  per-entry verified reason replacing the generic RFC 0047 seed text.
- `pnpm exec tsx scripts/api-compare/lint-call-mismatches-wide.ts` green with no
  STALE entries and no baseline growth.
- Remove stale entries by hand rather than committing a full `--write` reseed:
  `--write` re-serializes unrelated files' `—` escapes into literal
  em-dashes, producing churn outside the story's scope.
- Behavior-preserving; no test changes expected.
