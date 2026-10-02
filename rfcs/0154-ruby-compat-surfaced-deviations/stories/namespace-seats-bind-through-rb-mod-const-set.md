---
title: "Namespace seats bind through rbModConstSet in every package; delete rbSetClassPathString (~500 LOC)"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps:
  - thor-parser-classes-seat-their-ruby-names-on-the-thor-class
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails PR 8370 settled the seat spelling in CLAUDE.md § "Call-time constant
resolution": a seated class is bound with `rbModConstSet(Owner, "Name", klass)`
(`packages/ruby-compat/src/include.ts`, `rb_mod_const_set`), because binding a
class under a named owner is what paths it in Ruby
(`vendor/ruby/v3.3.11/variable.c:3648-3668`). arel and
`activemodel/src/attribute.ts` are converged.

Every other package still seats with a plain assignment, which binds the
constant and leaves the class unpathed, so `rbModName` / `rbObjClass` render it
unqualified (`Base`, where Rails says `ActiveRecord::Base`):

- `packages/activerecord/src` — the `ActiveRecord.X = X`,
  `Associations.X = X`, `ConnectionAdapters.X = X`, `Encryption.X = X` and
  `Migration.X = X` seats the section lists
  (`grep -rnE '^(ActiveRecord|Associations|ConnectionAdapters|Encryption|Migration)\.[A-Z]\w* = ' packages/activerecord/src`).
- `packages/activesupport/src`, `packages/actionview/src`,
  `packages/actionpack/src`, `packages/trailties/src` — the `ActiveSupport.X`,
  `ActionView.X`, `ActionDispatch.X` and `TopLevel.X` seats.

Two callers of the older `rbSetClassPathString`
(`packages/ruby-compat/src/object.ts`) remain, both in
`packages/trailties/src/thor/parser/` (`argument.ts`, `arguments.ts`), pathing
under an object literal `{ name: "Thor" }` because no `Thor` class object
exists yet. `thor-parser-classes-seat-their-ruby-names-on-the-thor-class`
owns them; its acceptance criteria name `rbSetClassPathString` and predate the
settled spelling, so it lands as `rbModConstSet(Thor, "Argument", Argument)`.

A seat that names a class which Rails defines under a different owner than
the one it is seated on is not re-pathed by a second binding: `rbModConstSet`
keeps a permanent path (`Arel.Attribute = Attributes.Attribute` stays
`Arel::Attributes::Attribute`).

## Acceptance criteria

- [ ] Every namespace seat in activerecord, activesupport, actionview,
      actionpack and trailties that binds a class or module is
      `rbModConstSet(Owner, "Name", value)`, and `rbModName` answers the Rails
      path for it.
- [ ] `rbSetClassPathString` is deleted from ruby-compat, with its tests
      (`object.trails.test.ts`, `variable.trails.test.ts`,
      `marshal.trails.test.ts`) moved onto `rbModConstSet`, once the Thor story
      has removed its last two callers.
- [ ] Each package's built `dist` modules still load as ESM entry modules
      (the check CLAUDE.md § "Call-time constant resolution" prescribes).
