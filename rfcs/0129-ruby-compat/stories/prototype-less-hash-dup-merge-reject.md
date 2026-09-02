---
title: "prototype-less-hash-dup-merge-reject"
status: draft
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A Ruby Hash has no ancestors: `h["toString"]` is nil and `h["__proto__"] = v`
stores an ordinary key. `hasKey` (`packages/ruby-compat/src/hash.ts:43-48`)
already documents this against `rb_hash_has_key` (`vendor/ruby/hash.c:3671`),
and PR #7383 converged three of the Hash-returning exports onto it after a
review found `transform_values` silently dropping a `__proto__` key:

- `transformValues` and `slice` build with `Object.create(null)`
  (`rb_hash_transform_values`, `vendor/ruby/hash.c:3366`).
- `except` dups with `Object.assign(Object.create(null), hash)`
  (`rb_hash_except`, `vendor/ruby/hash.c:2683`, which deletes from a
  `hash_dup_with_compare_by_id`).

Three siblings in the same file still return a plain-`{}`-prototyped hash:

- `merge` (`hash.ts:82-87`) — `{ ...hash }`, MRI `rb_hash_merge`
  (`vendor/ruby/hash.c:4144`) is `rb_hash_update` over `rb_hash_dup`.
- `reject` (`hash.ts:133-135`) — `{ ...hash }`, MRI `rb_hash_reject`
  (`vendor/ruby/hash.c:2626`) is `delete_if` over a dup.
- `dup`'s plain-object arm (`hash.ts:302-305`) — `{ ...hash }`, MRI
  `rb_hash_dup` (`vendor/ruby/hash.c:1584`).

An object spread preserves an own `__proto__` key (it defines rather than
sets), so these do not lose data the way `transform_values` did; what they
return is a hash that answers `result["toString"]` with a function. They were
left out of #7383 to keep its blast radius bounded — `merge` has many call
sites across the repo.

## Converged shape

`rb_hash_merge` and `rb_hash_reject` both start from `rb_hash_dup`, so the
convergence is one place: give `dup`'s plain-object arm the prototype-less
copy, and have `merge` and `reject` call `dup(hash)` instead of spreading —
which is also a call-parity win, since both Ruby bodies name the dup.

## Acceptance criteria

- `dup`'s plain-object arm returns a prototype-less hash; `merge` and `reject`
  route through it rather than `{ ...hash }`.
- A `__proto__` / `toString` case on each of the three, in
  `packages/ruby-compat/src/hash.trails.test.ts`, alongside the ones #7383
  added for `transform_values`, `slice` and `except`.
- All three AR lanes green — `merge` is on widely-travelled paths.
- `pnpm parity:api:calls` non-negative; `parity:api:extra:gate` unchanged
  (ruby-compat is pinned at `novel: 0`).
