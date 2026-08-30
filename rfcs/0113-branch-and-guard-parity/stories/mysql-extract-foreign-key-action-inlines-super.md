---
title: "mysql-extract-foreign-key-action-inlines-super"
status: draft
updated: 2026-08-30
rfc: "0113-branch-and-guard-parity"
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

`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/schema_statements.rb:225-227`
is a one-line override that defers to the abstract implementation:

```ruby
def extract_foreign_key_action(specifier)
  super unless specifier == "RESTRICT"
end
```

trails (`packages/activerecord/src/connection-adapters/mysql/schema-statements.ts`,
`extractForeignKeyAction`) keeps the `RESTRICT` guard but then **inlines** the
abstract body instead of calling `super`:

```ts
export function extractForeignKeyAction(specifier: string): "cascade" | "nullify" | undefined {
  if (specifier === "RESTRICT") return undefined;
  switch (specifier) {
    case "CASCADE":
      return "cascade";
    case "SET NULL":
      return "nullify";
    default:
      return undefined;
  }
}
```

That is a second copy of `abstract/schema_statements.rb:1775-1781`, which trails
already ports at
`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1774`
— including the `"restrict"` arm the MySQL copy drops from its return type.
Two consequences: the abstract's case list can drift from the MySQL copy
silently, and the MySQL return type is narrower than the method it shadows.

Surfaced while converging the sibling `fetch_type_metadata` in the same file
(PR #7270, story `mysql-fetch-type-metadata-lookupcasttype-is-optional`), which
had the identical shape — a hand-rolled second implementation where Rails calls
`super`. That one converged onto
`BaseSchemaStatements.prototype.fetchTypeMetadata.call(this, sqlType)`; this is
the same fix, one method down. Left out of #7270 to keep that PR to its claimed
stories.

## Converged shape

`extractForeignKeyAction` becomes the `RESTRICT` guard plus a `super` call,
spelled the way the sibling now spells it:

```ts
export function extractForeignKeyAction(
  this: ...,
  specifier: string,
): "cascade" | "nullify" | "restrict" | undefined {
  if (specifier === "RESTRICT") return undefined;
  return BaseSchemaStatements.prototype.extractForeignKeyAction.call(this, specifier);
}
```

Note the return type widens to include `"restrict"` (unreachable through this
guard, but it is the abstract method's type).

## Acceptance criteria

- [ ] `extractForeignKeyAction` contains no `case "CASCADE"` / `case "SET NULL"`
      of its own; the abstract implementation is the only copy.
- [ ] The `RESTRICT` guard is kept, as `rb:226` keeps it.
- [ ] MySQL/MariaDB foreign-key reflection suites pass.
- [ ] `pnpm parity:api:calls` / `:args` green with no new rows.
