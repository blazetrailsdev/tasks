---
title: "transformKeys Map overload types its block string→string; Ruby yields and returns any key"
status: draft
updated: 2026-09-14
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Hash#transform_keys` yields each key as-is (any object, including an
Array) and stores whatever the block returns as the new key. Rails depends on
that at `vendor/rails/activerecord/lib/active_record/encryption/extended_deterministic_queries.rb:48-55`,
where the block maps an Array key to `key.map(&:to_s)`.

trails' `transformKeys` (`packages/activesupport/src/hash-utils.ts:239-261`)
types the block as `(key: string) => string` in every overload, including the
`Map` overload whose keys can be anything. So
`EncryptedQuery.processArguments`
(`packages/activerecord/src/encryption/extended-deterministic-queries.ts`, trails#7757)
has to cast its Rails-shaped block with `as (key: string) => string` and the
result with `as Map<string, unknown> | Record<string, unknown>`.

## Converged shape

The `Map` overload is `transformKeys<K, K2, V>(hash: Map<K, V>, block: (key: K) => K2): Map<K2, V>`.
The plain-object overload keeps string keys (JS objects cannot hold other key types).
Then drop both casts in `processArguments`.

## Acceptance criteria

- `transformKeys`'s Map overload is generic over key and returned-key types.
- `extended-deterministic-queries.ts` calls it with no block or result cast.
