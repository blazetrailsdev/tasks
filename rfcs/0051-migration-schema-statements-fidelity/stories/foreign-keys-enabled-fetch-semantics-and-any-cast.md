---
title: "foreign_keys_enabled? uses ?? semantics where Rails uses Hash#fetch, behind an as-any cast"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6262
claim: "2026-08-08T20:45:03Z"
assignee: "date-start-argument-and-reform-surface-absent"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6258 while converging `SchemaCreation#useForeignKeys` onto the
connection. That PR made `SchemaStatements#useForeignKeys` read
`supportsForeignKeys() && isForeignKeysEnabled()`, matching
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1545-1547`.
The `enabled` half it now leans on is still not Rails' expression.

Rails (`abstract/schema_statements.rb:1783-1785`):

```ruby
def foreign_keys_enabled?
  @config.fetch(:foreign_keys, true)
end
```

trails (`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`,
the `isForeignKeysEnabled()` body):

```ts
isForeignKeysEnabled(): boolean {
  const adapter = this as any;
  return adapter._config?.foreignKeys !== false;
}
```

Two divergences, both from the settled `fetch` vs `??` conversion class:

1. **A stored `nil` inverts.** `Hash#fetch(:foreign_keys, true)` returns the
   _stored_ value whenever the key exists, including a stored `nil` — which is
   falsy, so Ruby disables foreign keys. trails' `!== false` answers `true` for a
   stored `null`, so the same configuration _enables_ them. A config that names
   `foreign_keys` explicitly as null is the one input the two disagree on, and it
   flips DDL emission: `use_foreign_keys?` gates `add_foreign_key` /
   `remove_foreign_key` (`schema_statements.rb:1174,1215,1766`) and the inline
   `REFERENCES` the visitor renders (`schema_creation.rb:57`).

2. **The `as any` cast.** `_config` is protected on `AbstractAdapter`, so the
   predicate launders its receiver through `any` to read it. PR #6258 removed the
   sibling cast in `useForeignKeys` by giving `SchemaStatements` the typed call;
   this one was left because it reads a field rather than calling a method.

Prior story `foreign-keys-enabled-reads-adapter-config` (done) fixed a different
bug in the same line — it read `adapter.config`, which never existed, making the
predicate inert. It moved the read to `_config` and did not revisit the `fetch`
semantics or the cast.

## Converged shape

`isForeignKeysEnabled()` returns the _stored_ value when the key is present and
`true` only when it is absent — Ruby's `fetch` with a default, not a
null-coalesce — and reads `_config` through a typed member rather than `as any`.
Note the name: `foreign_keys_enabled?` is a bare-adjective predicate, so
`isForeignKeysEnabled` is the sanctioned `is*` fallback per
`docs/ruby-ts-conventions.md:20` and should NOT be renamed (unlike its verb-led
neighbour `use_foreign_keys?`, renamed to `useForeignKeys` in #6258).

## Acceptance criteria

- [ ] `isForeignKeysEnabled()` mirrors `@config.fetch(:foreign_keys, true)`:
      a present key yields its stored value's truthiness (a stored `null`
      disables), an absent key yields `true`.
- [ ] The `as any` cast is gone; `_config` is reached through a typed member.
- [ ] A test pins the stored-`null` arm — it is the input that distinguishes the
      two expressions, and no current test covers it
      (`abstract/schema-statements-on-adapter.test.ts` covers absent and `false`).
- [ ] Green on sqlite (file lane), `sqlite3_mem`, PG and MariaDB.
