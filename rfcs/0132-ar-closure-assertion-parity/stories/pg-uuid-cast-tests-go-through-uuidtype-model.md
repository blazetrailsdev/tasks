---
title: "pg uuid.test.ts cast tests go through UUIDType like uuid_test.rb"
status: claimed
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 5
pr: null
claim: "2026-09-22T17:58:00Z"
assignee: "collection-proxy-extend-super-chain"
blocked-by: null
closed-reason: null
---

## Context

After trails#7962, `packages/activerecord/src/adapters/postgresql/uuid.test.ts` setup mirrors
`vendor/rails/activerecord/test/cases/adapters/postgresql/uuid_test.rb`, but several bodies still
bypass the model:

- `treat blank uuid as nil` / `treat invalid uuid as nil` call `new Uuid().cast(...)`; Rails
  (`uuid_test.rb:104-112`) does `UUIDType.create! guid: ""` then `assert_nil(UUIDType.last.guid)`,
  and `uuid = UUIDType.create! guid: "foobar"; assert_nil(uuid.guid)`.
- `uuid formats` casts via `Uuid#cast`; Rails (`:176-186`) does `UUIDType.create(guid:)` then
  `UUIDType.last.guid`.
- skipped `acceptable uuid regex` casts via `Uuid#cast`; Rails (`:139-174`) does
  `UUIDType.new guid:` + `assert_instance_of String, uuid.guid` (incl. `DuckUUID` with `to_s`).
- `uuid column default` is gated by `itIfSupports("pgcrypto_uuid", ...)` (static
  `support/supports.ts:52` table), while Rails gates on the live
  `connection.supports_pgcrypto_uuid?` (`uuid_test.rb:46-47`).

## Acceptance criteria

- Those bodies go through `UUIDType` exactly as Rails does.
- The column-default test is gated on the live `adapter.supportsPgcryptoUuid()`.
- `uuid_test.rb` stays at 0 assertion mismatches.
