---
title: "acceptsNestedAttributesFor is a free function taking the model where Rails is a ClassMethods method"
status: in-progress
updated: 2026-09-26
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8128
claim: "2026-09-26T02:02:04Z"
assignee: "journey-match-data-index-invented-guards"
blocked-by: null
closed-reason: null
---

## Context

Rails defines `accepts_nested_attributes_for(*attr_names)` in
`NestedAttributes::ClassMethods` (`vendor/rails/activerecord/lib/active_record/nested_attributes.rb:351-372`),
so every call is `Model.accepts_nested_attributes_for(...)` with the model as `self`.

trails' `acceptsNestedAttributesFor(modelClass, ...attrNames)`
(`packages/activerecord/src/nested-attributes.ts`) takes the model as its first argument, and
`Base.acceptsNestedAttributesFor` (`packages/activerecord/src/base.ts`) is a wrapper forwarding
`this`. trails#8101 converged the name list to `*attr_names` but left the receiver shape. About
35 call sites across 17 files call the free function with an explicit model, e.g.
`test-helpers/models/pirate.ts`, `person.ts`, `bird.ts`, `club.ts`, `chef.ts`, `company.ts`,
`cpk.ts`, `eye.ts`, `developer.ts`, `drink-designer.ts`, and
`associations/has-and-belongs-to-many-associations.test.ts:155`.

## Converged shape

`export function acceptsNestedAttributesFor(this: typeof Base, ...attrNames)`, assigned with
`static acceptsNestedAttributesFor = acceptsNestedAttributesFor` on `Base` (CLAUDE.md
§ "Module mixins"), and no wrapper. Every call site becomes `Model.acceptsNestedAttributesFor(...)`,
inside the model's `static {}` block where Rails has it in the class body.

## Acceptance criteria

- The free function is `this`-typed, and `Base` assigns it directly with no forwarding body.
- No caller passes a model class as the first argument.
- The canonical models call it in the class body, matching `vendor/rails/activerecord/test/models/*.rb`.
