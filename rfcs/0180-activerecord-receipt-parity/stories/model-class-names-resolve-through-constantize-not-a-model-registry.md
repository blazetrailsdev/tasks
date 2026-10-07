---
title: "activerecord: model class names resolve through constantize, not a string-keyed model registry"
status: ready
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-root-a-m` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and them are re-tagged `CONVERGEABLE` onto this story.

Rails resolves a class name to a class through the constant table, with no registration step:
`compute_type` (`vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb:242-269`) calls `type_name.constantize` and walks
`candidate.safe_constantize` for a namespace-relative name, `sti_class_for` / `polymorphic_class_for`
(`inheritance.rb:194-203,218-226`) call `constantize`, and `AssociationReflection#compute_class`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/reflection.rb:490-510`) goes through `active_record.send(:compute_type, name)`.

trails keeps a second table beside the constant table, in `packages/activerecord/src/associations.ts`:

- `registerModel(model | name, model | models[])` writes `modelRegistry`, records `_registryKeys`,
  and flushes pending counter-cache columns.
- `registerModelConstant(name, model)` writes activesupport's constant table behind a
  canonical-name shadow guard.
- `autoloadModel(name)` fills the registry from the canonical test-model index on a miss.
- `registerSubclass(klass)` (`packages/activerecord/src/inheritance.ts`) calls
  `registerModelConstant` and then `DescendantsTracker.registerSubclass`.

Each carries `@noRailsEquivalent`. CLAUDE.md § "Call-time constant resolution" already gives the
settled seat for a named class: `rbModConstSet(owner, name, klass)` binds and paths it, and
`constantize` walks each segment through the constant seated on its namespace. § "Trails has no
autoloader" ratifies the absence of Zeitwerk for the application loader. It does not ratify a
second, string-keyed table for models.

## Converged shape

A model is a constant: it is seated once, where it is defined or loaded, and every reader reaches it
through `constantize` / `safeConstantize`, as `compute_type` does. `modelRegistry`,
`registerModel`, `registerModelConstant` and `autoloadModel` are gone, and
`Inheritance.registerSubclass` is only the `DescendantsTracker` half (which CLAUDE.md § "`inherited`
is deferred" leaves to a deferred mechanism). The counter-cache flush moves to where Rails runs it.

This is larger than one PR. Split it when claimed: the readers first (`compute_type` and its
callers onto `constantize`), then the writers.

## Acceptance criteria

- [ ] `computeType`, `stiClassFor`, `polymorphicClassFor` and `computeClass` resolve through `constantize` / `safeConstantize` with Rails' candidate walk, and read no `modelRegistry`.
- [ ] `registerModel`, `registerModelConstant`, `autoloadModel` and `modelRegistry` are deleted, or each survivor is re-filed with the measured blocker.
- [ ] `registerSubclass` in `inheritance.ts` no longer registers a constant.
- [ ] `pnpm parity:api:extra:gate` and `pnpm parity:api:receipts:gate` stay green.
