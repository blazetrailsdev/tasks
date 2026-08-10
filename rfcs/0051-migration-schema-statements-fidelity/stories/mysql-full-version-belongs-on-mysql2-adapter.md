---
title: "fullVersion sits on AbstractMysqlAdapter, not Mysql2Adapter where Rails puts it"
status: done
updated: 2026-08-06
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6145
claim: "2026-08-05T23:40:20Z"
assignee: "mysql-full-version-belongs-on-mysql2-adapter"
blocked-by: null
closed-reason: null
---

## Context

Rails puts `full_version` on `Mysql2Adapter`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/mysql2_adapter.rb:164-166`):

```ruby
def full_version
  database_version.full_version_string
end
```

trails has the single definition on `AbstractMysqlAdapter`
(`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts:387`)
instead, because Rails reaches it from the abstract class by duck typing and TS
needed a declared member. It is marked `@internal` and cited at the call site.

The blocker that justified it has weakened: PR #6143 gave `getFullVersion` a
per-adapter shape (`Mysql2Adapter#getFullVersion` reads the driver's handshake
banner and overrides the abstract stub, which now returns `Promise<string |
null>`). The same override shape is available to `fullVersion`.

## Converged shape

- `fullVersion()` is defined on `Mysql2Adapter`, at mysql2_adapter.rb:164-166's
  position in the file.
- `AbstractMysqlAdapter` keeps only whatever declaration TS needs for its own
  callers (e.g. `isMariadb`, abstract-mysql-adapter.ts:399) — if a declared
  member is still required there, it carries the language-shortcoming citation
  and the real body lives on the concrete adapter, matching how
  `getFullVersion` is now split.

## Acceptance criteria

- [ ] `fullVersion` lives on `Mysql2Adapter` per mysql2_adapter.rb:164-166.
- [ ] Any residual abstract declaration is minimal and cited at the call site.
- [ ] `pnpm parity:api` / `pnpm parity:api:extra` deltas non-negative.
- [ ] MySQL/MariaDB lanes green.
