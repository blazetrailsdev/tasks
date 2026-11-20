---
title: "regexp-to-s-emits-modifier-groups-hermes-rejects"
status: draft
updated: 2026-11-20
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rbRegToS` (`packages/ruby-compat/lib/regexp.ts:89-107`) renders Ruby's `Regexp#to_s` as an ES2025 modifier group, `(?i-ms:pragma)`, and `rbRegSUnion` composes those. V8 compiles them; Hermes' regexp engine does not ("Invalid RegExp: Quantifier has nothing to repeat"), so `AbstractAdapter.buildReadQueryRegexp` (`packages/activerecord/lib/connection-adapters/abstract-adapter.ts:883-889`) throws when the SQLite adapter loads.

Found running `examples/react-native-notes` on an Android emulator (Expo Go, SDK 58, Hermes) for trails#10425, which works around it in the example; see its README row 17.

## Acceptance criteria

- A regexp built from `rbRegToS` / `rbRegSUnion` compiles on an engine without regexp modifiers, matching what it matches on V8 (e.g. by lowering a case-insensitive group to case classes when modifiers are unsupported).
- A test pins the lowered form against the modifier form for `buildReadQueryRegexp`'s inputs.
