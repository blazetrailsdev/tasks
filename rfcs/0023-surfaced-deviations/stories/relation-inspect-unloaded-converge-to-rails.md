---
title: "relation-inspect-unloaded-converge-to-rails"
status: done
updated: 2026-06-22
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 40
pr: 3885
claim: "2026-06-22T14:51:58Z"
assignee: "relation-inspect-unloaded-converge-to-rails"
blocked-by: null
---

## Context

trails' `Relation#inspect` deviates from Rails for the **unloaded** relation.

Rails (`vendor/rails/activerecord/lib/active_record/relation.rb:1289`):

```ruby
def inspect
  subject = loaded? ? records : annotate("loading for inspect")
  entries = subject.take([limit_value, 11].compact.min).map!(&:inspect)
  entries[10] = "..." if entries.size == 11
  "#<#{self.class.name} [#{entries.join(', ')}]>"
end
```

Rails **always executes the query** (blocking on DB I/O even when unloaded) and
prints the resulting records as `#<User [#<User id: 1>, ...]>`.

trails (`packages/activerecord/src/relation.ts`, `inspect()` ~L1389):

- Loaded path (`this._loaded`): faithful — prints records.
- **Unloaded path: a trails invention.** Because a synchronous JS method cannot
  block on async DB I/O, it falls back to a **query-chain representation** —
  `User.all.where("...").order("...").limit(5)` — emitting each clause as its
  own fragment.

This unloaded chain repr is the _sole reason_ a "render a WhereClause to SQL"
helper exists anywhere in the codebase. PR #3559 (story
`where-clause-tosql-via-arel`) removed the bespoke `WhereClause#toSql` and moved
that glue to a private `_whereClauseToSql` in `relation.ts` next to its only
consumer (this inspect branch). If the unloaded path is converged to Rails (or
removed), `_whereClauseToSql` — and the `.where("sql")`/`.order(...)`/`.limit`
chain-fragment rendering it feeds — disappear entirely.

## Acceptance criteria

- Decide and document the convergence approach for the unloaded `inspect` path:
  either (a) execute synchronously to match Rails' record-printing output, or
  (b) ratify the chain repr as an explicit, documented sync-JS deviation with a
  clear rationale (per project policy, prefer converge over ratify — see
  `feedback_deviation_stories_always_converge`).
- If converging: unloaded `inspect` prints records like the loaded path /
  Rails, and the `_whereClauseToSql` helper + the `.where/.order/.limit`
  chain-fragment rendering in `relation.ts` are removed.
- `ruby-inspect.test.ts` reflects the chosen behavior; test names that map to
  Rails inspect tests stay verbatim.
- api:compare / test:compare deltas non-negative.

## Notes

- Rails source: `vendor/rails/activerecord/lib/active_record/relation.rb:1289`.
- trails: `packages/activerecord/src/relation.ts` `inspect()` (~L1389) and the
  private `_whereClauseToSql` helper (~L174).
- The synchronous-vs-async tension is the crux: JS `inspect`/`toString` must
  return a string synchronously, so a faithful "execute then print records"
  path needs a synchronous query mechanism (or an accepted async deviation).
