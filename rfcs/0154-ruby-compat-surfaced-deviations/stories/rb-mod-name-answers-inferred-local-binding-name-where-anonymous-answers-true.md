---
title: "rbModName answers a class's inferred local-binding name where isAnonymous answers anonymous"
status: draft
updated: 2026-10-07
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
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

trails#8643 made `isAnonymous` (`packages/activesupport/src/module-ext.ts`) answer from three arms: a
constant seat in `classpaths`, a class whose own definition carries an identifier, and, for an
identifier-less class expression, whether the name JS inferred from its binding is a Ruby constant name
(`Foo = Class.new` names the class, `klass = Class.new` does not).

Rails' `Module#anonymous?` is `name.nil?`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/module/anonymous.rb:27-29`), one read of
`Module#name` (`rb_mod_name`, `vendor/ruby/v3.3.11/variable.c:122-127`). In trails the two now disagree:
for `const klass = class extends Base {}`, `isAnonymous(klass)` is true while `rbModName(klass)`
(`packages/ruby-compat/src/object.ts`, `classpaths.get(klass)?.path ?? klass.name`) still answers
`"klass"`. Every other reader of the name keeps the inferred one: `controllerName` and
`default_helper_module!` read `this.name` behind the `isAnonymous` guard, and ActiveRecord / ActiveModel
derive `model_name` and `table_name` from `rbModName` or `.name` with no anonymity check at all.

Related: `helpers-anonymous-and-default-helper-read-js-name` (0141) covers the actionpack call sites
reading the JS `name`. This story is the ruby-compat half: the rule itself belongs in `rbModName`.

The rule was verified only in actionpack's `action-controller/` and `abstract-controller/` suites.
activerecord has ~150 identifier-less class expressions in tests, many bound to lowercase locals and
relying on the inferred name, so moving the rule is not a one-line change.

## Acceptance criteria

- `rbModName` answers `null` for an identifier-less class expression whose inferred binding name is not
  a constant name, and has no constant seat, by the same rule `isAnonymous` applies today.
- `isAnonymous` is `rbModName(klass) == null`, the line-for-line port of `anonymous.rb:27-29`, with the
  source-text and constant-name tests removed from `module-ext.ts`.
- activerecord / activemodel tests that depended on a lowercase inferred name are converted to what the
  Rails test does (`Class.new(ActiveRecord::Base) { self.table_name = ... }`), not special-cased.
- `anonymous.trails.test.ts` keeps passing unchanged.
