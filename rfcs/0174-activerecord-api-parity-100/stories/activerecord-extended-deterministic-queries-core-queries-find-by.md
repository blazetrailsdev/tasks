---
title: "activerecord: port ExtendedDeterministicQueries::CoreQueries#find_by"
status: done
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: api-surface
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#8368
claim: "2026-10-02T00:39:41Z"
assignee: "activemodel-dirty-init-attributes-arity"
blocked-by: null
closed-reason: null
---

## Context

`encryption/extended_deterministic_queries.rb` scores 12/13; the miss is `CoreQueries#find_by`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/extended_deterministic_queries.rb:128`), which prepends onto the model's
`find_by` to expand encrypted-attribute arguments into their previous-scheme ciphertexts before
calling `super`. trails' `packages/activerecord/src/encryption/extended-deterministic-queries.ts`
covers `RelationQueries` but not `CoreQueries`.

## Acceptance criteria

- [ ] `CoreQueries` is ported as a class module prepended onto the model class (ruby-compat `prepend()`), with `findBy` expanding encrypted args as Rails does.
- [ ] The `extended_deterministic_queries_test.rb` cases that go through `Model.find_by` pass with Rails' assertions.
- [ ] The file scores 13/13.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args
```
