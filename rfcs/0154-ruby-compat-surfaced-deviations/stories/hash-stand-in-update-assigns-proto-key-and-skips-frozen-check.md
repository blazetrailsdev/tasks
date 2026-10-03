---
title: "ruby-compat: plain-object Hash mutators besides hashAset re-parent on a __proto__ key and skip the frozen check"
status: draft
updated: 2026-10-03
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8442, which made `hashAset` (`packages/ruby-compat/src/hash.ts`, Ruby
`Hash#[]=`, `vendor/ruby/v3.3.11/hash.c:2018`) store a `__proto__` key as an own data property
instead of running `Object.prototype`'s `__proto__` setter. The other plain-object arms of the Hash
stand-in still assign with `hash[key] = value` and so re-parent the hash on that key: `update` /
`mergeBang` (`hash.ts`, the non-Map arm of `rb_hash_update`, `hash.c:4028`, which Ruby writes
through `rb_hash_aset`, `hash.c:3945`), and any sibling mutator that builds a result object by
assignment (`transformValues`, `slice`, `except`, `dup`). `update` also skips the frozen check
`rb_hash_modify_check` (`hash.c:1602`) that `hashAset` and `hashDelete` make.

## Acceptance criteria

- [ ] Every plain-object write in `hash.ts` goes through `hashAset` (or an equivalent own-property define), so a `__proto__` key is stored and a frozen receiver raises `FrozenError: can't modify frozen Hash`.
- [ ] `hash.trails.test.ts` covers `update` with a `__proto__` key and on a frozen receiver, failing on the current code.
- [ ] `pnpm vitest run packages/ruby-compat/src/hash` green.
