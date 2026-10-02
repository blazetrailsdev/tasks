---
title: "ruby-compat: rbObjClass answers the class and rbObjClassname the name; seat Symbol, String's subclasses and Hash#each"
status: closed
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "rename shipped in trails#8416; the remaining seats are core-class-seats-string-subclasses-hash-each-symbol"
---

## Context

`rb_obj_class` (`vendor/ruby/v3.3.11/object.c:265`) answers the class object, and
`rb_obj_classname` (`vendor/ruby/v3.3.11/variable.c:498`) answers its name.

ruby-compat has both since `core-classes-have-no-class-object-visitor-keys-by-name`, under the
wrong names (`packages/ruby-compat/src/object.ts`):

- `rbClassOf(obj)` answers the class object. It reads `obj.constructor`, which is
  `rb_class_real(CLASS_OF(obj))`, so it is `rb_obj_class`, not `rb_class_of`
  (`include/ruby/internal/globals.h:172`, which answers the singleton class).
- `rbObjClass(x)` answers the NAME (`rbModToS(rbClassOf(x))`, or the `rubyClass` brand). That is
  `rb_obj_classname`.

The rename was left out of that PR for size: `rbObjClass` has 162 occurrences across 53 files
(`grep -rn "rbObjClass\b" packages scripts eslint`), including
`scripts/api-compare/naming-taxonomy.ts` (`RUBY_COMPAT_CHAIN_EXPORTS`),
`eslint/no-js-rendering-in-rails-messages.mjs` and `scripts/test-compare/assertion-receipts.ts`.

Three seats are also short of MRI:

- No `Symbol` class object. `rbClassOf(":name")` answers `String`, as `rbObjClass` always has;
  `rb_class_of` answers `rb_cSymbol` for a static symbol.
- `stringSuperclass` (`packages/ruby-compat/src/string/method-table.ts:259`) returns a fresh
  anonymous class, so `Arel::Nodes::SqlLiteral.ancestors` holds no `String`
  (`arel/nodes/sql_literal.rb:5` is `class SqlLiteral < String`).
- `Hash` records `Enumerable` in its ancestry only (`trackIncludedModule`, include.ts), because
  `Hash` (`packages/ruby-compat/src/hash.ts:620`) has no `each` for `Enumerable`'s members to
  run on (`hash.c:7184` is a real `rb_include_module`).
- `Comparable` is a module-private `Module` in include.ts; `comparable.ts` exports only the
  `Comparable` interface.

## Acceptance criteria

- [ ] `rbObjClass` answers the class object and `rbObjClassname` the name; `rbClassOf` is gone.
      One mechanical rename, noted in the PR body.
- [ ] Call sites that compare names (`rbObjClass(x) === "Hash"`) compare class objects.
- [ ] `stringSuperclass`'s class extends the `String` seat.
- [ ] `Hash` includes `Enumerable` through `include()`, with an `each`.
- [ ] The `Symbol` seat is decided: seated and answered for a `":name"` string, or recorded as
      not seatable with the reason.
