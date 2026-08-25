---
title: "model-name-human-drops-klass-guard-and-human-fallback"
status: done
updated: 2026-08-05
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6105
claim: "2026-08-04T23:47:02Z"
assignee: "model-name-human-drops-klass-guard-and-human-fallback"
blocked-by: null
closed-reason: null
---

# `ModelName#human` carries a `_klass` guard and `_humanFallback` Rails does not

## Context

`ActiveModel::Name#human`
(vendor/rails/activemodel/lib/active_model/naming.rb:197-207) has exactly one
early return:

```ruby
return @human if i18n_keys.empty? || i18n_scope.empty?
```

`@human` is computed once in `initialize` (naming.rb:`@human = ActiveSupport::Inflector.humanize(@element)`).
`packages/activemodel/src/naming.ts` instead keeps a private `_humanFallback`
field and opens `human` with an extra `if (!this._klass) return this._humanFallback;`
that has no Rails counterpart — a second guard on a state field Rails' `Name`
does not have (`klass` is a constructor argument there, not a lookup gate).

PR #6094 turned `human` into a method taking `options` and left both in place.

## Converged shape

- Name the memo `human` the way Rails does (or keep the private field but
  under the Rails name), and drop the `_klass` early return so the only guard
  is `i18nKeys().length === 0 || i18nScope().length === 0` — `i18n_keys` /
  `i18n_scope` already answer empty for a `Name` with no lookup ancestry
  (naming.rb:220-231), which is what makes Rails' single guard sufficient.

## Acceptance criteria

- [ ] `human` has one early return, matching naming.rb:198.
- [ ] No `_klass`-shaped gate on the translation path.
- [ ] naming_test.rb / translation_test.rb `human` cases pass with names
      untouched.
