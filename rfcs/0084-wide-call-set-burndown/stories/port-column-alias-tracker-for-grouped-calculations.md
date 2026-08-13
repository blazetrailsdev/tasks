---
title: "Port ColumnAliasTracker#alias_for and drop the invented group_key aliases"
status: done
updated: 2026-08-13
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6460
claim: "2026-08-13T13:36:35Z"
assignee: "converge-async-sum-nil-identity-default"
blocked-by: null
closed-reason: null
---

## Context

`execute_grouped_calculation` aliases its group and aggregate columns through
`ColumnAliasTracker#alias_for`
(`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:527-539`,
tracker at `activerecord/lib/active_record/relation/calculations.rb` /
`column_alias_tracker.rb`): each alias is derived from the compiled field text
(`field.to_s.downcase`) and `"#{operation} #{column_name.to_s.downcase}"`, then
truncated and de-duplicated per connection.

trails' `groupedAggregate` / `groupedCompositeAssoc`
(`packages/activerecord/src/relation/calculations.ts`) instead invent fixed
aliases: `"group_key"` for a lone field, `group_key_0…N` for several, and
`aggregateAliasFor(fn, column)` for the aggregate. The row-reading code, the
belongs_to key-record lookup and the SQLite bigint CAST wrapper all read those
invented names, which is why the tracker was never ported.

PR #6448 converged both arms onto `relation.arel`; the aliasing is the piece
left.

## Converged shape

Port `ActiveRecord::Relation::ColumnAliasTracker` at the Rails name and have
both grouped arms call `alias_for` for the group columns and for
`"#{operation} #{column_name.downcase}"`, keeping the alias values the row
readers use in sync with what is projected.

## Acceptance criteria

- [ ] `ColumnAliasTracker` is ported with `alias_for` and its truncation /
      de-duplication behaviour.
- [ ] `groupedAggregate` and `groupedCompositeAssoc` derive every alias through
      it; `group_key` / `group_key_N` / `aggregateAliasFor` are gone.
- [ ] `calculations.test.ts` and `calculations.trails.test.ts` stay green,
      including the SQLite bigint grouped sum.
