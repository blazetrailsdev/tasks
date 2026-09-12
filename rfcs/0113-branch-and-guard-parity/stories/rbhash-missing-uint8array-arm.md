---
title: "rbHash drops the rb_str_hash byte arm rbEqual has, so equal binaries hash apart"
status: draft
updated: 2026-09-12
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rbHash` (`packages/ruby-compat/src/rb-hash.ts`) has no `Uint8Array` arm, so a
binary value falls through to `identityHash` — while `rbEqual`
(`packages/ruby-compat/src/rb-equal.ts`, the `Uint8Array` arm) compares it by
bytes. That breaks Ruby's `hash`/`eql?` contract (`vendor/ruby/object.c:4375`;
a Ruby binary String hashes by bytes, `vendor/ruby/string.c:3629`
`rb_str_hash`): two `==` binaries land in different buckets.

Surfaced in trails#7720: `JoinDependency#_keyFor`
(`packages/activerecord/src/associations/join-dependency.ts`) buckets composite
ids with `rbHash` + `rbEqual`, so a composite primary key containing a binary
column will not dedupe across independently allocated equal values. The fix was
pulled out of that PR as out of scope for its activerecord story.

## Acceptance criteria

- `rbHash` hashes a `Uint8Array` by its bytes, placed beside the `rbEqual`
  `Uint8Array` arm's semantics.
- A ruby-compat test asserts `rbHash(new Uint8Array([1, 2])) === rbHash(new Uint8Array([1, 2]))`.
- An activerecord test covers a composite key with an independently allocated
  equal `Uint8Array` collapsing to one parent in `JoinDependency#instantiate`.
