---
title: "Native hasOwn ternary at two-argument literal-key Hash#fetch sites on plain objects"
status: draft
updated: 2026-10-16
rfc: "0194-ruby-compat-native-first"
cluster: substitution
packages: []
deps: [native-form-analogue-for-two-arg-hash-fetch]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`fetch` has 100 calls in 65 files. Only the two-argument, literal-key,
plain-object sites can switch.

## Acceptance criteria

- [ ] Those sites read `Object.hasOwn(h, "k") ? h.k : d`.
- [ ] One-argument, block, Map/Hash, caller-supplied-key and receiver-answered (`LazyAttributeHash#fetch`, `Cache::Store#fetch`) sites keep the helper.
- [ ] No new call-mismatch or call-args rows.
