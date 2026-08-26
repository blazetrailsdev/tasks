---
title: "Retire declaredAttributeNames — its @noRailsEquivalent receipt names a gate that no longer exists"
status: ready
updated: 2026-08-26
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`declaredAttributeNames` (`packages/activerecord/src/model-schema.ts:374`) is
exported and carries:

```
@noRailsEquivalent CONVERGEABLE — feeds `ensureSchemaLoaded`'s reflection
gate, itself a trails-only bridge for Rails' synchronous `load_schema!`.
```

That gate no longer exists. PR #7091 (RFC 0115,
`retire-virtual-attribute-reconciliation`) reduced `ensureSchemaLoaded`
(`packages/activerecord/src/base.ts`) to `return this.loadSchema()`, because
Rails' `column_names` is `columns.map(&:name)` — purely DB-sourced
(`vendor/rails/activerecord/lib/active_record/model_schema.rb:437-441`) — so
nothing has to enumerate declarations to decide whether to reflect.

The function now has **no production caller**. `grep -rn declaredAttributeNames
--include=*.ts packages/` returns the definition plus three test files only:
`model-schema-load.trails.test.ts`, `model-schema-sync-load.trails.test.ts`,
`sti-attribute-routing.trails.test.ts`, each wrapping it in a local
`declared(klass)` helper.

So the receipt is now false on both halves: it names a caller that is gone, and
"CONVERGEABLE" describes surface that can simply be deleted rather than
converged. A `@noRailsEquivalent` whose stated reason no longer holds is exactly
the debt the tag is meant to make visible, not a licence to keep the export.

## Converged shape

Delete the export. The private `declaredAttributes(host)` it wraps
(model-schema.ts, same file) stays — `columnsHash`'s synthesized fallback and
`loadSchemaBangAnchor` both use it. The three test files should assert against
whatever public surface they are really about (`attributeNames()` /
`columnsHash()`), or drop the helper with the export if the assertion has no
public equivalent.

Check `pnpm parity:api:extra --package activerecord` before and after: removing a
`@noRailsEquivalent`-tagged public name should move the activerecord novel/total
marks DOWN, and `pnpm parity:api:extra:tighten` narrows them (never a reseed).

## Acceptance criteria

- [ ] `declaredAttributeNames` is no longer exported from `model-schema.ts`.
- [ ] No `@noRailsEquivalent` receipt in the repo names `ensureSchemaLoaded`'s
      retired reflection gate.
- [ ] The three trails test files still cover what they were written for, via
      public surface.
- [ ] extra-surface marks narrowed with `parity:api:extra:tighten`; suites green.
