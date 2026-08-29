---
title: "StatementPool#has is invented surface alongside the ported key?"
status: claimed
updated: 2026-08-29
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-08-29T11:52:35Z"
assignee: "association-helpers-extracted-for-the-collection-proxy"
blocked-by: null
closed-reason: null
---

## Context

Rails' `StatementPool` exposes exactly one membership predicate,
`key?` (`activerecord/lib/active_record/connection_adapters/statement_pool.rb:19-21`):

```ruby
def key?(key)
  cache.key?(key)
end
```

trails' `StatementPool` (`connection-adapters/statement-pool.ts`) carries
BOTH the ported `isKey` and a novel `has`, with `isKey` delegating to `has`.
`pnpm parity:api:extra --package activerecord` reports
`connection-adapters/statement-pool.ts — 1 novel`, and `has` is that one.

PR #7077 deleted the other two novel names on this class (`setMaxSize`, the
`maxSize` reader), taking the file from 3 novel to 1. `has` is what is left.

## Converged shape

Delete `has`, fold its one-line body (`this.cache.has(key)`) into `isKey` so
the class reads as `statement_pool.rb:19-21`, and point every caller at
`isKey`. Grep first: `has` has trails-only callers (tests included) that must
move over rather than keep a compatibility alias — an alias is the same novel
name under a different justification.

## Acceptance criteria

- [ ] `has` is gone; `isKey` carries the `cache.key?` body directly.
- [ ] No caller (production or test) references `pool.has`.
- [ ] `pnpm parity:api:extra --package activerecord` reports
      `connection-adapters/statement-pool.ts — 0 novel`.
- [ ] All three lanes green.

## Provenance

Surfaced while converging `statement-pool-setmaxsize-is-invented` (PR #7077),
which removed the other two novel names on this file.
