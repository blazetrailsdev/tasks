---
title: "Drop the extra generateAliasAttributes call from init_internals"
status: draft
updated: 2026-08-30
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `init_internals` (`activerecord/lib/active_record/core.rb:832-849`) ends
with exactly one attribute-methods call, `klass.define_attribute_methods`;
`generate_alias_attributes` (`activerecord/lib/active_record/attribute_methods.rb:127-139`)
is reached from INSIDE it (`attribute_methods.rb:104-125`).

PR #7220 added a second, extra call at
`packages/activerecord/src/core.ts:616` — `klass.generateAliasAttributes()` —
because trails' ratified schema-load hook `defineAttributeMethodsAfterLoad`
(`packages/activerecord/src/model-schema.ts`) pre-consumes the
`_attributeMethodsGenerated` guard (`attribute_methods.rb:104`) while
suppressing alias generation via `withoutAliasAttributeGeneration`
(`packages/activerecord/src/attribute-methods.ts`). By the time an instance is
built, `defineAttributeMethods()` early-returns and its internal
`generateAliasAttributes.call(this)` never fires, so the alias half needs the
extra call.

The extra call also carries no call-site receipt: `blazetrails/no-freeform-comments`
rejects a prose comment, and none of `@internal` / `@noRailsEquivalent` /
`@missingRailsCall` / `@missingRailsArgs` describes an EXTRA call, so the
reasoning lives only in the `model-schema.ts` JSDoc.

## Converged shape

`init_internals` calls `klass.defineAttributeMethods()` and nothing else, as in
`core.rb:848`. Reaching that means the schema-load hook must stop latching
`_attributeMethodsGenerated` on behalf of the instance path — either by
generating the plain readers without going through `defineAttributeMethods` at
all, or by retiring the hook once trails no longer needs eager reader
properties at load time. Note PR #7216 tried dropping the hook outright and was
reverted: it is load-bearing for `base.trails.test.ts:277`,
`model-schema-load-own-table-descendant.trails.test.ts:76,100,113` and
`secure-token.test.ts > token calls the setter method`.

## Acceptance criteria

- [ ] `packages/activerecord/src/core.ts`'s `initInternals` makes no
      attribute-methods call Rails' `core.rb:848` does not make.
- [ ] Alias attribute methods are still generated at instantiation and not at
      schema load — `attribute-methods.trails.test.ts > a schema load does not
      mass-generate alias attribute methods` stays green.
- [ ] The tests PR #7216's revert identified stay green on all three lanes.
- [ ] `pnpm parity:api:calls` / `:args` deltas non-negative.
