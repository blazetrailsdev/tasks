---
title: "scaffold-params-cast-base-new-accepts-parameters"
status: draft
updated: 2026-09-29
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scaffold-controller-fails-trails-tsc-on-a-fresh-app` (trails#8250) made the
generated controller type-check by emitting
`private postParams(): Record<string, unknown>` with
`return this.params.expect({ post: [...] }) as Record<string, unknown>;`
(and the same cast on the `params.fetch("post", {})` arm) in
`packages/trailties/src/generators/rails/scaffold-controller/scaffold-controller-generator.ts`
(`paramsMethod`). Rails' template has no such cast:
`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/scaffold_controller/templates/controller.rb.tt:55-60`.

The runtime value is a permitted `ActionController::Parameters`, which
ActiveModel already accepts: `sanitizeForMassAssignment`
(`packages/activemodel/src/forbidden-attributes-protection.ts`) reads
`permitted` / `toH()`, as Rails' `assign_attributes` accepts anything that
`respond_to?(:each_pair)` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_assignment.rb:28-35`).
The type side is what refuses it. `Base.new`, `Base.create`, `#update` and
`#updateBang` (`packages/activerecord/src/base.ts`) take `Record<string, unknown>`,
and a class instance has no string index signature. `Base._mergeCurrentScopeAttrs`
also spreads its argument (`{ ...scopeAttrs, ...attrs }`), which would drop a
`Parameters`' `permitted` flag under a scope.

## Acceptance criteria

- `Base.new` / `create` / `update` / `updateBang` accept a permitted-params value
  (a type covering `each_pair` / `permitted` + `toH`), and `_mergeCurrentScopeAttrs`
  keeps it intact.
- The scaffold emits `*Params()` without the `as Record<string, unknown>` cast, and
  `scaffold-generator.trails.test.ts` "emits a controller that trails-tsc builds
  against the scaffolded model" stays green.
