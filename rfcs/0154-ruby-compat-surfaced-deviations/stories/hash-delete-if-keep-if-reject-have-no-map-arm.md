---
title: "ruby-compat: Hash#delete_if / keep_if / reject have no Map arm; reject dups through rb_obj_dup, not hash_dup_with_compare_by_id"
status: draft
updated: 2026-10-05
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8534, which gave `eachValue` and `except` a Map arm. Three sibling
functions in `packages/ruby-compat/src/hash.ts` still take and walk a plain object only, so a
`Hash` (a `Map`, which is what `Marshal.load` and `Hash.new` answer) reads as empty:

- `deleteIf` — `rb_hash_delete_if` (`vendor/ruby/v3.3.11/hash.c:2564`).
- `keepIf` — `rb_hash_keep_if` (`vendor/ruby/v3.3.11/hash.c:2844`).
- `reject` — `rb_hash_reject` (`vendor/ruby/v3.3.11/hash.c:2626`), which is
  `hash_dup_with_compare_by_id` (`hash.c:1563`) then `rb_hash_foreach(result, delete_if_i, …)`.
  trails' body is `deleteIf(dup(hash), block)`: it goes through `dup` (`rb_obj_dup`, which keeps
  the receiver's class and `default`) where MRI allocates a bare `rb_cHash`. PR 8534 added the
  module-private `hashDupWithCompareById` that `except` now uses; `reject` should call it too.

Separately, `dup` (`rb_hash_dup`, `hash.c:1584`) tests `hash instanceof Hash`, so a bare `Map`
that is not a ruby-compat `Hash` falls into the plain-object arm and copies no entries, where
every other Map arm in the file tests `instanceof Map`.

## Acceptance criteria

- [ ] `deleteIf`, `keepIf` and `reject` walk a Map-backed receiver's own table, as
      `rb_hash_foreach` does, and `reject` dups through `hashDupWithCompareById` on both arms
      (answering a bare `Hash` with no `default`, the receiver's `compare_by_identity` kept).
- [ ] `dup` of a bare `Map` copies its entries, or its signature refuses one.
- [ ] A trails test in `hash.trails.test.ts` pins each arm, checked against `ruby`
      (`Hash.new(7).tap { _1[:a] = 1 }.reject { false }.default` is `nil`).
