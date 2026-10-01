---
title: "join-dependency-instantiate-seen-and-model-cache-are-default-proc-hashes"
status: draft
updated: 2026-10-01
rfc: "0154-ruby-compat-surfaced-deviations"
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

`JoinDependency#instantiate`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/join_dependency.rb:105-115`)
builds its two caches as default-proc Hashes:

```ruby
seen = Hash.new { |i, parent|
  i[parent] = Hash.new { |j, child_class|
    j[child_class] = {}
  }
}.compare_by_identity

model_cache = Hash.new { |h, klass| h[klass] = {} }
parents = model_cache[join_root]
```

and `construct` / `construct_model` read them as `seen[ar_parent][node][id]`
(`:269-271`) and `model_cache[node][id]` (`:281-286`), with the miss path inside
the proc.

trails' `packages/activerecord/src/associations/join-dependency.ts:324-328` uses
plain `Map`s and open-codes each miss at the read site (`:477-484`
`let parentSeen = seen.get(arParent); if (!parentSeen) { … }`, and the same for
`modelCache` in `constructModel`, `:561-565`). That is a different control-flow
shape from Rails, in a body that is otherwise line-for-line.

ruby-compat's `Hash` now carries both halves this needs: the `default_proc` seat
and, since `ruby-compat-hash-keys-by-identity-not-eql`, `compareByIdentity()`
(`packages/ruby-compat/src/hash.ts`, MRI `rb_hash_compare_by_id`,
`vendor/ruby/v3.3.11/hash.c:4427`).

## Acceptance criteria

- `seen` is `new Hash((i, parent) => …).compareByIdentity()` with the nested
  `Hash.new { |j, child_class| j[child_class] = {} }`, and `model_cache` is
  `new Hash((h, klass) => …)`, matching `join_dependency.rb:108-114`.
- `construct` and `constructModel` read `seen.get(arParent).get(node)` and
  `modelCache.get(node)` with no open-coded miss branch, matching
  `join_dependency.rb:269-271,281-286`.
- `model_cache` is NOT `compare_by_identity` in Rails: confirm its `JoinPart`
  keys are safe under `hash` / `eql?` keying, or key it exactly as Rails does.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green; the
  eager-loading test files pass.
