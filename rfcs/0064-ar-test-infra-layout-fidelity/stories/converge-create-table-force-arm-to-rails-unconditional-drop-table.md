---
title: "converge-create-table-force-arm-to-rails-unconditional-drop-table"
status: done
updated: 2026-08-09
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6287
claim: "2026-08-09T16:19:35Z"
assignee: "converge-create-table-force-arm-to-rails-unconditional-drop-table"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of PR #6284
(`converge-ddl-schema-cache-recording-into-the-ported-ddl-bodies`), which
converged `create_table`'s cache-clear branch but left the `force:` arm's
invented guard in place.

Rails' `create_table` force arm is one unconditional call
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:304`):

    if force
      drop_table(table_name, force: force, if_exists: true)
    else
      schema_cache.clear_data_source_cache!(table_name.to_s)
    end

The port
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:408`)
wraps it in an existence probe Rails does not have and splits it into two
call sites that both drop the `ifExists` kwarg:

    if (options.force) {
      if (await this.tableExists(name)) {
        if (options.force === "cascade") {
          await this.dropTable(name, { force: "cascade" });
        } else {
          await this.dropTable(name);
        }
      }
    }

Three divergences in five lines: the `tableExists` round-trip (an extra query
per forced create, which inflates `assertQueries` counts), the branch on
`force === "cascade"` where Rails forwards `force:` through, and the missing
`if_exists: true`.

## Converged shape

One `dropTable(name, { force: options.force, ifExists: true })` call, no
`tableExists` probe. `dropTable`'s options type currently spells
`force?: "cascade"`, so it has to widen to Rails' `force` (`boolean |
"cascade"`) — the PG/SQLite overrides only act on the `:cascade` value, so
widening is type-level only.

Removing the probe changes query counts; re-run the `assertQueries`-bearing
schema/migration suites on all three lanes.

## Acceptance criteria

- [ ] `create_table`'s force arm is a single unconditional
      `dropTable(name, { force, ifExists: true })`, matching
      `schema_statements.rb:304`.
- [ ] The `tableExists` probe and the `force === "cascade"` branch are gone.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
