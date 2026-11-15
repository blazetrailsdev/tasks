---
title: "ActiveModel attribute assignment, JSON#from_json and validations stop dropping promises"
status: done
updated: 2026-11-15
rfc: "0234-no-void-promises"
cluster: discarded-calls
packages: [activemodel]
deps: [no-floating-promises-repo-wide-ignore-void-false, no-swallowed-rejection-lint-rule]
deps-rfc: []
est-loc: 400
priority: null
pr: trails#10148
claim: "2026-11-15T20:07:03Z"
assignee: "activemodel-void-async-calls-are-awaited"
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 3. `attribute-assignment.ts:64` (`void this._assignAttribute`
inside `eachPair`) and its three `.catch(() => {})` (`:37,144,174`) around the
assignment-capture machinery; `serializers/json.ts:66`
(`void this.setAttributes`); `validations.ts:381`
(`void this.contextForValidation()`). Rails:
`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_assignment.rb`,
`serializers/json.rb`, `validations.rb`.

## Acceptance criteria

- [ ] `_assignAttributes` awaits each `_assignAttribute` in order, or the sync path raises through `assertAssignedSynchronously`; no promise is dropped.
- [ ] The empty handlers are gone and a rejection reaches the caller (test).
- [ ] activemodel's `floating` and `swallowed` source marks reach 0.

## Definition of done

An `eslint-disable`, a receipt tag, or a raised mark does not close this story.
