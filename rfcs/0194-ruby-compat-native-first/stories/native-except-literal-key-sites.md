---
title: "Native rest-destructure at literal-key Hash#except sites on plain objects"
status: ready
updated: 2026-10-22
rfc: "0194-ruby-compat-native-first"
cluster: substitution
packages: []
deps: [native-form-analogue-for-hash-except-rest-destructure]
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`except` has 39 calls in 28 files. The 2026-10-16 audit measured
`except(h, "a")` at 382 ns and `const { a, ...rest } = h` at 159 ns on dist.

## Acceptance criteria

- [ ] Every site on a plain object with literal keys reads `const { k1, k2, ...rest } = h`.
- [ ] Map, Hash, computed-key-list and receiver-answered sites keep the helper. The PR body lists them, each with its reason.
- [ ] No new call-mismatch or call-args rows.
