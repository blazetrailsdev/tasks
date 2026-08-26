---
title: "copy_table strips rename out of the options it forwards to create_table"
status: in-progress
updated: 2026-08-26
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 7093
claim: "2026-08-26T16:41:51Z"
assignee: "table-type-caster-delegations-cast-away-the-null-name"
blocked-by: null
closed-reason: null
---

# `copy_table` strips `rename` out of the options it forwards to `create_table`

## Context

Surfaced converging the `copy_table` call order in PR #7069 (RFC 0051 story
`sqlite-copy-table-columns-hoisted-out-of-create-table-block`). The call-order
half landed; this is a separate divergence in the same body, left untouched
there to keep the PR scoped.

`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:599-602`:

    def copy_table(from, to, options = {})
      from_primary_key = primary_key(from)
      options[:id] = false
      create_table(to, **options) do |definition|

Rails forwards the WHOLE options hash — `:rename` included. That is deliberate,
not an oversight: SQLite3 widens the valid set for exactly this key,
`sqlite3/schema_statements.rb:131-133`:

    def valid_table_definition_options
      super + [:rename]
    end

so `rename:` survives `validate_create_table_options!`
(`abstract/schema_statements.rb:1709-1715`) and is extracted onto the
TableDefinition by `build_create_table_definition`
(`abstract/schema_statements.rb:334`), reaching
`SQLite3::TableDefinition.new` (`sqlite3/schema_statements.rb:135-137`).

trails' `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts#copyTable`
deletes the key before the call instead:

    const { rename: _rename, ...createOptions } = options;
    ...
    await this.createTable(to, { ...createOptions, id: false }, async (td) => {

so the SQLite3 TableDefinition never receives `rename`, and trails'
`validTableDefinitionOptions` override
(`connection-adapters/sqlite3/schema-statements.ts:180-182`) — which is ported,
and does add `"rename"` — is dead for this path, its only Rails caller.

Reachable on every `rename_column`: `sqlite3_adapter.rb:391-394` calls
`alter_table(table_name, rename: {...})`, and `alter_table`'s first
`move_table` forwards `options.merge(temporary: true)` (`:588`) with `:rename`
still in it.

## Converged shape

`copyTable` passes its options through unstripped, as Rails does — set `id:
false` on the hash and forward it whole, so `rename` reaches
`buildCreateTableDefinition`'s extraction and the SQLite3 TableDefinition.

## Acceptance criteria

- [ ] `copyTable` forwards `options` to `createTable` without removing
      `rename`, mirroring sqlite3_adapter.rb:601-602.
- [ ] `rename` reaches `SQLite3::TableDefinition` through
      `validTableDefinitionOptions`, exercising the existing override rather
      than leaving it uncalled.
- [ ] `alter_table`-driven paths stay green: `rename_column`, `change_column`,
      `remove_column`, and the foreign-key/check-constraint carry-over in
      `alter_table`'s `caller` lambda.
- [ ] SQLite lane green; no new `parity:api:calls` / `parity:api:calls:args` rows.
