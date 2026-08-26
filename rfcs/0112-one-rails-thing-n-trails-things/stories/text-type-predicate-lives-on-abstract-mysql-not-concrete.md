---
title: "text_type? lives on AbstractMysqlAdapter where Rails puts it on Mysql2Adapter"
status: draft
updated: 2026-08-26
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails defines `text_type?` on the CONCRETE adapters, not on
`AbstractMysqlAdapter`:

- `activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:140-142`
- `activerecord/lib/active_record/connection_adapters/trilogy_adapter.rb:148-150`

Both bodies are `TYPE_MAP.lookup(type).is_a?(Type::String) ||
TYPE_MAP.lookup(type).is_a?(Type::Text)`, and the constant they name is the
concrete class's own `TYPE_MAP` (`mysql2_adapter.rb:53`). The sole caller is
`AbstractMysqlAdapter#new_column_definition_from_column`
(`abstract_mysql_adapter.rb:428`), which reaches it through `self` — Ruby
resolves it on the concrete subclass at call time.

trails puts it on `AbstractMysqlAdapter` instead
(`connection-adapters/abstract-mysql-adapter.ts`, `isTextType`). PR #7077
converged the BODY onto Rails' — it now reads
`(this.constructor as typeof AbstractMysqlAdapter).TYPE_MAP.lookup(type)`,
which resolves the concrete map exactly as Ruby's constant lookup does — but
left the method in the wrong file, so `parity:api` scores it as `moved` on
`abstract-mysql-adapter.ts` rather than matched on `mysql2-adapter.ts`.

## Converged shape

Move `isTextType` to `Mysql2Adapter` (`mysql2-adapter.ts`), where
`mysql2_adapter.rb:140-142` puts it, keeping the body as-is minus the
`this.constructor` indirection — on the concrete class `Mysql2Adapter.TYPE_MAP`
is the direct spelling of Ruby's `TYPE_MAP`. The `abstract_mysql_adapter.rb:428`
caller keeps calling `this.isTextType(...)`; declare it on the
`AbstractMysqlAdapter` side only as the type seam TypeScript needs for that
call, since Ruby needs no declaration there.

## Acceptance criteria

- [ ] `isTextType` lives in `mysql2-adapter.ts`, matching
      `mysql2_adapter.rb:140-142`.
- [ ] `abstract-mysql-adapter.ts`'s `moved` count drops by one and
      `mysql2-adapter.ts` gains a matched name;
      `pnpm parity:api:extra --package activerecord` does not grow.
- [ ] MySQL lane green (`ARCONN=mysql2`).

## Provenance

Surfaced while converging `mysql-native-type-map-converges-onto-type-map`
(PR #7077), which rewrote this body onto `TYPE_MAP.lookup` but kept its
file placement.
