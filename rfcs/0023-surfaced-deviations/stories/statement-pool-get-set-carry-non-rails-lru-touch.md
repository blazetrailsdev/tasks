---
title: "statement-pool-get-set-carry-non-rails-lru-touch"
status: draft
updated: 2026-08-28
rfc: "0023-surfaced-deviations"
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

Surfaced by PR #7159 (RFC 0126, `compare-credits-pinned-operator-spellings`),
which taught `compare.ts` to credit an operator through
`OPERATOR_SPELLING_BY_FQN`. `StatementPool#[]` and `#[]=` became compared pairs
for the first time, and both TS bodies carry statements Rails does not have.

Rails, `activerecord/lib/active_record/connection_adapters/statement_pool.rb:23-35`:

```ruby
def [](key)
  cache[key]
end

def []=(sql, stmt)
  while @statement_limit <= cache.size
    dealloc(cache.shift.last)
  end
  cache[sql] = stmt
end
```

trails, `packages/activerecord/src/connection-adapters/statement-pool.ts:16-34`:

- `get` re-inserts the entry (`cache.delete` then `cache.set`) to move it to the
  end — an LRU touch Rails' `[]` does not perform. Ruby's `Hash` preserves
  insertion order and `shift` evicts the OLDEST inserted, not the least recently
  READ, so the touch changes which statement `[]=` deallocates.
- `set` opens with `this.cache.delete(key)`, which Rails' `[]=` does not do.
  Rails re-assigning an existing key keeps its original insertion position; the
  delete moves it to the end.

The `@missingRailsCall last — PERMANENT` receipt #7159 added on `set` covers
only the missing `Hash#shift.last` call (no JS analogue); the two extra
statements are separate, and neither is language-forced.

## Acceptance criteria

- `get` is `return this.cache.get(key)` — Rails' `cache[key]`, no re-insertion —
  unless a caller depends on the LRU touch, in which case cite the caller and
  block.
- `set` drops the leading `this.cache.delete(key)`.
- Existing statement-pool tests stay green on all three adapters; if one
  encoded the LRU behaviour, read the Rails test first
  (`activerecord/test/cases/` — `pnpm rails:find StatementPool`).
