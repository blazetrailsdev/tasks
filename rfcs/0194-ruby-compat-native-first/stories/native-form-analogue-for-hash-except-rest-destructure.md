---
title: "Call gate: credit a literal-key rest-destructure as Hash#except"
status: done
updated: 2026-10-22
rfc: "0194-ruby-compat-native-first"
cluster: gate
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#9260
claim: "2026-10-22T23:05:33Z"
assignee: "native-analogues-array-calls"
blocked-by: null
---

## Context

`Hash#except` is a receiver-keyed ruby-compat credit
(`scripts/parity/ruby-compat.ts`, `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS`) with
no native analogue. `const { a, b, ...rest } = h` is the same operation for
literal keys on a plain object. Measured on dist, `except(h, "a")` is 382 ns
and the destructure is 159 ns. `except` has 39 calls in 28 files.

## Acceptance criteria

- [ ] The extractor marks a rest-destructure with its literal keys, and `NATIVE_FORM_ANALOGUES` credits `except` on a `hash` kind.
- [ ] `slice` is NOT credited, because it skips absent keys and an object literal does not. A test pins this.
