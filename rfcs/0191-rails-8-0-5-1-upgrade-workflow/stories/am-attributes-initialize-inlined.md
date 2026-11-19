---
title: "ActiveModel::Attributes#initialize is inlined and tagged"
status: done
updated: 2026-11-19
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: entry
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 150
priority: 1
pr: trails#10345
claim: "2026-11-19T04:46:38Z"
assignee: "am-attributes-initialize-inlined"
blocked-by: null
closed-reason: null
---

## Context

Found by the 8.0.2 entry check (trails `876804dd8b`): `parity:api` reports
`ActiveModel::Attributes#initialize` missing from activemodel's
`attributes.ts` (20/21).

Rails: `@attributes = self.class._default_attributes.deep_dup`, then
`super` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attributes.rb:106-109`).
No framework class in `vendor/rails/v8.0.2` includes `ActiveModel::Attributes`;
application code does, so it is an open-set module whose `initialize` trails
inlines behind a guard in `Model`'s constructor
(`packages/activemodel/lib/model.ts:145`, currently
`if (_includesAttributes(klass)) Reflect.set(this, "_attributes", …)`).

Tagging that constructor `@inlinedFrom ActiveModel::Attributes#initialize`
today throws in `scripts/api-compare/compare.ts:6899` ("no Rails `initialize`
paired"): the gate pairs a tag only with the host class's own Rails
`initialize`, and CLAUDE.md § "A module installed at run time is inlined
behind a guard" tags a guarded segment only where the Rails manifest records
the include.

Operator ruling (2026-11-18): the segment carries the `@inlinedFrom` tag. The
gate is changed to accept it.

## Acceptance criteria

- [ ] `compare.ts` pairs an `@inlinedFrom Mod#initialize` tag on a constructor
      whose segment sits in an `if (isModuleIncluded(new.target, Mod))` guard
      with `Mod#initialize` directly, even where the Rails manifest records no
      framework include of `Mod`; the call gates compare the guarded block
      against that body; `parity:api` credits `Mod#initialize` to `Mod`'s file.
      Covered in `scripts/api-compare/compare-inlined-from.test.ts`.
- [ ] An unguarded segment, or a tag naming a module the guard does not test,
      still throws.
- [ ] `model.ts`'s segment is converged: guard
      `isModuleIncluded(new.target, Attributes)` carrying
      `@inventedArm if — PERMANENT`, body `this._attributes =
klass._defaultAttributes().deepDup()` at Ruby's `super` position, and
      the constructor tagged `@inlinedFrom ActiveModel::Attributes#initialize
rails/v8.0.2/activemodel/lib/active_model/attributes.rb:106-109`.
- [ ] CLAUDE.md § "A module installed at run time is inlined behind a guard"
      is amended to admit the tag on a guarded open-set segment.
- [ ] `parity:api` shows activemodel `attributes.rb` at 21/21, and
      `pnpm parity:api:inlined` is green.
