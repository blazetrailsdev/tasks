---
title: "Drop the trails-only schema: option from disableExtension"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: disableExtension is Rails' (name, { force?: 'cascade' }) at postgresql-adapter.ts:3649, with no schema option in ExtensionStatements (abstract/schema-statements.ts:249) or Migration#disableExtension (migration.ts:896)."
---

## Context

`PostgreSQLAdapter#disableExtension` accepts a `schema` option
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:3743-3760`)
that Rails does not have. Rails' signature is
`disable_extension(name, force: false)`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:486`);
extensions are global in PG, so `DROP EXTENSION` takes only the extension name
and the schema-qualified prefix is discarded.

Surfaced while typing the migration delegations in PR #5774: the option had to
be carried into the new `ExtensionStatements` interface
(`connection-adapters/abstract/schema-statements.ts`) and into
`Migration#disableExtension`, because the adapter already accepts it. Removing
it there was out of scope for that story.

## Acceptance criteria

- [ ] Determine whether any caller (tests included) passes `schema:` to
      `disableExtension`; if so, converge those call sites to Rails' form.
- [ ] Drop `schema` from `PostgreSQLAdapter#disableExtension`, from
      `ExtensionStatements`, and from `Migration#disableExtension`, leaving
      `{ force?: "cascade" }`.
- [ ] `pnpm typecheck` clean; PG extension tests green.
