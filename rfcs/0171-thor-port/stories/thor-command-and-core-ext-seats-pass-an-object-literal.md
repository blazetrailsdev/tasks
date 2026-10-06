---
title: "Seat Thor::Command, HiddenCommand, DynamicCommand and CoreExt::HashWithIndifferentAccess on the real Thor constant"
status: draft
updated: 2026-10-06
rfc: "0171-thor-port"
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

trails PR 8564 seated `Thor::Argument`, `Arguments`, `Option` and `Options` with
`rbSetClassPathString(Klass, Thor, "Klass")` against the real `Thor` class
(`packages/trailties/src/thor/thor.ts`, after the class body). Four seats still
pass an object literal as `under`, so their path is not derived from the
constant Ruby nests them in:

- `packages/trailties/src/thor/command.ts`: `Command`, `HiddenCommand` and
  `DynamicCommand`, each `rbSetClassPathString(Klass, { name: "Thor" }, "Klass")`.
  Ruby: `class Thor; class Command`, `class HiddenCommand < Command`,
  `class DynamicCommand < Command` (`vendor/thor/v1.3.2/lib/thor/command.rb`).
- `packages/trailties/src/thor/core-ext/hash-with-indifferent-access.ts`:
  `rbSetClassPathString(HashWithIndifferentAccess, { name: "Thor::CoreExt" }, "HashWithIndifferentAccess")`.
  Ruby: `class Thor; module CoreExt; class HashWithIndifferentAccess < ::Hash`
  (`vendor/thor/v1.3.2/lib/thor/core_ext/hash_with_indifferent_access.rb`).

A seat cannot sit in the defining module: `thor.ts -> base.ts -> command.ts`,
so a module-scope read of `Thor` there is a TDZ error when `thor.ts` is the
entry module. The parser seats live in `thor.ts` for the same reason.

## Acceptance criteria

- [ ] `Command`, `HiddenCommand` and `DynamicCommand` are seated against the
      real `Thor` class in `thor.ts`, beside the parser seats, and the
      `{ name: "Thor" }` literals are gone from `command.ts`.
- [ ] `HashWithIndifferentAccess` is seated under a `Thor::CoreExt` namespace
      object that is itself seated on `Thor`, not under a string literal.
- [ ] A trails test renames each class's JS `name` and still reads the Ruby
      path through `rbModName`.
