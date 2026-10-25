---
title: "inline-single-use-helpers-remainder"
status: draft
updated: 2026-10-25
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
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

`inline-single-use-collection-and-string-helpers` converged only `deleteSuffix`
(`activejob/src/queue-adapter.ts`, now `name.replace(/Adapter$/, "")`). Each
remaining helper failed a check when inlined:

- `insert` (`ruby-compat/src/array.ts`) in `actionpack/src/action-dispatch/middleware/stack.ts`
  `move` / `moveAfter`: a native `splice` raises two `parity:api:calls` rows (Rails
  `middleware_stack.rb` calls `insert`); the gate does not credit `splice` as `insert`.
- `upcase` in `rack/src/method-override.ts`: `toUpperCase()` drops the
  `ArgumentError` for invalid UTF-8 that `method-override.test.ts`
  "sets rack.errors for invalid UTF8 \_method values" asserts.
- `min` (`comparable.ts`) has a second importer, `activesupport/src/enumerable-utils.ts:12`.
- `tally`, `reduce(…, ":merge")`, `transformValuesBang`, `rbStrInclude`
  (receiver may be a `Uint8Array`), `rbStrSub` (Ruby `\1` backrefs vs JS `$1`),
  `rbStrRpartition`, `printf`: no native form without adding arms or changing semantics.

## Acceptance criteria

- [ ] Either teach the call gate to credit the native form (e.g. `splice` for `insert`), or close each remaining helper as staying in ruby-compat.
- [ ] `parity:api:calls` / `calls:args` / `extra:gate` green with no new baseline row.
