---
title: "enum-friendly-alias-intra-enum-conflict"
status: draft
updated: 2026-07-08
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The `_enum` conflict-detection pass in `packages/activerecord/src/enum.ts`
(~line 708, the `if (friendlyName !== fullName)` branch) checks a special-char
label's friendly-alias predicate/bang (`fp`, `friendlyBang`) against
`dangerousMethods` and the cross-enum `enumMethodNames` set, but — unlike the
main-label branch (~line 671, which does `definedNames.add(predicateName)` /
`definedNames.add(bangName)`) — it never adds `fp`/`friendlyBang` to the
per-enum `definedNames` set, nor checks membership there.

Consequence: within a SINGLE enum, one label's friendly alias can silently
collide with a later label's generated method without raising. Example on one
enum: `{ "api-key": 0, api_key: 1 }` — `"api-key"`'s friendly alias camelizes
to `apiKey` → predicate `isApiKey`, and `api_key`'s main predicate is also
`isApiKey`. The pass defines `isApiKey` twice; Rails raises on the second.

Rails defines and checks each alias immediately through `_enum_methods_module`,
so `detect_enum_conflict!` catches the already-defined method:

- `activerecord/lib/active_record/enum.rb:273-275` (the friendly-alias
  `define_enum_methods` call)
- `activerecord/lib/active_record/enum.rb:302-310` (`detect_enum_conflict!`
  for `?`/`!`)
- `activerecord/lib/active_record/enum.rb:381-384`
  (`method_defined_within?(method_name, _enum_methods_module)`)

This is pre-existing (predates and is untouched by PR #4779, which only unified
name derivation through the `enumMethodNamesFor` helper). Flagged by a Codex
review on #4779.

## Acceptance criteria

- The friendly-alias branch adds `fp`/`friendlyBang` to `definedNames` and
  raises when a same-enum collision is detected, matching the main-label
  branch and Rails' per-alias `detect_enum_conflict!`.
- A test declares a single enum whose friendly alias collides with a sibling
  label's generated predicate/bang (e.g. `{ "api-key": 0, api_key: 1 }`) and
  asserts it raises (add to `enum.test.ts` if a Rails enum_test.rb case covers
  it, else a `*.trails.test.ts` sibling — the camelCase alias surface is
  trails-specific).
- Existing enum tests stay green; `api:compare` stays green for `enum.rb`.
