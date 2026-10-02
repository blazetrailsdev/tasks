---
title: "ruby-compat: String's subclasses descend from the String seat, Hash includes Enumerable over a real each, and Symbol is decided"
status: closed
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "shipped in trails#8416: stringSuperclass extends the String seat, Hash#each plus include(Hash, Enumerable), Symbol recorded as unseatable in ruby-compat's README"
---

## Context

`core-classes-have-no-class-object-visitor-keys-by-name` seated a class object per core class
in `packages/ruby-compat/src/object.ts`, answered by `rbObjClass`. Three seats are short of MRI:

- **`String`'s subclasses.** `stringSuperclass` (`packages/ruby-compat/src/string/method-table.ts`)
  returns a fresh anonymous class, so `Arel::Nodes::SqlLiteral.ancestors` holds no `String`
  (`vendor/rails/v8.0.2/activerecord/lib/arel/nodes/sql_literal.rb:5` is
  `class SqlLiteral < String`). A visitor defining only `visit_String` reaches it for a
  SqlLiteral in Rails (`arel/visitors/visitor.rb:40`) and raises `Cannot visit` here.
- **`Hash` and `Enumerable`.** include.ts records `Enumerable` in `Hash`'s ancestry with
  `trackIncludedModule`, where `vendor/ruby/v3.3.11/hash.c:7184` is a real `rb_include_module`.
  `Hash` (`packages/ruby-compat/src/hash.ts`) has no `each` for `Enumerable`'s members to run
  on, and adding one (`hash.c:7219`, yielding `[key, value]`) does not type-check today:
  `ActiveSupport::OrderedHash#each` (`packages/activesupport/src/ordered-hash.ts:168`) and
  `Rack::Headers#each` (`packages/rack/src/headers.ts:68`) declare `each` with a
  `(key, value)` block.
- **`Symbol`.** There is no seat. `rbObjClass(":name")` answers `String`, as the name form
  always has, because a Ruby Symbol is a bare JS string except where control flow keeps its
  colon. `rb_class_of` (`vendor/ruby/v3.3.11/include/ruby/internal/globals.h:172`) answers
  `rb_cSymbol`.

## Acceptance criteria

- [ ] `stringSuperclass`'s class extends `rbCString`; a visitor defining only `visitString`
      dispatches a `SqlLiteral`.
- [ ] `Hash#each` yields `[key, value]`, its subclasses' `each` agree with it, and include.ts
      includes `Enumerable` through `include()`.
- [ ] `Symbol` is decided: seated and answered for a `":name"` string, or recorded in
      ruby-compat's README as not seatable, with the reason.
