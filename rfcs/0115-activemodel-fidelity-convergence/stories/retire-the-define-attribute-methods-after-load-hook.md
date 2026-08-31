---
title: "Retire the defineAttributeMethodsAfterLoad schema-load hook"
status: done
updated: 2026-08-31
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: 4
pr: 7279
claim: "2026-08-31T00:58:53Z"
assignee: "retire-the-define-attribute-methods-after-load-hook"
blocked-by: null
closed-reason: null
---

## Context

`defineAttributeMethodsAfterLoad` (`packages/activerecord/src/model-schema.ts`)
has no Rails counterpart. Rails generates attribute methods on demand:
`method_missing` calls `define_attribute_methods` and retries
(`activemodel/lib/active_model/attribute_methods.rb:474-486`), while
`load_schema!` itself defines nothing
(`activerecord/lib/active_record/model_schema.rb:587-597`). trails has no
`method_missing` for a plain instance, so the hook makes the end of a schema
load the demand point instead.

PR #7233 narrowed the hook's blast radius but did not remove it. It now
generates only the plain readers, releases `_attributeMethodsGenerated`, and
records `_attributeMethodsGeneratedByLoad` so that `Core#init_internals`'
`define_attribute_methods` (`activerecord/lib/active_record/core.rb:848`) still
runs and still reaches `generate_alias_attributes`
(`activerecord/lib/active_record/attribute_methods.rb:104-125`). That flag is
itself extra state Rails does not have, read from two OR clauses in
`defineAttributeMethods` and `undefineAttributeMethods`
(`packages/activerecord/src/attribute-methods.ts`) that
`attribute_methods.rb:104` and `:141-147` do not have.

PR #7216 tried dropping the hook outright and was reverted: it is load-bearing
for `base.trails.test.ts:277`,
`model-schema-load-own-table-descendant.trails.test.ts:76,100,113` and
`secure-token.test.ts > token calls the setter method`, all of which read a
generated attribute property off a class whose schema was loaded but which has
not been instantiated yet.

## Converged shape

No schema-load hook. `load_schema!` defines no attribute methods, as
`model_schema.rb:587-597` does not, and generation happens only where Rails
does it — `define_attribute_methods` from `init_internals` (`core.rb:848`).
`_attributeMethodsGeneratedByLoad` disappears with it, and the two OR clauses
in `attribute-methods.ts` collapse back to Rails' single
`@attribute_methods_generated` check.

Reaching that means the four tests above must stop depending on eager readers
at load time — either by instantiating the model (which is what makes a Rails
reader exist too) or by routing the read through `read_attribute`. Check each
against its Rails counterpart before changing it; a trails-only test that
asserts a trails-only invariant can be retired with the hook.

## Acceptance criteria

- [ ] `defineAttributeMethodsAfterLoad` is gone from `model-schema.ts`, along
      with its `@noRailsEquivalent` tag.
- [ ] `_attributeMethodsGeneratedByLoad` is gone; `defineAttributeMethods` and
      `undefineAttributeMethods` read only `_attributeMethodsGenerated`, as
      `attribute_methods.rb:104` and `:141-147` do.
- [ ] The four tests PR #7216's revert identified are green, or retired with a
      Rails citation for why they asserted a trails-only invariant.
- [ ] AR suite green on all three lanes; `pnpm parity:api:calls` / `:args`
      deltas non-negative.
