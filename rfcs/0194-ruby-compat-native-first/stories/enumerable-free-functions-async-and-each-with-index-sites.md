---
title: "enumerable-free-functions-async-and-each-with-index-sites"
status: draft
updated: 2026-10-26
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The bundle PR for `enumerable-free-functions-remaining-sites` converted the sync
`each_with_object` sites at `postgresql_adapter.rb:532` (`enumTypes`) and
`preloader/association.rb:47` (`loadRecordsForKeys`) to ruby-compat's
`eachWithObject`. These remain (vendor/rails/v8.0.2/activerecord/lib/active_record/):

- `core.rb:289` (`find_by`): the block takes a non-local `return super`, so it
  needs the `iterBreak`-style escape or stays a loop with a cited reason.
- `mysql/database_statements.rb:67` (`combine_multi_statements`) and
  `preloader/through_association.rb:12,99`: the block awaits, so they need an
  async `eachWithObject` form in `packages/ruby-compat/src/enumerable.ts`.
- `fixtures.rb:788` (block awaits `FixtureSet::File.open`), `persistence.rb:616`
  (plain-object receiver: entries form), `postgresql/schema_statements.rb:25`
  (String memo, which a JS primitive cannot be mutated through).
- `calculations.rb:575` (`each_with_object({}).with_index`).
- every `each_with_index` site (43 in Rails lib) — needs an `eachWithIndex`
  free function — and the `sort_by!` sites (`query_logs.rb:177`,
  `preloader/through_association.rb:33`, `sqlite3_adapter.rb:433`,
  `abstract_mysql_adapter.rb:489`).
- the `each_with_object` sites outside activerecord (52 across Rails lib).

## Acceptance criteria

- [ ] Each site above uses the ruby-compat free function (`eachWithObject`, an
      async form, `eachWithIndex`, a bang `sortBy` form), or carries a cited
      language-forced reason for staying a loop.
- [ ] Any baseline row these conversions make stale is deleted and tightened.
