---
title: "compute_cache_version should call quote_column_name, type_for_attribute, to_fs and first"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: 4
pr: 6663
claim: "2026-08-17T18:08:11Z"
assignee: "compute-cache-version-makes-rails-calls"
blocked-by: null
closed-reason: null
---

# `compute_cache_version` should make Rails' calls

## Context

Surfaced finishing `wave-1b-relation-own-file-rows-remainder` (PR #6563),
which converged `cache_key` / `compute_cache_key` but not this one — its body
is long and the PR hit its ceiling.

Rows still baselined in `activerecord/relation.json` (`kind: "set"`):

    compute_cache_version -> first, quote_column_name, to_fs, type_for_attribute

(`compute_cache_version -> with_connection` is RFC 0073 pool-checkout
divergence and is NOT in scope.)

Rails `Relation#compute_cache_version`,
`activerecord/lib/active_record/relation.rb:471-520`:

    def compute_cache_version(timestamp_column)
      timestamp_column = timestamp_column.to_s
      if loaded?
        size = records.size
        if size > 0
          timestamp = records.map { |record| record.read_attribute(timestamp_column) }.max
        end
      else
        collection = eager_loading? ? apply_join_dependency : self
        with_connection do |c|
          column = c.visitor.compile(table[timestamp_column])
          select_values = "COUNT(*) AS #{model.adapter_class.quote_column_name("size")}, MAX(%s) AS timestamp"
          ...
          size, timestamp = c.select_rows(arel, nil).first
          if size
            column_type = model.type_for_attribute(timestamp_column)
            timestamp = column_type.deserialize(timestamp)
          else
            size = 0
          end
        end
      end
      if timestamp
        "#{size}-#{timestamp.utc.to_fs(cache_timestamp_format)}"
      else
        "#{size}"
      end
    end

trails' `computeCacheVersion` (`packages/activerecord/src/relation.ts`)
hand-rolls the loaded-branch max with a `toInstant` bridge and the unloaded
branch's projection, so it never calls `quote_column_name`,
`type_for_attribute` (it does not deserialize through the column type at
all), `to_fs` for the timestamp format, or `first` on the result rows.

## Converged shape

Rails' body line for line: `quote_column_name("size")` for the projection
alias, `.first` on the selected rows, `model.type_for_attribute(...)
.deserialize(timestamp)` for the value, and `timestamp.utc.to_fs(
cache_timestamp_format)` for the rendered half.

Note `type_for_attribute` never raises in trails — it returns a nil type for
an unknown attribute — so the deserialize arm needs no guard Rails lacks.

## Acceptance criteria

- [ ] Each of the four calls is made where Rails makes it, verified against
      relation.rb:471-520.
- [ ] Rows deleted by hand (via `serializeBaseline`), then
      `pnpm parity:api:calls:tighten activerecord/relation.json`. No reseed.
- [ ] `pnpm parity:api:calls` / `:args` green; all three adapter lanes green.
- [ ] `collection-cache-key.test.ts` and `cache-key.test.ts` stay green.
