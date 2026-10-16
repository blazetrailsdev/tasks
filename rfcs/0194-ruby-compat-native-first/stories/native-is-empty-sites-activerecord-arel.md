---
title: "Native .length / Object.keys for isEmpty on proven string, array and plain-object receivers (activerecord, arel)"
status: draft
updated: 2026-10-16
rfc: "0194-ruby-compat-native-first"
cluster: substitution
packages: []
deps: [call-gate-credits-empty-size-on-proven-string-and-hash]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`isEmpty` is called 20 times in `packages/activerecord/src/relation/query-methods.ts`,
5 times in `packages/arel/src/visitors/to-sql.ts` and 4 times in
`packages/activerecord/src/persistence.ts`, along with the other activerecord
and arel sites.

## Acceptance criteria

- [ ] Every site whose receiver is a string, array or plain object becomes `x.length === 0` / `Object.keys(h).length === 0`.
- [ ] Sites whose receiver may be a Map, Set or a class answering `isEmpty` (Errors, Relation, Headers) keep the helper.
- [ ] No new call-mismatch rows.
