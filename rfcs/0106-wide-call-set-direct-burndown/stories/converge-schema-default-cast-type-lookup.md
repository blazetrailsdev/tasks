---
title: "converge-schema-default-cast-type-lookup"
status: claimed
updated: 2026-08-22
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-22T19:34:59Z"
assignee: "converge-schema-default-cast-type-lookup"
blocked-by: null
closed-reason: null
---

## Context

`AbstractSchemaDumper#schemaDefault`
(`packages/activerecord/src/connection-adapters/abstract/schema-dumper.ts:174-193`)
diverges from Rails
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_dumper.rb:87-95`):

```ruby
def schema_default(column)
  return unless column.has_default?
  type = @connection.lookup_cast_type_from_column(column)
  default = type.deserialize(column.default)
  if default.nil?
    schema_expression(column)
  else
    type.type_cast_for_schema(default)
  end
end
```

trails short-circuits to `schemaExpression(column)` on a null `column.default`
BEFORE the cast-type lookup, guards the lookup behind
`adapter?.lookupCastTypeFromColumn` (the dumper base also runs against hosts
that expose no such method), and adds a `typeCastForSchema(column.default)`
fallback plus a raw `JSON.stringify` / `String()` tail Rails does not have.

This is the last RFC 0047/0084 seed-placeholder row left in
`scripts/api-compare/call-mismatches-exclude/` for `activerecord`
(`connection-adapters/abstract/schema-dumper.json`,
`order:schemaExpression,lookupCastTypeFromColumn`); wave-5c gave it a real
per-site reason but did not converge it, because collapsing the host guard
touches every schema-dumper lane.

## Acceptance criteria

- [ ] `schemaDefault` mirrors `schema_default` line for line: `hasDefault` guard,
      cast-type lookup, `deserialize`, then the nil/non-nil branch — no extra
      fallbacks, no pre-lookup `schemaExpression` short-circuit.
- [ ] The host-without-`lookupCastTypeFromColumn` case is resolved at the seam
      that owns it (the adapter interface), not by an inline optional guard.
- [ ] `connection-adapters/abstract/schema-dumper.json` deleted, not reworded.
- [ ] `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green; SQLite, PostgreSQL and MySQL/MariaDB lanes green.
