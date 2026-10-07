---
title: "activerecord: the Node inspect hook on ConnectionPool / AbstractAdapter / Aes256Gcm comes from one ruby-compat seam"
status: ready
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-ca-abstract` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`ConnectionPool#inspect` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:278-283`) is ported at its Rails name in
`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`. Beside it the class declares a second member,

```ts
[Symbol.for("nodejs.util.inspect.custom")](): string {
  return this.inspect();
}
```

so that `console.log(pool)`, a vitest failure diff, or a spy matcher prints Rails' `inspect` string
rather than walking the pool's whole object graph (connections, db config, credentials). Rails has no
such member: `Kernel#p` and IRB call `inspect` themselves. The member is `@noRailsEquivalent`.

The same hand-written member exists at two more sites, each with its own `PERMANENT` receipt:
`packages/activerecord/src/connection-adapters/abstract-adapter.ts` (`AbstractAdapter#inspect`,
`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:174-179`) and `packages/activerecord/src/encryption/cipher/aes256-gcm.ts`
(`Cipher::Aes256Gcm#inspect`, `vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/cipher/aes256_gcm.rb:82`). CLAUDE.md § "Ruby protocol
methods with a different JS mechanism" does not list `inspect`, so nothing ratifies a per-class hook.

The runtime's inspect protocol is one fact, and it belongs in one place: ruby-compat already owns
`rbInspect` (`packages/ruby-compat/src/object.ts`). A single seam there that routes the Node inspect
symbol to a class's own `inspect` removes the member from every Rails-matched class.

## Acceptance criteria

- [ ] ruby-compat carries the one bridge from `Symbol.for("nodejs.util.inspect.custom")` to a receiver's `inspect()`, receipted `@noRailsEquivalent PERMANENT` there, with a unit test that `util.inspect`-style dispatch through the symbol prints the `inspect` string.
- [ ] `ConnectionPool`, `AbstractAdapter` and `Cipher::Aes256Gcm` take it from that seam and declare no symbol member of their own; the three `@noRailsEquivalent` receipts are deleted.
- [ ] `pnpm parity:api:extra:gate` green (activerecord rowless), `pnpm parity:api:receipts:gate` green.
- [ ] The vitest spy-matcher case that inspects a `DatabaseConfig`-holding pool still prints the Rails string (no `AdapterNotFound` from walking the graph).

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate && pnpm vitest run packages/activerecord/src/connection-pool.test.ts packages/activerecord/src/connection-pool.trails.test.ts
```
