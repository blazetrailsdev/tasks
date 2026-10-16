---
title: "Call gate: credit Object.hasOwn(h, k) ? h.k : d as two-argument Hash#fetch"
status: draft
updated: 2026-10-16
rfc: "0194-ruby-compat-native-first"
cluster: gate
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`Hash#fetch` "has no native form" (`scripts/parity/ruby-compat.ts:12-14`,
`scripts/api-compare/compare.ts:344`). Its two-argument arm on a plain object
with a literal key is exactly `Object.hasOwn(h, "k") ? h.k : default`: a stored
`nil` / `false` returns the stored value, and a miss returns the default.
`fetch` has 100 calls in 65 files.

## Acceptance criteria

- [ ] The TS extractor marks a `hasOwn` ternary with its literal key (`enumerable-idioms.ts` `NATIVE_HASH_FORM_SPELLINGS`).
- [ ] `NATIVE_FORM_ANALOGUES` has a `fetch` row with `creditedKinds: hash`, and it requires two Ruby arguments and no block.
- [ ] The one-argument (KeyError) and block arms stay helper-only, with a test for each.
- [ ] CLAUDE.md's hash table `fetch` row is updated in the same PR.
