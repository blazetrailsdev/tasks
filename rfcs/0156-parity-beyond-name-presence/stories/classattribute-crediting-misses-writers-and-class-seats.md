---
title: "classAttribute crediting misses writers and class-level seats"
status: draft
updated: 2026-09-22
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`extract-ts-api.ts` credits a `classAttribute.call(host, "name", …)` site
(`collectClassAttributeCalls`, used at `extract-ts-api.ts:1047`) with the reader and the
`isName` predicate only, and only when the enclosing entity resolves. Ruby's
`class_attribute` (`activesupport/lib/active_support/core_ext/class/attribute.rb:80-84`,
credited by `extract-ruby-api.rb` `process_mattr`, `:937,:1009`) defines a class reader,
writer (`name=`) and predicate (`name?`), plus instance seats. So these rows stay missing
in `parity:api` even though every accessor is installed at runtime:

- `test_fixtures.rb` → `test-fixtures.ts` (after trails#7976): 30 of the 32 missing rows are
  the 8 `class_attribute`s at `test_fixtures.rb:31-38`. Every `x=` → `setX` is missing on both
  seats. On the class seat the reader `x`, and a predicate the Ruby side spells `x?` → TS
  `x?` rather than `isX`, are also missing.
- `activemodel/serializers/json.rb:15` `include_root_in_json` and `error.rb:13`
  `i18n_customize_full_message` show the same reader/predicate/writer rows missing.
  `json.ts` hosts the call in an object-literal module, and the enclosing-entity lookup
  misses it. The class-module shape (`conversion.ts` `class Conversion { static [included] }`)
  is credited.

## Acceptance criteria

- A `classAttribute.call` site credits the writer `setX` (unless `instanceWriter: false`
  applies to the instance seat only, as Ruby's does) and the class-level reader and predicate.
- The Ruby side's class-seat predicate maps to `isX`, not `x?`.
- Object-literal `[included]` modules resolve as the enclosing entity.
- `test_fixtures.rb` missing count drops to the 2 unported methods (`instantiate_fixtures`,
  `load_instances?`), and `json.rb` / `error.rb` lose their accessor rows. Covered by
  `scripts/api-compare` unit tests.
