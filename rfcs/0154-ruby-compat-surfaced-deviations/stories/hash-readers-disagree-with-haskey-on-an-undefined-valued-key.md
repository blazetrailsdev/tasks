---
title: "ruby-compat: keys/values/except enumerate an undefined-valued key that hasKey denies"
status: draft
updated: 2026-10-08
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8687 made ruby-compat's `hasKey` (`packages/ruby-compat/src/hash.ts`, Ruby `Hash#key?`,
`vendor/ruby/v3.3.11/hash.c:3671`) answer `false` for an own `undefined`-valued property of a bare
object (prototype `Object.prototype` or none): a JS `null` is Ruby's stored `nil`, and a caller
forwarding an absent keyword writes `{ name: undefined }`. `fetch` and `slice` follow because they
read through `hasKey`.

The rule stops there, so one hash answers two ways:

- `keys`, `eachKey`, `values`, `except`, `compact` and every `Object.entries` loop still enumerate a
  key `hasKey` denies. `keys(h).includes(k)` and `hasKey(h, k)` disagree.
- A class instance and a `Map` still answer for the entry they store.
- A JS spread still carries the key. `coreHashMergeKwd` (`keyword-splat.ts`, MRI
  `core_hash_merge_kwd`, `vendor/ruby/v3.3.11/vm.c:3696`) is the one splat that skips it, used at
  `checkConstraintFor` and `uniqueConstraintFor` only.

The instrumented sweep on trails#8687 (about 29,700 tests) did not cover activerecord's `adapters/`,
`encryption/`, `tasks/`, or trailties outside its generators.

## Acceptance criteria

- [ ] One rule for an `undefined`-valued key across ruby-compat's Hash readers: `keys`, `eachKey`,
      `values`, `except` and the iterating readers agree with `hasKey`, with a test each.
- [ ] The unswept directories are run under the same instrumentation (log every `hasKey` call that
      meets an own `undefined` value) and each hit site is recorded or fixed.
