---
title: "PG type_cast answers Binary::Data with a Buffer where Rails returns { value:, format: 1 }"
status: done
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8745
claim: "2026-10-10T03:39:38Z"
assignee: "schema-dumper-header-branches-on-the-ts-js-dump-language"
blocked-by: null
closed-reason: null
---

## Context

Rails' `PostgreSQL::Quoting#type_cast`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:169-187`)
answers a `Type::Binary::Data` with a bind-param hash:

```ruby
when Type::Binary::Data
  { value: value.to_s, format: 1 }
```

The port (`packages/activerecord/src/connection-adapters/postgresql/quoting.ts`, `typeCast`) answers

```ts
const u8 = value.toString();
return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength);
```

a Node `Buffer`, which `pg` sends as a binary parameter. The arm count matches Rails (trails#8621
left the body at Rails' five arms), so no arms or call gate flags it; the divergence is the returned
value's shape and the `Buffer` global in a ported body.

## Acceptance criteria

- [ ] `typeCast(BinaryData)` returns `{ value: value.toString(), format: 1 }`, and the layer that
      hands binds to the `pg` client turns that hash into a binary parameter, where Rails' `pg` gem
      reads `format: 1`.
- [ ] No `Buffer` reference remains in `postgresql/quoting.ts`.
- [ ] `adapters/postgresql/bytea.test.ts` stays green on the PG lane, prepared statements on and off.
