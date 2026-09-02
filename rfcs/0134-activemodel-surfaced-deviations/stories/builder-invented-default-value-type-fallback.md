---
title: "activemodel: LazyAttributeSet/LazyAttributeHash add a `?? defaultValue()` type fallback Rails does not have"
status: ready
updated: 2026-09-02
rfc: "0134-activemodel-surfaced-deviations"
cluster: invented-arm
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 40
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/attribute-set/builder.ts:82`, `:112`, `:258` all
spell the type lookup
`this.additionalTypes.get(name) ?? this.types.get(name) ?? defaultValue()`.

Rails (`vendor/rails/activemodel/lib/active_model/attribute_set/builder.rb:51`,
`:78`, `:166`) is `additional_types.fetch(name, types[name])` — a name in
neither map yields `nil`, and Rails then fails loudly
(`nil.deserialize` → NoMethodError) or builds the attribute with a nil type.
trails silently casts through the default type instead. The 5 baseline rows in
`scripts/api-compare/call-mismatches-exclude/activemodel/attribute-set/builder.json`
document the Map-has-no-`fetch` spelling but none mentions this invented
fallback.

Related fetch-class edge in the same file: Ruby `default_attribute` always
passes `@casted_values[name]` (possibly nil) as `from_database`'s 4th argument
(builder.rb:81); trails branches 3-arg/4-arg on `undefined`
(builder.ts:115-119). Align while there.

## Acceptance criteria

- The three lookups drop `?? defaultValue()`; an absent type flows through as
  Rails' nil does (the resulting TypeError at `.deserialize` is the Rails
  NoMethodError analogue).
- `defaultAttribute` passes the casted value unconditionally as Ruby does, or
  a comment cites why the branch is load-bearing (with the failing case).
- `attribute-set/builder.test.ts` and `builder-defaults.test.ts` stay green;
  baseline rows for this file are updated only by DELETING any made stale.
