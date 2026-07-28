---
title: "schema:compare verifies TEST_SCHEMA, not the registry that lays the tables"
status: ready
updated: 2026-07-28
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

There are two hand transcriptions of
`vendor/rails/activerecord/test/schema/schema.rb` in the tree, and only one of
them is verified against it:

- `packages/activerecord/src/test-helpers/test-schema.ts` (`TEST_SCHEMA`, ~1889
  lines) — the declarative table/column map. `pnpm schema:compare`
  (`scripts/schema-compare/compare.ts:16`) reads **this** one and reports
  INVENTED / missing / option divergences against the vendored `schema.rb`.
- `packages/activerecord/src/support/canonical-schema.ts`
  (`buildCanonicalRegistry`, ~1800 lines of `create_table` block calls) — the
  transcription that **actually lays the tables** at boot, via
  `loadCanonicalSchema` / `support/load-schema-helper.ts`.

So the gate validates a map that no longer creates any table, while the code
that does create every table is unverified. A column added to the registry with
the wrong type, or a table added to the registry that `schema.rb` does not have,
passes `schema:compare` untouched. The two must be edited together by hand and
nothing enforces it.

`TEST_SCHEMA` is not dead — `eslint/require-canonical-rebuild.mjs` uses its keys
as the canonical-table name list, `scripts/fixtures-compare/compare.ts` reads it,
and several test files import it — so this is a convergence, not a deletion.

Surfaced while splitting `canonical-schema.ts` (PR #5522), which confirmed
`schema:compare` output is byte-identical across registry-side changes precisely
because the script never reads the registry.

## Acceptance criteria

- `schema:compare` verifies the transcription that lays the tables. Either the
  registry becomes the compared source, or a second comparison is added so a
  registry/`schema.rb` divergence fails the gate.
- If both sources remain, a check fails when `TEST_SCHEMA` and the canonical
  registry disagree on the set of tables, or on a table's columns/types — the
  hand-sync requirement must be enforced, not documented.
- Output that feeds the stats DB stays stable or its change is deliberate and
  noted (per RFC 0064: `schema:compare` / `fixtures:compare` output is a stats
  key).
- Scope excludes retiring `TEST_SCHEMA`; its `eslint` / `fixtures-compare` /
  test consumers stay working.
