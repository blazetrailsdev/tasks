---
title: "slice inplace with an array key over a Hash receiver, not a stub"
status: ready
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`test_slice_inplace_with_an_array_key`
(`vendor/rails/activesupport/test/core_ext/hash_ext_test.rb:352-358`) builds
`{ :a => "x", :b => "y", :c => 10, [:a, :b] => "an array key" }` and asserts
`original.slice!([:a, :b], :c) == { a: "x", b: "y" }` — the point is that an
ARRAY key is an ordinary key, kept when named and untouched otherwise.

The trails port
(`packages/activesupport/src/core-ext/hash-ext.test.ts:250-254`) is a stub: it
calls `slice`, not `sliceBang`, drops the array key entirely, and asserts only
`Object.keys(result)).toHaveLength(2)`. Its sibling `slice inplace`
(`:240-248`) was converged to the real `slice!` assertions in
`hwia-to-hash-returns-ruby-compat-hash`; this one was left because a JS object
literal cannot carry an Array key at all.

`@blazetrails/ruby-compat`'s `Hash extends Map` CAN
(`packages/ruby-compat/src/hash.ts:257`), and `sliceBang`
(`packages/activesupport/src/core-ext/hash/slice.ts:16-36`) now has a `Hash`
arm, so the receiver Rails' test needs exists.

## Converged shape

Port the test over a `Hash` receiver whose fourth key is the actual array
`["a", "b"]`, asserting both halves Rails asserts: the returned omitted pairs
and the replaced receiver. Keep the test name verbatim —
`parity:test` matches on it.

Note the assertion COUNT must match Rails' (one `assert_equal`); an extra
`expect` reds `scripts/test-compare/lint-assertion-mismatches.ts`, which is how
this PR first went red. Any TS-only assertion belongs in
`hash-ext.trails.test.ts`.

## Acceptance criteria

- `slice inplace with an array key` calls `sliceBang` and carries an Array key.
- It fails on the current body (which never calls `slice!`).
- `pnpm parity:test` delta non-negative and the assertion-mismatch ratchet
  stays at or below its mark.
