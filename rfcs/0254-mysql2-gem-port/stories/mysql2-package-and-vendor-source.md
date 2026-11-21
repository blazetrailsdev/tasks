---
title: "Create @blazetrails/mysql2 over the npm mysql2 client and move Mysql2::Error into it"
status: ready
updated: 2026-11-21
rfc: "0254-mysql2-gem-port"
cluster: package
packages: ["mysql2", "activerecord", "scripts"]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:3-4` is
`gem "mysql2", "~> 0.5"; require "mysql2"`, resolved to 0.5.6 by
`vendor/rails/v8.0.2/Gemfile.lock:380`. The gem is vendored (`vendor/sources.ts:423-440`, no
`testPath`) and scored as a package nested in activerecord: `PACKAGE_DIR_OVERRIDES.mysql2` and
`PACKAGE_SRC_SUBDIR.mysql2` (`scripts/api-compare/config.ts:47,118`) point it at
`packages/activerecord/lib/mysql2/`. `packages/activerecord/package.json` carries the `mysql2`
`mirrors` entry and the npm `mysql2` optional peer (`:86`, `:108`).

`packages/activerecord/lib/mysql2/error.ts` (110 lines) ports `lib/mysql2/error.rb` faithfully and
imports only `@blazetrails/ruby-compat`, so it is the part with no I/O and no activerecord import.
It carries two `@noRailsEquivalent PERMANENT` receipts (`DRIVER_ERRORS`, `:3`;
`static [Symbol.hasInstance]`, `:55`) that `mysql2-adapter-calls-the-gem-not-the-npm-connection`
deletes; this story moves them unchanged.

`pnpm parity:api --package mysql2` on `5c15a68516`: 12/33, files 4/7; `em.rb` 0/6, `field.rb` 0/5,
`mysql2.rb` 0/1 (`Util.key_hash_as_symbols`). None of the three is called by activerecord.

Shape and registrations: `packages/pg` (`pg-package-and-vendor-source`, trails#10317) and RFC 0186
§ "Registration cost", items 1 to 8: item 7 too, because activerecord imports the package from this story on.

## Acceptance criteria

- [ ] `packages/mysql2` exists as `@blazetrails/mysql2`: `package.json` (`type: module`, `exports: {"."}`, `files: [dist]`, `build: tsc`, `mysql2` under `peerDependencies` with `peerDependenciesMeta.mysql2.optional: true`, `@blazetrails/ruby-compat` the only workspace dependency at this step), `tsconfig.json`, `README.md` with the RFC's surface table ("only what trails calls").
- [ ] `lib/error.ts` is moved from `packages/activerecord/lib/mysql2/error.ts` by `git mv`; `lib/mysql2.ts` holds the `Mysql2` namespace; `lib/index.ts` re-exports. activerecord's `lib/mysql2/client.ts` imports `Error` / `DRIVER_ERRORS` from `@blazetrails/mysql2`.
- [ ] The `mysql2` entry in `vendor/sources.ts` gains `testPath: "spec/mysql2"`; `vendor/sources.lock.json` and `vendor/sources.test.ts`'s lists are updated. The `mirrors` entry moves from `packages/activerecord/package.json` to `packages/mysql2/package.json`.
- [ ] `mysql2` leaves `PACKAGE_DIR_OVERRIDES` and `PACKAGE_SRC_SUBDIR`; api-compare reads it from `packages/mysql2/lib`. `client.ts`, `result.ts`, `statement.ts` stay in activerecord until `mysql2-client-result-statement-move-to-the-package`, so their members are unscored until then. Expected row after this story: **7/16** (`error.rb` 7/7; `client.rb`'s 8 and `statement.rb`'s 1 unscored); the PR body prints it.
- [ ] `em.rb`, `field.rb` and `mysql2.rb` are `UNPORTED_FILES` rows, and every Ruby-defined method in an enrolled file that activerecord does not call (`client.rb`'s `parse_ssl_mode`, `find_default_ca_path`, `query_info`, `info`; `result.rb`'s `server_flags`) is a `SCOPED_SKIP_GROUPS` entry, each with the reason "not called by activerecord". Check `SCOPED_SKIP_GROUPS` first.
- [ ] `packages/activerecord/package.json` gains `@blazetrails/mysql2` as an optional peer (`peerDependenciesMeta`) and a dev dependency, and `packages/activerecord/dx-tests/tsconfig.json` / `virtualized-dx-tests/tsconfig.json` `paths` and the FileStore lock-worker resolve hook learn it (RFC 0186 § "Registration cost" item 7), so the `Error` import above resolves in this PR.
- [ ] `scripts/guides-typecheck/package.json` gains `"@blazetrails/mysql2": "workspace:*"` under `dependencies` (beside `@blazetrails/pg`, `:55`), and `pnpm-lock.yaml` is updated: `scripts/guides-typecheck/check.ts:150-171` discovers every `packages/*/package.json` and fails the guides check with "missing workspace deps" for any package not declared there.
- [ ] Every other registration in RFC 0186 § "Registration cost" items 1 to 6 and 8 is made for `mysql2`; CI runs the package's tests on the MariaDB lane (own step or activerecord's, per the RFC's open question 1); `.github/workflows/ci.yml` and `scripts/ci-suite-coverage.test.ts` fixture literals change together. `pnpm vitest run scripts/ vendor/` is green. `mysql2` is not added to `GATED_PACKAGES`.

## Verification

```bash
pnpm vitest run packages/mysql2 scripts/ vendor/ && pnpm parity:api --package mysql2
```
