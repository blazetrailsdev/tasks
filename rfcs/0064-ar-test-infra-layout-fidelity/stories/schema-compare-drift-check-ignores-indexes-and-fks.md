---
title: "compareTranscriptions ignores indexes, foreign keys, and table-level PK metadata"
status: done
updated: 2026-08-05
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
pr: 6114
claim: "2026-08-05T02:30:05Z"
assignee: "refresh-stale-eslint-exclude-baselines"
blocked-by: null
closed-reason: null
---

## Context

PR #5704 made `parity:schema` verify the canonical registry (the transcription
that actually lays the tables) and added `compareTranscriptions` in
`scripts/schema-compare/compare.ts`, which fails the gate when `TEST_SCHEMA` and
`buildCanonicalRegistry` disagree. Its scope is deliberately limited to column
shape — type plus `limit` / `precision` / `scale` / `null` / `default` — and the
comparator says so at the call site.

Left uncompared:

- **Indexes.** The registry collects them via `t.index(columns, opts)` on
  `TableBuilder` (`packages/activerecord/src/support/canonical-schema.ts`) and
  applies them through `emitTableIndexes`; `TEST_SCHEMA` carries an `IndexSpec[]`
  on the wrapped table form (`support/schema-types.ts`). Neither is read by the
  drift check, so an index added to one and not the other passes silently.
- **Foreign keys.** The registry declares `t.foreignKey(toTable, opts)`;
  `TEST_SCHEMA` spells the relationship as a per-column `references:` option.
  Structurally different, so a naive diff manufactures findings.
- **Table-level primary-key metadata.** `TableMeta` (`id: false`, `primaryKey`,
  `serialPk`, `arunit2`) has no `TEST_SCHEMA` counterpart at all.

The registry side of all three is reachable today: the replay probe in
`canonicalRegistrySchema` already discards `foreignKey` calls and `def.meta` is
in hand; `TableBuilder.indexes` is populated by the same replay.

The index/FK gap is the one with real drift risk — `schema.rb` gets index churn
on vendor bumps, and PR #5704's own `courses`/`colleges` sibling story
(`courses-professors-references-should-carry-indexes`, done) was exactly an
index divergence found by hand.

## Acceptance criteria

- `compareTranscriptions` (or a sibling check in the same script) fails the gate
  when the two transcriptions disagree on a table's index set — columns, `unique`,
  `where`, `name`, `order`, `length`, and the adapter gate.
- Foreign keys are compared through a normalisation that maps the registry's
  `t.foreignKey(toTable, { column })` and `TEST_SCHEMA`'s `references:` onto one
  shape, or the story records why they cannot be and leaves them out explicitly.
- Table-level PK metadata (`id: false`, `primaryKey`, `serialPk`) is either
  compared or documented as having no `TEST_SCHEMA` counterpart to compare against.
- Any divergence the new check finds is fixed in the transcriptions, not
  allow-listed — `TRANSCRIPTION_DIVERGENCE_ALLOW_LIST` is for documented
  exceptions (today: the four arunit2 tables), not for deferred work.
- `pnpm parity:schema` stays green; existing report lines stay stable or the
  change is noted (output is a stats key per RFC 0064).
