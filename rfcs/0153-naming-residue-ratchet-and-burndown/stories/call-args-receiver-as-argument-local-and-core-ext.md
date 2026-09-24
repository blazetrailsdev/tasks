---
title: "call-args-receiver-as-argument-local-and-core-ext"
status: in-progress
updated: 2026-09-24
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 41
pr: trails#8038
claim: "2026-09-24T16:14:07Z"
assignee: "missing-rails-name-receipt-on-mixin-object-function-unmatched"
blocked-by: null
closed-reason: null
---

## Context

Found while burning down the activerecord relation slice (`naming-residue-burndown-activerecord-relation`). Two rows stay `burndown` after every rename, because the Ruby and TS recorders disagree on whether a call's receiver is an argument. No rename can clear either one.

1. **A local receiver is recorded as a Ruby argument.** `vendor/rails/activerecord/lib/active_record/relation.rb:1213`, `relation.to_sql` inside `to_sql`'s `apply_join_dependency` block, is recorded as `to_sql(ref:relation)`. TS `Relation#toSql` (`packages/activerecord/src/relation.ts`) calls `conn.toSql(manager)`, recorded as `to_sql(ref:manager)`. This is the same recorder shape as `call-args-recorder-self-call-receiver-as-argument`, but the receiver is a block-local, not a bare self-call. Before this PR `relation.aggregate_column(column_name)` (`relation/calculations.rb:478`) recorded `(ref:relation, ref:columnName)`. It matches now only because the TS free function `aggregateColumn(relation, columnName)` happens to take the receiver first.
2. **A core_ext receiver becomes the TS function's first argument.** `relation/finder_methods.rb:432`, `name.pluralize(not_found_ids.size)`, records `pluralize(ref:size)` with the receiver dropped. TS `pluralize(name, notFoundIds.length)` (`relation/finder-methods.ts`, `raiseRecordNotFoundExceptionBang`) records `(ref:name, ref:length)`. Position 0 then pairs `size` with `name` and classifies as `burndown`. Every ActiveSupport `String#` inflection ported as a free function in `@blazetrails/activesupport/core-ext/string/inflections` has this shape.

Both rows inflate the repo-wide convergeable count (RFC 0153 §5). They cannot be receipted, because `burndown` is not permanent.

## Acceptance criteria

- [ ] The recorders agree on receivers. Either the Ruby recorder stops emitting a local receiver as a positional `ref:`, or the TS side emits it the same way. Covers `relation.to_sql` → `conn.toSql(manager)`.
- [ ] A free-function port of a core_ext method (`pluralize(name, n)` for `name.pluralize(n)`) pairs its first TS argument with the Ruby receiver, not with Ruby's first argument. It is classified or aligned so the row is no longer `burndown`.
- [ ] Recorder / classifier unit tests cover both shapes.
- [ ] `relation.ts#toSql` `to_sql` and `relation/finder-methods.ts#raiseRecordNotFoundExceptionBang` `pluralize` re-measure as matched or as a permanent class.
