---
title: "ruby-compat: basicObjRespondTo runs core-receiver probes before the prototype walk on every class instance"
status: ready
updated: 2026-10-23
rfc: "0194-ruby-compat-native-first"
cluster: dispatch-cost
packages: []
deps: [writer-spelling-camelize-memo]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`basicObjRespondTo` (`packages/ruby-compat/src/object.ts:599-637`) checks
the string, array, temporal, enumerable and plain-hash tables before it walks
the prototype chain (`:644`). None of them can match a class instance.
Measured on dist: a hit on a prototype method costs 248 ns through
`rbObjRespondTo`, and a miss costs 496 ns. `rbObjRespondTo` has 268 calls
in 143 files.

## Acceptance criteria

- [ ] A receiver that is not a string, array, number, bigint, Map, Set, Date, temporal or plain hash skips straight to the descriptor walk.
- [ ] Every probe keeps its MRI order for the receivers it can match, pinned by a test per probe.
- [ ] Whether a prototype chain defines `respondToMissing` / `isRespondTo` is cached per prototype in a `WeakMap`, so the fast path pays no chain walk after the first call.
- [ ] A dist bench shows a class-instance hit under 80 ns, with the numbers in the PR body.

## Notes

`rb-f-send-cost-on-arel-visit-hot-path` (RFC 0154) covers the twin preamble in
`sendInternal`. Do the two in the same shape.
