---
title: "activesupport: reverseMerge / reverseMergeBang drop the other hash's keys when the receiver is a Hash"
status: draft
updated: 2026-10-05
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

Found while widening `AttributeSet`'s `Attributes` type to admit a Marshal-loaded `Hash`
(`attribute-set-hash-returns-admit-a-marshal-loaded-hash`).

`reverseMerge` / `reverseMergeBang` (`packages/activesupport/src/hash-utils.ts:342-362`) are
written for a plain object only. Given a ruby-compat `Hash` (a `Map`) receiver they pass the
`instanceof Map` guard and then spread it (`{ ...otherHash, ...obj }` copies no Map entry) and
walk `Object.keys(hash)` / `Object.entries(merged)`, so a `Hash` receiver ends up unchanged and
the other hash's keys are dropped:

```ts
const a = new Hash<string, number>();
a.set("x", 1);
const b = new Hash<string, number>();
b.set("x", 9);
b.set("y", 2);
reverseMergeBang(a, b);
hashAref(a, "y"); // null, Ruby answers 2
```

Rails: `reverse_merge` is `other_hash.to_hash.merge(self)` and `reverse_merge!` is
`replace(reverse_merge(other_hash))`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/hash/reverse_merge.rb:14-20`).
ruby-compat already has either-arm `merge` and `hashReplace` (`packages/ruby-compat/src/hash.ts`).

The reachable caller is `AttributeSet#reverse_merge!`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set.rb:100-102`,
`packages/activemodel/src/attribute-set.ts`), whose `attributes` is a `Hash` on a Marshal-loaded
set.

## Acceptance criteria

- [ ] `reverseMerge` is `merge(toHash(otherHash), hash)` and `reverseMergeBang` is
      `hashReplace(hash, reverseMerge(hash, otherHash))`, over ruby-compat's either-arm `merge` /
      `hashReplace`, for a plain-object, `Hash` and mixed pair.
- [ ] A `.trails.test.ts` case covers a `Hash` receiver, a `Hash` argument, and
      `AttributeSet#reverseMergeBang` over two Hash-held sets; each fails on the current body.
- [ ] `pnpm parity:api:calls` stays green for `core_ext/hash/reverse_merge.rb`.
