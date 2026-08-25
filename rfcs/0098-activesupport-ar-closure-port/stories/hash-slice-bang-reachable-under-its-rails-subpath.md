---
title: "Hash#slice! joins extract! in core-ext/hash/slice.ts at its Rails path"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6499
claim: "2026-08-13T23:57:08Z"
assignee: "converge-strict-loading-violation-signature"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `hash-extract-bang-reachable-under-its-rails-subpath` (#6468),
which created `packages/activesupport/src/core-ext/hash/slice.ts` at the Rails
path for `core_ext/hash/slice.rb` and moved `Hash#extract!` into it.

`vendor/rails/activesupport/lib/active_support/core_ext/hash/slice.rb` defines
**two** methods, `slice!` (lines 10-17) and `extract!` (lines 24-26):

```ruby
def slice!(*keys)
  omit = slice(*self.keys - keys)
  hash = slice(*keys)
  hash.default      = default
  hash.default_proc = default_proc if default_proc
  replace(hash)
  omit
end
```

Only `extract!` moved. `sliceBang` is still an export of the
`hash-utils.ts` aggregate, which has no Rails counterpart — so one Rails file
is split across two TS files, and the one holding half of it is the invented
one.

## Acceptance criteria

- `sliceBang` lives in `packages/activesupport/src/core-ext/hash/slice.ts`
  beside `extractBang`, and is removed from `hash-utils.ts`.
- It mirrors `slice.rb:10-17`: returns the _omitted_ pairs and mutates the
  receiver to hold only the given keys (verify the current body actually does
  this — Rails returns `omit`, not the sliced hash).
- Own-key semantics throughout, matching the `has_key?`/`slice` basis and the
  `Object.hasOwn` guard `extractBang` now uses.
- Existing importers keep working through the flat index; no new re-export
  indirection.
