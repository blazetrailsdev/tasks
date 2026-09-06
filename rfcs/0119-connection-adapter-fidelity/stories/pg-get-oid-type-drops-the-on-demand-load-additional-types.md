---
title: "pg-get-oid-type-drops-the-on-demand-load-additional-types"
status: ready
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
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

`get_oid_type` loads a missing OID before it fetches
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:854-864`):

```ruby
def get_oid_type(oid, fmod, column_name, sql_type = "")
  if !type_map.key?(oid)
    load_additional_types([oid])
  end
  type_map.fetch(oid, fmod, sql_type) { ... }
end
```

`pg-fetch-type-metadata-async-forces-a-union-on-the-abstract` made
`getOidType` synchronous — `fetch_type_metadata`, `cast_result` and
`new_column_from_field` are all synchronous in Rails, and the async
`getOidType` was the only reason the trails ports were not — so the
`load_additional_types([oid])` arm, which issues a query, could not stay in
the body. It carries
`@missingRailsCall load_additional_types — CONVERGEABLE <this story>` at
`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`.

The behaviour itself is preserved by pre-loading at each of the three callers,
which are all async and all already had (or now have) a "which of these OIDs
is the type map missing?" pass before the loop:

- `postgresql/schema-statements.ts#columns`
- `postgresql/database-statements.ts#castResult`
- `postgresql-adapter.ts`'s result-casting path

so the omission is a decomposition deviation, not a behavioural one: the call
Rails makes inside `get_oid_type` is made by the caller instead.

## Acceptance criteria

- [ ] `getOidType` makes the `load_additional_types([oid])` call Rails makes,
      or the caller-side pre-load is established as the settled shape and the
      receipt is narrowed to `PERMANENT` against a ratified section.
- [ ] No caller-side pre-load loop survives that Rails does not have, if the
      call moves back into `getOidType`.
- [ ] `pnpm parity:api:calls` green; PG lane green.
