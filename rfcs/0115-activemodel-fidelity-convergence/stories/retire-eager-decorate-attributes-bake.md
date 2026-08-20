---
title: "Retire decorateAttributes' eager _attributeDefinitions bake and the isDecoratorReplay counter"
status: in-progress
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6791
claim: "2026-08-20T20:35:14Z"
assignee: "collapse-the-two-assign-attributes-ports-onto-one"
blocked-by: null
closed-reason: null
---

## Context

`decorateAttributes` (`packages/activemodel/src/attribute-registration.ts`)
does two things where Rails does one. Rails'
`decorate_attributes`
(`vendor/rails/activemodel/lib/active_model/attribute_registration.rb:26-30`)
only appends a `PendingDecorator` and calls `reset_default_attributes`; the
decoration is applied when `_default_attributes` next materializes
(`attribute_registration.rb:32-36`). trails additionally walks
`_attributeDefinitions` at declaration time and bakes the decorated type into
each definition — a back-compat convenience with no Rails counterpart.

That eager pass is what forces two further inventions:

- the `isDecoratorReplay()` depth counter, which exists purely so a decorator
  can tell the eager pass from the real replay (`enum.ts:203-210`);
- the `host` third parameter threaded through `AttributeDecorator`, since a
  decorator applied eagerly on the declaring class has no materializing class
  to key off.

PR #6776/#6784 removed the post-reflection re-bake in
`applyColumnsHash` (`packages/activerecord/src/model-schema.ts`), so the eager
pass in `decorateAttributes` is now the only writer keeping
`_attributeDefinitions` types decorated. Its readers are being moved to
`type_for_attribute` / `attribute_types` by RFC 0078's
`converge-attribute-definitions-*-readers` stories.

## Converged shape

`decorateAttributes` is the Rails three lines: resolve the names, push one
`PendingDecorator`, `resetDefaultAttributes`. No walk of
`_attributeDefinitions`, no `isDecoratorReplay` counter, no `host` parameter on
`AttributeDecorator`.

## Acceptance criteria

- `decorateAttributes` matches `attribute_registration.rb:26-30` line for line.
- `isDecoratorReplay` / the replay-depth counter is deleted and not exported.
- Every decorator that consulted it (enum's undeclared-type check) reads the
  materializing class from `PendingDecorator#apply_to` instead.
- Depends on the RFC 0078 `converge-attribute-definitions-*-readers` stories:
  no remaining reader may depend on a decorated `_attributeDefinitions` entry.
