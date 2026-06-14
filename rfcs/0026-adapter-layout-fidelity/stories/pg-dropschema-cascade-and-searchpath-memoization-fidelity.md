---
title: "pg-dropschema-cascade-and-searchpath-memoization-fidelity"
status: draft
updated: 2026-06-14
rfc: "0026-adapter-layout-fidelity"
cluster: adapter-layout
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Two pre-existing Rails deviations surfaced during review of PR #3233 (the
`PostgreSQLSchemaStatements` schema/database/session extraction). Both were
carried in verbatim as part of that pure code-motion story and deliberately
left for a follow-up, because fixing them changes behavior and requires
test-call-site edits that the code-motion story's acceptance criteria forbade.

Both now live in
`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts`.

### 1. `dropSchema` does not unconditionally append `CASCADE`

Rails `drop_schema` always appends `CASCADE`:

```ruby
# activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb
def drop_schema(schema_name, **options)
  execute "DROP SCHEMA#{' IF EXISTS' if options[:if_exists]} #{quote_schema_name(schema_name)} CASCADE"
end
```

Our TS `dropSchema` instead gates `CASCADE` behind an optional `cascade` flag.
As a consequence `createSchema(force: true)` inlines its own
`DROP SCHEMA IF EXISTS … CASCADE` instead of delegating to `dropSchema`, which
is the shape Rails uses (`drop_schema(schema_name, if_exists: true)`).

Fix: make `dropSchema` always append `CASCADE`, drop the `cascade` option from
the signature, and have `createSchema(force: true)` delegate to
`this.dropSchema(name, { ifExists: true })`. Then update the ~20 call sites that
pass `{ cascade: true }` (schema.test.ts, enum.test.ts,
schema-authorization.test.ts) to drop the now-removed option. The existing
drop-schema tests only ever drop empty schemas, so always-CASCADE is
behavior-safe for them.

### 2. `schemaSearchPath` is not memoized

Rails memoizes the search path and invalidates it on assignment:

```ruby
def schema_search_path=(schema_csv)
  if schema_csv
    internal_execute("SET search_path TO #{schema_csv}")
    @schema_search_path = schema_csv
  end
end

def schema_search_path
  @schema_search_path ||= query_value("SHOW search_path", "SCHEMA")
end
```

Our TS `schemaSearchPath` always issues `SHOW search_path`, and
`setSchemaSearchPath` does not update any cached value. Add a
per-adapter-instance cache mirroring Rails (`@schema_search_path`). The cache
must live on the adapter, not the transient `PostgreSQLSchemaStatements`
instance, since `schemaStatements()` builds a fresh instance per call.

## Acceptance criteria

- [ ] `dropSchema` always appends `CASCADE`; `cascade` option removed; `createSchema(force: true)` delegates to `dropSchema`.
- [ ] All `{ cascade: true }` call sites updated; tests green on all three adapters.
- [ ] `schemaSearchPath` memoizes on the adapter instance and `setSchemaSearchPath` updates the memoized value, matching Rails.
- [ ] Test names unchanged.
