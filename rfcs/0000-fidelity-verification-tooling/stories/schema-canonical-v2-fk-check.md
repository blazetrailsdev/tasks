---
title: "parity:schema canonical v2 — foreign keys + check constraints"
status: draft
updated: 2026-06-12
rfc: "0000-fidelity-verification-tooling"
cluster: parity
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Schema-parity canonical format v1 deliberately deferred foreign keys and
check constraints (`trails/docs/activerecord/parity-verification.md`,
"Deferred from v1"). The 68 `BLOCKED: schema` test skips need exactly that
oracle. Per locked decision **D9**, a version bump is ONE PR touching: the
JSON Schema, both canonicalizers (ruby + node), and every fixture baseline.

The moving parts (all under trails `scripts/parity/`):

- `canonical/schema.schema.json` — the JSON Schema (`pnpm parity:validate`
  compiles it via ajv).
- `schema/ruby/` — Rails-side canonicalizer (introspects a fresh SQLite DB
  via ActiveRecord, emits canonical JSON).
- `schema/node/` — trails-side canonicalizer (better-sqlite3 + trails
  introspection).
- `fixtures/*/` — shared `schema.sql` inputs, each with a sidecar
  `expected.json` sanity manifest (D6) and committed canonical baselines.
- `schema/diff.ts` — runs all fixtures, per-fixture pass/fail, exit 1 at end
  (D7).

v2 additions to `CanonicalTable`:

```ts
foreignKeys: Array<{
  // sorted by name ASC (D1 sorts indexes; mirror it)
  name: string; // constraint name; SQLite's implicit FKs get null
  column: string[]; // referencing columns, declaration order
  toTable: string;
  primaryKey: string[]; // referenced columns
  onDelete: "cascade" | "restrict" | "nullify" | null;
  onUpdate: "cascade" | "restrict" | "nullify" | null;
}>;
checkConstraints: Array<{
  // sorted by name ASC
  name: string | null; // SQLite unnamed checks → null
  expression: string; // whitespace-collapsed, single-space normalized
}>;
```

`version` bumps `1` → `2` in the schema, both canonicalizers, and all
baselines. Rails-side introspection: `connection.foreign_keys(table)` /
`connection.check_constraints(table)`; trails-side: the same ported methods
(verify they exist on the sqlite3 adapter first — `api:compare` says the
surface is ported; if introspection returns stubs, STOP and file the gap as a
story instead of papering over it, per ship-behavior-not-signatures).
Normalization decisions to lock in code comments: expression compared after
collapsing whitespace and stripping the outer parens SQLite adds; FK actions
lowercased; `NO ACTION` → null.

Fixtures: add at least 2 new fixture dirs (copy the layout of an existing
`ar-*` fixture): one with named + ON DELETE CASCADE FKs and a composite FK,
one with named and unnamed CHECK constraints. Update every existing fixture's
committed canonical JSON to v2 (empty arrays where absent) and their
`expected.json` if it gains counts.

## Acceptance criteria

- [ ] `pnpm parity:validate` passes with the v2 JSON Schema; any v1-shaped
      document now fails validation (version is pinned `const: 2`).
- [ ] `pnpm parity:schema` passes end-to-end locally (both toolchains; use
      `--side=rails|trails|diff` per D8 while iterating) including the 2 new
      fixtures.
- [ ] Single PR touches schema + both canonicalizers + all baselines (D9);
      nothing else.
- [ ] Sanity manifests (D6) extended so a canonicalizer silently dropping all
      FKs fails the fixture (add `foreignKeyCount` to `expected.json` and
      assert it in both canonicalizers).
- [ ] PR description notes which (if any) trails introspection gaps were
      found and the stories filed for them.

## Notes

Snapshot/parity-fixture churn is excluded from the 500-LOC ceiling per
CLAUDE.md ("generated parity fixtures"); the hand-written code here is well
under it. CI runs these as label-gated jobs — apply the parity label so the
PR actually exercises them.
