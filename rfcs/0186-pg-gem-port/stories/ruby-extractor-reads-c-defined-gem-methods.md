---
title: "parity: the Ruby extractor reads C-defined gem methods (pg, sqlite3)"
status: draft
updated: 2026-10-08
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/pg/connection.ts` ports the pg gem's `PG::Connection` surface, and `pg` is
an api-compare package over `vendor/pg/v1.5.9/lib/pg` (trails#8687). `scripts/api-compare/extract-ruby-api.rb`
globs `**/*.rb`, so it sees only the members the gem defines in Ruby: of the port's surface that is
`cancel` (`vendor/pg/v1.5.9/lib/pg/connection.rb:597`). `parity:api` reports `pg — 1/89 methods`.

The rest is registered in C and has no extracted counterpart
(`vendor/pg/v1.5.9/ext/pg_connection.c`): `escape_bytea` / `unescape_bytea` (`:4486-4487`,
`:4560-4561`), `status` (`:4518`), `transaction_status` (`:4519`), `socket_io` (`:4525`),
`exec_params` (`:4541`), `prepare` (`:4542`), `exec_prepared` (`:4543`), `async_exec` (`:4547`),
`block` (`:4610`). `pg` is not in `GATED_PACKAGES`, so those members are unscored and unreceipted.
The same holds for the C surfaces of `sqlite3` (`ext/sqlite3/database.c`), `bcrypt` and `msgpack`.

`pgConnection()`, which installs the methods on the npm client, has no gem counterpart at all.

## Acceptance criteria

- [ ] The Ruby extractor reads `rb_define_method` / `rb_define_singleton_method` / `rb_define_alias`
      registrations from a vendored gem's `ext/**/*.c`, so a C-defined method is a Ruby def the TS
      member pairs with.
- [ ] `pg/connection.ts`'s C-defined members pair with `ext/pg_connection.c`, and `pgConnection`
      carries a receipt or is removed.
- [ ] `pg` joins `GATED_PACKAGES` for the extra-surface ratchet once its extras are receipted.
