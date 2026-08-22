---
title: "Converge in_batches' ignored-order guard onto the arel reader"
status: claimed
updated: 2026-08-22
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-08-22T18:19:59Z"
assignee: "benchmarkable-should-mix-in-logger-reader"
blocked-by: null
closed-reason: null
---

## Context

Rails' `in_batches` guards against a user-supplied ORDER by reading the
relation's own Arel manager (`activerecord/lib/active_record/relation/batches.rb:263`):

```ruby
if arel.orders.present?
  act_on_ignored_order(error_on_ignore)
end
```

trails' `inBatches` (`packages/activerecord/src/relation/batches.ts`) never
calls `arel()` — the only `arel` token in the file is `relation._model.arelTable`
(`batches.ts:393`) — so the ordered-relation guard is driven off something else
than the built manager's `orders`.

The omission is baselined as
`scripts/api-compare/call-mismatches-exclude/activerecord/relation/batches.json`
(`in_batches` -> `arel`), whose reason predates PR #6865: it claims the TS body
"builds the Arel manager via \_buildArel/toArel (the build_arel port that arel()
delegates to)". `toArel` no longer exists — #6865 (story
`fold-to-arel-into-the-arel-reader`, RFC 0107) folded the memo, the connection
acquisition and the `buildArel` call into `arel` itself
(`query_methods.rb:1594-1596`), so `arel()` is now the cheap memoized reader
Rails calls here, and the row's justification no longer holds.

## Converged shape

Read `arel().orders` in `inBatches` exactly where `batches.rb:263` does, then
delete the `in_batches` -> `arel` row from
`call-mismatches-exclude/activerecord/relation/batches.json` (only-shrink; do
not reseed, do not reword the reason) and run `pnpm parity:api:calls:tighten
activerecord/relation/batches.json` for the resulting stale high-water mark.

## Acceptance criteria

- [ ] `inBatches` reads the ordered-relation guard off `arel()`, mirroring
      `batches.rb:262-264`.
- [ ] The `in_batches` -> `arel` baseline row is deleted, not reworded.
- [ ] `pnpm parity:api:calls` / `:args` green with no new rows.
- [ ] Existing batches tests stay green on SQLite, PostgreSQL and MySQL/MariaDB.
