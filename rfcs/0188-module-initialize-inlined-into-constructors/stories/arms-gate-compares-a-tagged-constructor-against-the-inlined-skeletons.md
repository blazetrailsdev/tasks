---
title: "parity:api:arms compares a tagged constructor's skeleton against the inlined Rails bodies"
status: draft
updated: 2026-10-09
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8727 made the call-set and call-argument gates compare a tagged constructor against the union of the inlined Rails bodies (`inlinedRubyBody` / `inlinedRubyCallArgs`, `scripts/api-compare/inlined-bodies.ts`). The skeleton row that `checkCalls` writes for the same pair (`callSkeletons.push` in `scripts/api-compare/compare.ts`, read by `parity:api:arms:report` and `parity:api:arms:throws`) still takes `rubySkeleton` from the class's own `initialize` alone.

So once a constructor inlines a module body, every `if` / `throw` / `rescue` that body brings is filed as an INVENTED arm on the pair, and would need an `@inventedArm` receipt for code that is a faithful port. Example: `ActiveModel::API#initialize` is `assign_attributes(attributes) if attributes` then `super()` (`vendor/rails/v8.0.2/activemodel/lib/active_model/api.rb:80-84`); its `if` is Rails' arm, not an invented one. `ActiveRecord::Inheritance::ClassMethods#new` (`activerecord/lib/active_record/inheritance.rb:56-78`) carries a `raise` and three branches.

## Acceptance criteria

- For a pair whose chain is non-empty, the Ruby skeleton is the chain's segments' skeletons concatenated in chain order, with each consumed `super` token dropped as the call gates drop it.
- `parity:api:arms:report` files no invented arm for a control token a tagged or same-file body contributes; a test covers one module, and a class `initialize` plus a module.
- A dropped arm from a tagged body is reported as missing; a test covers it.
- `parity:api:arms:throws` stays green; any mark that moves is tightened, never raised.
