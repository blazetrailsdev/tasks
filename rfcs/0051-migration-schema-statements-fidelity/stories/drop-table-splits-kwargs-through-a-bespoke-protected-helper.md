---
title: "dropTable's kwargs split lives in a protected helper Rails has no counterpart for, and mysql2 duplicates it inline"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6300
claim: "2026-08-09T20:59:21Z"
assignee: "adapter-class-sync-swallows-the-pool-error-rails-raises"
blocked-by: null
closed-reason: null
---

## Context

Noticed while converging `create_table`'s force arm in PR #6284, which reads
through this helper.

Rails' `drop_table` takes Ruby's splat directly and never decomposes the
argument split
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:540-545`):

    def drop_table(*table_names, **options)
      table_names.each do |table_name|
        schema_cache.clear_data_source_cache!(table_name.to_s)
        execute "DROP TABLE#{' IF EXISTS' if options[:if_exists]} #{quote_table_name(table_name)}"
      end
    end

TS has no kwargs, so the port packs the trailing options object into the rest
parameter and splits it back out in a protected helper Rails does not have,
`_splitTableNamesAndOptions`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:461`),
called from three `dropTable` bodies:

- `packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:479`
- `packages/activerecord/src/connection-adapters/mysql/schema-statements.ts:127`
- `packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts:127`

A fourth, `mysql2-adapter.ts:1369`, open-codes the same split inline instead
of calling the helper, so the repo carries both spellings of one Rails
non-concept.

The kwargs gap is a genuine TS shortcoming, but an extra protected member on
the schema-statements surface is the wrong place to absorb it, and the
helper's own JSDoc already frames itself as "shared by dropTable and its
dialect overrides" — an abstraction Rails does not have.

## Converged shape

Adopt the settled trails kwargs idiom for `drop_table`'s
`*table_names, **options` rather than a bespoke protected helper, so each
`dropTable` body reads like the Ruby and the shared member disappears from
the compared surface. Fold `mysql2-adapter.ts`'s inline copy into the same
shape so there is one spelling.

If the helper genuinely cannot go, it must at least be private to the module
rather than a protected class member, and `mysql2-adapter.ts` must stop
duplicating it.

## Acceptance criteria

- [ ] `_splitTableNamesAndOptions` is gone from the schema-statements class
      surface (confirm with `pnpm parity:api:extra --package activerecord`).
- [ ] All four `dropTable` bodies use one spelling of the kwargs split.
- [ ] `dropTable`'s behaviour is unchanged for the `ifExists` / `force` /
      `temporary` options on every adapter.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
