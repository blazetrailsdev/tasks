---
title: "Spell PendingDefault's member default, not default_"
status: draft
updated: 2026-08-27
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/lib/active_model/attribute_registration.rb:61` is
`PendingDefault = Struct.new(:name, :default)`, and :63 reads
`attribute_set[name].with_user_default(default)`.

`packages/activemodel/src/attribute-registration.ts:83-93` names that member
`default_` — `readonly default_: unknown` and
`existing.withUserDefault(this.default_)`. It is the one novel row
`pnpm parity:api:extra --package activemodel` reports for the file (surfaced
while working PR #7124's `ClassMethods` extraction).

`default` is a reserved WORD in JS but not a reserved property or parameter
NAME: `{ default: 1 }.default`, `readonly default: unknown` and `this.default`
are all legal, and the repo already spells Ruby members that collide with JS
keywords straight through where the position allows it. So the trailing
underscore is not a language shortcoming, and per CLAUDE.md a Ruby name whose
convention-table translation is `default` has to be spelled `default`.

Check the sibling structs at the same time: `PendingType` (:54) and
`PendingDecorator` (:66) should be audited for the same treatment, and
`packages/activemodel/src/attribute/user-provided-default.ts` for whether it
carries the same underscore through `with_user_default`
(`attribute_set.rb` / `attribute.rb`'s `with_user_default`).

## Converged shape

`PendingDefault`'s second member is `default`, matching
attribute_registration.rb:61, and the `applyTo` body reads `this.default`
(:63).

## Acceptance criteria

- No `default_` in `packages/activemodel/src/attribute-registration.ts`.
- `pnpm parity:api:extra --package activemodel` reports 0 novel rows for
  `attribute-registration.ts`.
- activemodel + activerecord suites green; `pnpm parity:api:calls` / `:args`
  clean.
