---
title: "activerecord: compute_cache_version takes a required timestamp_column"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Noticed while auditing `packages/activerecord/src/relation.ts` for trails#8391.

Rails' `compute_cache_version` takes a required parameter
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:472`):

```ruby
def compute_cache_version(timestamp_column) # :nodoc:
```

The port declares `async computeCacheVersion(timestampColumn = "updated_at")`. The default is
invented: every Rails caller passes the column (`cache_version`, `relation.rb:465-470`;
`compute_cache_key`, `relation.rb:443-452`). The arity gate does not flag a default Rails lacks,
so nothing registers it.

The same body seeds `let size: unknown = 0` and `let timestamp: unknown = null` before the
`if loaded?` branch. Rails assigns `size` and `timestamp` only inside the arms
(`relation.rb:475-507`), so they are `nil` until then.

## Acceptance criteria

- [ ] `computeCacheVersion(timestampColumn)` takes a required parameter, as `relation.rb:472` does; every caller still passes one.
- [ ] `size` and `timestamp` are assigned where Rails assigns them, with no seeded `0`, unless the PR body shows the seed is what Rails' `nil` reads as at the use site (`relation.rb:509-513`).
- [ ] `pnpm parity:api:calls`, `:calls:args` and `:params` green; `collection-cache-key.test.ts` green.

## Verification

```bash
pnpm vitest run packages/activerecord/src/collection-cache-key.test.ts && pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params
```
