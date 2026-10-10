---
title: "Element access credits Hash#[] and Hash#[]= wherever hashAref / hashAset do"
status: draft
updated: 2026-10-10
rfc: "0000-native-js-hash-forms"
cluster: gate
packages: []
deps: [native-hash-form-marks-in-ts-extractor]
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

`hashAref` and `hashAset` (`packages/ruby-compat/src/hash.ts:406`, `:433`)
port `rb_hash_aref` / `rb_hash_aset`. `[]` and `[]=` are operators, not names
in `scripts/parity/ruby-compat.ts`. The comparer spells them through
`scripts/api-compare/operator-order-spelling.ts`: the default TS spelling of
`[]` is `get` and of `[]=` is `set`, and the note at `:79-90` records that
those are "the names ruby-compat's `hashAref` / `hashAset` send a non-Hash
receiver's `[]` / `[]=` to". The extractor tokenizes a native element access as
`ref:get` and an element-access write as `assign:computed`
(`scripts/api-compare/extract-ts-api.ts:6177-6183`).

So `h[k]` is probably already equivalent to `hashAref(h, k)` for every gate.
"Probably" is not enough to start 53 substitutions on (28 `hashAref` lines, 25
`hashAset`). This story proves it and fixes what does not hold.

## Acceptance criteria

- [ ] For one real body per package that calls `hashAref` and one that calls
      `hashAset` (activemodel has 13 and 16 lines), rewrite the call to the
      native form on a scratch branch and record what each of
      `parity:api:calls`, `:calls:args`, `:arms:throws` and the order report
      does. Put the table in the PR body.
- [ ] Where a gate moves, teach the comparer the equivalence so that
      `h[k]` ≡ `hashAref(h, k)` and `h[k] = v` ≡ `hashAset(h, k, v)` in the
      call set, the argument gate (`refKeysEqual`,
      `scripts/api-compare/call-args.ts:263`) and the order stream. Comparer
      tests pin each.
- [ ] `h.k` (property access with a literal key) is covered as well as `h[k]`,
      since a port of `options[:public]` writes `options.public`.
- [ ] The `operator-order-spelling.ts:79-90` note is updated to say native
      element access is the default port and the helpers are the dispatching
      form.
- [ ] A dropped `[]` is still flagged wherever it is flagged today: a negative
      test with the read removed.
- [ ] No baseline row added.

## Notes

If the investigation finds nothing moves, the story is the tests and the note,
well under its estimate. That is a fine outcome; say so in the PR.
