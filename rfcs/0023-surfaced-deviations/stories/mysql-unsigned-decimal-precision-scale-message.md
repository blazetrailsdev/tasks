---
title: "MySQL unsignedDecimal precision/scale ArgumentError message deviates from Rails ('precision is required' vs Rails 'precision cannot be empty if scale is specified')"
status: ready
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

trails' MySQL `typeToSql` decimal branch
(`packages/activerecord/src/connection-adapters/mysql/schema-creation.ts:147-162`)
validates precision/scale locally:

```ts
case "decimal": {
  const p = options.precision;
  const s = options.scale;
  if (p != null && s != null)       sql = `decimal(${p},${s})`;
  else if (p != null)               sql = `decimal(${p})`;
  else if (s != null)
    throw new ArgumentError(
      "Error adding decimal column: precision cannot be empty if scale is specified",
    );
  else                              sql = "decimal";
  break;
}
```

Two divergences from Rails:

1. **Wrong layer.** Rails raises this in the **abstract**
   `type_to_sql` (`schema_statements.rb:1400`:
   `"Error adding decimal column: precision cannot be empty if scale is
specified"`) so the same check covers every adapter. trails' abstract
   `typeToSql` (`connection-adapters/abstract/schema-creation.ts:307`) instead
   defaults `DECIMAL(${precision ?? 10}, ${scale ?? 0})` and never raises, so
   only the MySQL override enforces the rule — SQLite/PG silently default
   instead of erroring. The validation should move to the abstract layer to
   match Rails (MySQL then only specializes the SQL string + `unsigned`).
2. **Message text** (per the title): confirm the exact string and the
   `numeric`-alias path match Rails — Rails routes `numeric` through the same
   decimal branch, and the MySQL `unsigned` suffix (`schema-creation.ts:173`)
   must compose with the validated precision/scale, not bypass it.

Pre-existing — surfaced auditing the MySQL schema-creation relocation
(sibling of `mysql-foreign-keys-array-columns-and-unquote`), not a regression.

## Acceptance criteria

- [ ] The "precision cannot be empty if scale is specified" `ArgumentError`
      fires from the abstract `typeToSql` decimal/numeric path so all three
      adapters raise identically (match `schema_statements.rb:1400` text
      verbatim).
- [ ] MySQL `typeToSql` no longer reimplements the check; it inherits the
      abstract validation and only adds MySQL-specific SQL (incl. the `unsigned`
      suffix), with precision/scale still honored.
- [ ] Read the Rails test(s) covering decimal-without-precision (e.g.
      `schema_definitions`/migration tests) first; mirror names verbatim.
- [ ] CI green on all three adapters; api:compare / test:compare delta
      non-negative.
