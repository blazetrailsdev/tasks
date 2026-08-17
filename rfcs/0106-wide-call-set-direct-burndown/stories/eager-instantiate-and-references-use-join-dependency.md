---
title: "instantiate_records and references_eager_loaded_tables? should use the join dependency / build_joins"
status: closed
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Premise gone: both cited rows are absent from origin/main scripts/api-compare/call-mismatches-exclude/activerecord/relation.json. 'instantiate_records -> instantiate' and 'references_eager_loaded_tables? -> build_joins, order:map,flatMap' no longer appear in the 18-entry baseline (retired during the wave-1/wave-2 PRs #6563/#6584). The only references_eager_loaded_tables? row left is '-> empty?', which carries a reviewed per-site reason (Ruby Array#- + Array#empty? has no TS callee) and belongs to ruby-empty-predicate-has-no-ts-call-spelling."
---

# `instantiate_records` and `references_eager_loaded_tables?` should use the join dependency Rails uses

## Context

Surfaced finishing `wave-1b-relation-own-file-rows-remainder` (PR #6563).
Both rows need the eager-load path restructured, which did not fit that PR.

Rows still baselined in `activerecord/relation.json` (`kind: "set"`):

    instantiate_records            -> instantiate
    references_eager_loaded_tables? -> build_joins, order:map,flatMap

Rails `Relation#instantiate_records`,
`activerecord/lib/active_record/relation.rb:1455-1464`:

    def instantiate_records(rows, &block)
      return [].freeze if rows.empty?
      if eager_loading?
        records = @_join_dependency.instantiate(rows, strict_loading_value, &block).freeze
        @_join_dependency = nil
        records
      else
        model._load_from_sql(rows, &block).freeze
      end
    end

trails' `instantiateRecords` (`packages/activerecord/src/relation.ts`) has
only the non-eager arm — `rows.map((row) => this.model._instantiate(row))` —
because eager loading is materialized elsewhere (`_executeEagerLoad`), so
there is no `@_join_dependency` to instantiate through.

Rails `Relation#references_eager_loaded_tables?`,
`relation.rb:1474-1488`:

    def references_eager_loaded_tables?
      joined_tables = build_joins([]).flat_map do |join|
        if join.is_a?(Arel::Nodes::StringJoin)
          tables_in_string(join.left)
        else
          join.left.name
        end
      end
      joined_tables << table.name
      (references_values - joined_tables).any?
    end

trails hand-rolls the joined-table set from `_namedInnerJoins` /
`_leftOuterJoinsValues` via `_resolveAssocTables` instead of calling
`build_joins([])`, so the two can drift.

## Converged shape

`instantiateRecords` carries both arms, with the eager arm instantiating
through the relation's stored join dependency and clearing it, as Rails
does. `referencesEagerLoadedTables` calls `buildJoins([])` and derives the
joined-table set from the returned join nodes.

## Acceptance criteria

- [ ] Both bodies make the calls Rails makes, verified against
      relation.rb:1455-1464 and :1474-1488.
- [ ] Rows deleted by hand (via `serializeBaseline`), then
      `pnpm parity:api:calls:tighten activerecord/relation.json`. No reseed.
- [ ] `pnpm parity:api:calls` / `:args` green; all three adapter lanes green.
- [ ] Eager-load and `includes`/`references` suites stay green — this path is
      the one Postgres rejects when the projection is mixed
      ("column must appear in the GROUP BY clause") and SQLite silently allows,
      so a green SQLite run is not sufficient evidence here.
