---
title: "fold-to-arel-into-the-arel-reader"
status: in-progress
updated: 2026-08-22
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6865
claim: "2026-08-22T17:19:56Z"
assignee: "fold-to-arel-into-the-arel-reader"
blocked-by: null
closed-reason: null
---

## Context

Rails' `QueryMethods#arel` IS the memo, the connection acquisition and the
`build_arel` call (`activerecord/lib/active_record/relation/query_methods.rb:1594-1596`):

```ruby
def arel(aliases = nil)
  @arel ||= with_connection { |c| build_arel(c, aliases) }
end
```

trails' `arel` (`packages/activerecord/src/relation/query-methods.ts:2069`) is a
bare delegation to a trails-only `toArel`
(`packages/activerecord/src/relation.ts:1648`), which holds all three. Story
`converge-toarel-onto-with-connection-acquisition` (RFC 0107, PR #6756) landed
the `with_connection` port _inside_ `toArel`; it did not retire `toArel` itself,
so the delegation — and the two call-set flags it raises (`build_arel`,
`with_connection`) — are still standing.

Those two flags were baseline rows in
`scripts/api-compare/call-mismatches-exclude/activerecord/relation/query-methods.json`
until `wave-5b-head-sweep` (RFC 0106) migrated them to `@missingRailsCall`
tags at `query-methods.ts:2055,2062`. Their reasons name this story.

`toArel` has ~20 non-test callers, most of them in `relation.ts`
(`:1116,1123,1764,1859,1924,2019,2115,2866`), which is why the fold is its own
PR rather than a drive-by.

## Converged shape

Fold the memo, `withConnection` acquisition and `buildArel` call into `arel`
itself, retire `toArel`, and repoint its callers at `arel(...)` — the Rails
name, which is what every one of those Ruby call sites spells.

## Acceptance criteria

- [ ] `arel` holds the memo, the connection acquisition and the `buildArel`
      call, mirroring `query_methods.rb:1594-1596`.
- [ ] `toArel` is gone; no caller in `packages/*/src` names it.
- [ ] Both `@missingRailsCall` tags at `query-methods.ts:2055,2062` are deleted,
      not reworded.
- [ ] `pnpm parity:api:calls` / `:args` green with no new baseline rows.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
