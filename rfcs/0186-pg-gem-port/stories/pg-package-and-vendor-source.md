---
title: "Create @blazetrails/pg over node-pg and vendor ruby-pg: the namespace, constants and error classes"
status: draft
updated: 2026-10-08
rfc: "0186-pg-gem-port"
cluster: package
packages: ["pg", "scripts"]
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:3-4` is `gem "pg", "~> 1.1"; require "pg"`, resolved to `pg (1.5.9)` by
`vendor/rails/v8.0.2/Gemfile.lock:412`. The gem is not vendored (`vendor/sources.ts` has no `pg`
source) and trails has no package for it.

This story creates `packages/pg` shaped like `packages/msgpack` (trails#8591) and lands the parts
with no I/O: the `PG` namespace, `PG::Constants` and the error classes.

- Constants the adapter names, all C in `ext/pg.c`: `CONNECTION_OK` (`:367`), `PQTRANS_IDLE`
  (`:422`), `PQTRANS_INTRANS` (`:426`), `PQTRANS_INERROR` (`:428`), `PG_DIAG_SEVERITY` (`:531`),
  `PG_DIAG_SQLSTATE` (`:550`), `PG_DIAG_MESSAGE_PRIMARY` (`:555`), `PG_DIAG_SOURCE_FUNCTION`
  (`:608`). `PG::Constants` is a module (`:350`) included into `Connection` and `Result`.
- Errors: `PG::Error < StandardError` (`ext/pg_errors.c:78`, `lib/pg/exceptions.rb:9-10`,
  `initialize(msg=nil, connection: nil, result: nil)`), attrs `connection` / `result`
  (`pg_errors.c:84-85`), `PG::ServerError` (`:87`), `PG::UnableToSend` (`:88`),
  `PG::ConnectionBad` (`:89`), `PG::FeatureNotSupported` (`ext/errorcodes.def:49-50`, SQLSTATE
  `0A000`).
- trails re-declares the constants locally at `packages/activerecord/src/connection-adapters/postgresql-adapter.ts:144-150` and
  `packages/activerecord/src/connection-adapters/postgresql/database-statements.ts:253-255`.

Registrations, from what trails#8591 touched: see RFC 0186-pg-gem-port § "Registration cost",
items 1 to 6 and 8.

## Acceptance criteria

- [ ] `vendor/sources.ts` gains source `pg` (`https://github.com/ged/ruby-pg.git`, ref `v1.5.9`, package `pg`, `libPath: "lib/pg"`, `libEntryFile: "lib/pg.rb"`, `testPath: "spec/pg"`), with a comment citing `Gemfile.lock:412`; `vendor/sources.lock.json` and `vendor/sources.test.ts`'s lists are updated; `pnpm vendor:fetch` populates `vendor/pg/v1.5.9/`.
- [ ] `packages/pg` exists as `@blazetrails/pg`: `package.json` (`type: module`, `exports: {"."}`, `files: [dist]`, `build: tsc`, `pg` under `peerDependencies` with `peerDependenciesMeta.pg.optional: true`, `@blazetrails/ruby-compat` the only workspace dependency), `tsconfig.json`, `README.md` stating rule 1 (only what trails calls) with the surface table.
- [ ] `src/namespaces.ts`, `src/pg.ts` (`PG::Constants` with exactly ten constants: the eight above, which Rails names, plus `PQTRANS_ACTIVE` (`ext/pg.c:424`) and `CONNECTION_BAD` (`ext/pg.c:369`), which Rails does not name but `transaction_status` and `status` return), `src/exceptions.ts` (`Error`, `ServerError`, `UnableToSend`, `ConnectionBad`, `FeatureNotSupported`, with `connection` / `result` readers), `src/index.ts`.
- [ ] Every registration in RFC § "Registration cost" items 1 to 6 and 8 is made; `pnpm vitest run scripts/ vendor/` and `pnpm parity:test:assertions` are green. The `assertion-mismatch-mark.json` row is added by hand.
- [ ] `packages/activerecord/src/connection-adapters/postgresql-adapter.ts:144-150` and `packages/activerecord/src/connection-adapters/postgresql/database-statements.ts:253-255` import the constants from the package; the local consts are deleted. The README's surface table lists `PQTRANS_ACTIVE` and `CONNECTION_BAD` with the method that returns each, per rule 1.
- [ ] CI: the package's tests run on the PostgreSQL lane, not Leaf Tests, from this first PR, because everything after this story needs a server. `.github/workflows/ci.yml` and `scripts/ci-suite-coverage.test.ts`'s fixture literals are updated together.
- [ ] `pnpm parity:api` prints a `pg` row. The package is not added to `GATED_PACKAGES` yet.

## Verification

```bash
pnpm vitest run packages/pg scripts/ vendor/ && pnpm parity:api
```

## Notes

`PG::Error` is defined in both C and Ruby. Until `c-ext-method-table-extractor-arm` lands, only
the Ruby half scores; do not receipt the C half in the meantime, leave it as reported extra.
