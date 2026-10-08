---
title: "activerecord: design the camelizeDbColumns preference and one naming rule for generated attribute methods"
status: draft
updated: 2026-10-08
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: ["activerecord", "activemodel"]
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

Owner ruling, 2026-10-08 (blocked-story triage, decision 10): trails uses
camelCase for JS conformance, Rails tables are typically snake_case, and the
user chooses. There is to be a `camelizeDbColumns` preference, set on the
application's base model and overridable on models beneath it, camelCase by
default.

Today a snake_case column keeps its name verbatim as the JS property
(`author_name`), and the generated attribute methods follow no single rule:
`title?` as a quoted literal, `titleChanged` bare camel, `isSavedChangeToTitle`
with the is-prefix, `author_nameChanged` and `isSavedChangeToAuthor_name` for a
snake_case attribute. Rails' patterns are
`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:476-493`.
`attribute-method-pattern-drops-camel-joined-recasing` measured about 400 call
sites behind any uniform rule (146 `*Changed`, 115 `*BeforeTypeCast`,
75 `*ForDatabase`, 27 `*PreviouslyChanged`, 16 `isSavedChangeTo*` /
`isWillSaveChangeTo*`).

Not ruled on: predicate spelling. The repo rule is `isX` for a Ruby `x?`.

## Acceptance criteria

- A design for `camelizeDbColumns`: where it is declared, how a subclass
  overrides it, and what it changes: the attribute reader and writer names, the
  generated attribute-method names, `attributes` / `serializable_hash` keys,
  and the generated model typings.
- The design states one Ruby-name to TS-name rule for generated attribute
  methods, including predicates, and how `method_missing` / `respond_to?` map a
  TS name back to the Rails pattern.
- The rename is split into per-suffix stories, and
  `attribute-method-pattern-drops-camel-joined-recasing` is re-cut against it.
