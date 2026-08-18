---
title: "Model.moduleName carries no @noRailsEquivalent receipt"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into model-name-use-relative-model-naming-detection — both are about the namespace Model.modelName passes to Name.new (naming.rb:271-276); moduleName is the carrier that story replaces or documents, so it is one 90-LOC change"
---

# `Model.moduleName` carries no `@noRailsEquivalent` receipt

## Context

Surfaced in PR #6568. `packages/activemodel/src/model.ts`'s
`declare static moduleName?: string` is the `::`-joined module-path carrier
that `model_name` passes as Rails' `namespace` argument
(`activemodel/lib/active_model/naming.rb:271-275`, where Ruby gets it from
`module_parents` on the constant itself).

It scores as **novel** extra surface in
`pnpm parity:api:extra --package activemodel` with no tag. The identical
carrier on `packages/activemodel/src/serializers/json.ts:63` was tagged
`@noRailsEquivalent PERMANENT` in that PR — the `model.ts` twin predates it and
was left untouched to keep the diff scoped.

Note this is a receipt, not a convergence: a JS class name genuinely carries no
module path, which is the language-level fact the PERMANENT classification
records. If the carrier can be eliminated (e.g. by deriving the path from a
registry at `model_name` time) that is the better outcome and this story should
take it.

## Acceptance criteria

- [ ] `model.ts`'s `moduleName` either stops being extra surface, or carries a
      `@noRailsEquivalent PERMANENT` reason citing naming.rb:271-275.
- [ ] `pnpm parity:api:extra`'s permanence census stays at 0 unclassified.
