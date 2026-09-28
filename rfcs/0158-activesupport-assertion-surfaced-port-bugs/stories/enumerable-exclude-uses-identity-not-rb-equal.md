---
title: "Enumerable#exclude? port compares by identity, not Ruby =="
status: draft
updated: 2026-09-28
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Enumerable#exclude?` is `!include?(object)` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/enumerable.rb:118-120`), and `Array#include?` compares with `==` (`rb_equal`). trails' `exclude` in `packages/activesupport/src/enumerable-utils.ts:254` is `!collection.includes(object)` — JS SameValueZero identity — so two distinct records/values that are `==` in Ruby are reported as excluded.

## Converged shape

`exclude(collection, object)` answers `!collection.some((e) => rbEqual(e, object))` (ruby-compat `rbEqual`, the `rb_equal` port), i.e. `!include?` with Ruby equality.

## Acceptance criteria

- `exclude([new Topic({id: 1})...], sameIdRecord)` answers false; value-equal Dates/Times likewise.
- A test pinning the `==` semantics.
