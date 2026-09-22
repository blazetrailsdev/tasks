---
title: "ordered-options-key-does-not-tell-symbol-from-string"
status: ready
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `assertions-activesupport-cache-xml-json-callbacks` (RFC 0132).
Parked tests in `packages/activesupport/src/ordered-options.test.ts`:
`ordered options key` and `inheritable options key`.

Rails (`vendor/rails/activesupport/test/ordered_options_test.rb:198-225`)
asserts `object.key?(:one)` is true and `object.key?("one")` is false for each
of `one` / `two` / `three`, however they were assigned (`object.one =`,
`object[:two] =`, `object["three"] =`), because `OrderedOptions#[]=`
(`vendor/rails/activesupport/lib/active_support/ordered_options.rb:37-39`)
stores every key as `key.to_sym` and `key?` is Hash's own, so a String key
never matches.

Per the repo's Symbol convention (CLAUDE.md, "A Ruby Symbol is a JS string"),
where Ruby control flow turns on Symbol vs String the Symbol keeps its colon:
`:one` is `":one"`. trails' `OrderedOptions` (`packages/activesupport/src/ordered-options.ts`)
stores and answers `isKey` on the bare name, so `isKey(":one")` is false and
`isKey("one")` is true — the inverse of Rails on six of the seven assertions.
The previous trails body asserted `isKey("one")` twice.

## Acceptance criteria

- `OrderedOptions` / `InheritableOptions` store keys the way `[]=`'s `to_sym`
  does, so `isKey` answers the Symbol spelling and rejects the String one.
- Un-skip both tests; they pass unchanged.
