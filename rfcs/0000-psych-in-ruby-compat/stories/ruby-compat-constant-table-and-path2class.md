---
title: "Move the registered-constant table into ruby-compat and port rb_path_to_class / rb_mod_name"
status: draft
updated: 2026-09-29
rfc: "0000-psych-in-ruby-compat"
cluster: fidelity
packages: ["ruby-compat", "activesupport", "activerecord", "trailties"]
deps: ["psych-object-protocol-for-record-yaml-round-trip"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC Design §2. Psych resolves `!ruby/object:<Class>` through
`ClassLoader#path2class` (`vendor/ruby/v3.3.11/ext/psych/lib/psych/class_loader.rb:51-56`), the C
`path2class` (`vendor/ruby/v3.3.11/ext/psych/psych_to_ruby.c:22`) over
`rb_path_to_class` (`vendor/ruby/v3.3.11/variable.c:432`). It names a class
through `Module#name` (`rb_mod_name`, `variable.c:122`). #8254's port calls
activesupport's `constantize` and `registeredConstantName` instead
(`packages/activesupport/src/inflector.ts:182-240`). ruby-compat rule 4 forbids
that edge, so the constant table has to be in ruby-compat before Psych can move.

The table (`_constants`, `registerConstant`, `unregisterConstant`,
`isRegisteredConstant`, `registeredConstantName`, `_resetConstants`) is
Ruby's `Object` constant table. It sits beside
`packages/ruby-compat/src/variable.ts`'s existing `rbConstGet` /
`rbConstMissing`. Non-test importers today: `activerecord/src/associations.ts`,
`activerecord/src/namespaces.ts`, `activesupport/src/delegation.ts`,
`activesupport/src/core-ext/name-error.ts`, `activesupport/src/index.ts`,
`trailties/src/generators/base.ts`, plus about 27 test files (re-grep).

PR #8254 also names a class through a `Symbol.for("@blazetrails:rubyNamespace")`
brand (copies at `activemodel/src/attribute.ts:23`,
`arel/src/visitors/ruby-class.ts:4`). That brand is the nesting half of
`rb_mod_name`.

Sequenced after #8254 (`psych-object-protocol-for-record-yaml-round-trip`) so its `./inflector.js` import is not
broken mid-review.

## Acceptance criteria

- [ ] The table and its four accessors live in `ruby-compat/src/variable.ts`
      with their existing names and `@noRailsEquivalent PERMANENT` receipts,
      plus a `vendor/ruby/v3.3.11/variable.c` citation (`rb_const_set` on
      `rb_cObject`). They are deleted from activesupport, with no re-export,
      and every importer imports from `@blazetrails/ruby-compat`.
- [ ] `rbPathToClass(path)` ports `variable.c:432-481`: the `::`-segment
      walk, `ArgumentError "undefined class/module <path>"` on a miss, and
      `TypeError "<path> does not refer to class/module"` on a non-module
      value, with those messages. It reads the table first, then the chain,
      as `constantize` does today.
- [ ] `rbModName(klass)` ports `variable.c:122`: the registered name, else the
      `rubyNamespace` brand nesting, else `klass.name`. This is #8254's
      `className`, moved.
- [ ] activesupport's `constantize` keeps its Rails body
      (`inflector/methods.rb:289-291`) and reads the moved table.
- [ ] README "What is here" gains rows for every new export, with call sites.
- [ ] `pnpm parity:api:extra:gate`: activesupport's `total` drops by the moved
      names (`parity:api:extra:tighten`). ruby-compat stays mark-neutral
      (receipted).

## Verification

`pnpm vitest run packages/ruby-compat/src/variable*.test.ts packages/activesupport/src/inflector*.test.ts`.
