---
title: "Canonical-schema reference probe hand-computes the FK table instead of ReferenceDefinition#foreignTableName"
status: in-progress
updated: 2026-09-26
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8130
claim: "2026-09-26T02:17:05Z"
assignee: "mapper-drops-its-own-routes-buffer"
blocked-by: null
closed-reason: null
---

## Context

trails#8115 made the canonical-schema replay probes
(`packages/activerecord/src/support/canonical-schema.ts` `replayReference`, used by
`canonicalRegistrySchema` and `canonicalForeignKeyDependents`) replay `t.references` through
`ReferenceDefinition#addTo`. But `replayReference` supplies `foreignKey: { toTable: pluralize(name) }`
itself, instead of letting `ReferenceDefinition#foreignTableName` resolve it. That method is the port
of `connection_adapters/abstract/schema_definitions.rb` `foreign_table_name`:
`foreign_key_options.fetch(:to_table) { Base.pluralize_table_names ? name.to_s.pluralize : name }`.

The pass-through fails only in CI's `pnpm exec tsx scripts/schema-compare/compare.ts` step, which
runs under tsx's CJS transform:

- `ActiveRecord.Base` is unset: `TypeError: Cannot read properties of undefined (reading 'pluralizeTableNames')`.
- A static `import "../base.js"` fails to compile:
  `activesupport/dist/yaml.js: Top-level await is currently not supported with the "cjs" output format`.
- A dynamic `import("../base.js")` loads the ESM copy of `namespaces.js`, so the CJS
  `ActiveRecord.Base` the probe reads stays unset.

Under vitest (ESM), `scripts/schema-compare/compare.test.ts` passes with the pass-through plus
`import "../base.js"`.

## Converged shape

Run the schema-compare CLI as ESM (a `.mts` entry, or `"type": "module"` scoped to
`scripts/schema-compare`) and have `canonical-schema.ts` seat `Base`. Then `replayReference`
is `new ReferenceDefinition(name, o).addTo(probe)` and `foreignTableName` answers from
`pluralize_table_names`.

## Acceptance criteria

- `replayReference` passes the options through unchanged. The `pluralize` import is gone.
- `pnpm exec tsx scripts/schema-compare/compare.ts` (or its converged ESM invocation in `ci.yml`)
  and `pnpm vitest run scripts/schema-compare` are green.
