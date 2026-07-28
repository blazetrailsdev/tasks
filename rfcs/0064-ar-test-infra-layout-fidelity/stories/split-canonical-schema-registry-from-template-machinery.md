---
title: "split-canonical-schema-registry-from-template-machinery"
status: in-progress
updated: 2026-07-28
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5522
claim: "2026-07-28T15:59:12Z"
assignee: "split-canonical-schema-registry-from-template-machinery"
blocked-by: null
closed-reason: null
---

## Context

`support-load-schema-helper` extracted only the `load_schema`-shaped entry
point: `packages/activerecord/src/support/load-schema-helper.ts` exports
`loadSchema(adapter)`, the port of
`vendor/rails/activerecord/test/support/load_schema_helper.rb:4-21`, and the
boot paths (`support/template-global-setup.ts:62,155`,
`support/setup-adapter-suite.ts:75`) call it instead of `loadCanonicalSchema`.

What stayed behind in `support/canonical-schema.ts` (2457 lines) is the
canonical table registry (`buildCanonicalRegistry`, the hand transcription of
`test/schema/schema.rb`) plus the per-worker template/clone machinery
(`rebuildCanonicalTables`, `ensureCanonicalTables`, `fkSafeDropPlan`,
`bulkInboundFkHost`). The template/clone half has no Rails counterpart — Rails'
suite is one process against one database — and by the RFC 0064 disposition it
keeps its own file and invented name.

The open question this story answers: whether the registry half (the schema.rb
transcription) should live in a `test-helpers/test-schema.ts`-adjacent module
distinct from the drop/rebuild machinery, so that `canonical-schema.ts` is not
one 2400-line file holding two unrelated concerns.

## Acceptance criteria

- Decide and document whether `buildCanonicalRegistry` + `TableBuilder` +
  `emitTableIndexes` (the schema.rb transcription) split out of
  `canonical-schema.ts` from the FK/drop/rebuild machinery, and to which
  filenames per RFC 0064's target layout.
- If splitting: `pnpm schema:compare` output must be byte-identical
  (`scripts/schema-compare/` reads the registry), and
  `eslint/no-internal-canonical-loaders.mjs` module matching (which keys off the
  `canonical-schema` basename) must be updated to cover the new module.
- 500 LOC ceiling applies; a pure move may exceed it only as a single mechanical
  rename noted in the PR body.
