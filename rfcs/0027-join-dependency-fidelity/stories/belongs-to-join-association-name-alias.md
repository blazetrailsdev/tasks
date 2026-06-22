---
title: "belongs-to-join-association-name-alias"
status: in-progress
updated: 2026-06-22
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 20
pr: 3899
claim: "2026-06-22T17:14:21Z"
assignee: "belongs-to-join-association-name-alias"
blocked-by: null
---

## Context

`relation/predicate_builder_test.rb#test_registering_new_handlers_for_joins`
(`packages/activerecord/src/relation/predicate-builder.test.ts`) is left as a
`BLOCKED` `it.skip` by story `b4-relation-query-tail`.

Custom-handler propagation into a scoped `belongs_to` lambda now works — trails
emits `... ~ 'rails'`. The remaining gap is join-table aliasing:

- Rails: `Reply.joins(:regexp_topic).references(Arel.sql("regexp_topic")).to_sql`
  aliases the joined `topics` table to the association name `regexp_topic`,
  yielding `"regexp_topic"."title" ~ 'rails'`.
- trails: joins on the real table name, yielding `"topics"."title" ~ 'rails'`.

trails only aliases a join table on name collision (mirroring Rails
`alias_candidate`). Rails aliases a differently-named `belongs_to` join to its
association name even without a collision. This is a JoinDependency aliasing
behavior, RFC 0027 (join-dependency-fidelity) territory.

trails: `packages/activerecord/src/associations/join-dependency*.ts`
Rails: `activerecord/lib/active_record/associations/join_dependency.rb`,
`reflection.rb#alias_candidate`

## Acceptance criteria

- [ ] A non-colliding `belongs_to` join whose association name differs from the
      target table name is aliased to the association name (Rails parity).
- [ ] Un-skip `registering new handlers for joins` in
      `relation/predicate-builder.test.ts`; it passes on sqlite/PG/MySQL.
- [ ] No regressions in existing join-dependency aliasing tests.
