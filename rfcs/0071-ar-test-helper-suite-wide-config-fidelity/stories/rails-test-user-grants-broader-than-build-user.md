---
title: "Provisioned rails user grants are broader than db:mysql:build_user's"
status: ready
updated: 2026-07-27
rfc: "0071-ar-test-helper-suite-wide-config-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #5448, which provisioned Rails' `rails` test user in the CI
service containers and `docker-compose.yml`.

Rails' `db:mysql:build_user` grants narrowly
(`vendor/rails/activerecord/Rakefile:227-235`):

    GRANT ALL PRIVILEGES ON #{connection["database"]}.* TO 'rails'@'%'
    GRANT ALL PRIVILEGES ON inexistent_activerecord_unittest.* TO 'rails'@'%'

and `db:postgresql:build` (`Rakefile:258-262`) creates no role at all — it just
runs `createdb` as the local user.

trails' provisioning diverges three ways, each justified inline but untracked:

- `GRANT ALL PRIVILEGES ON *.*` instead of the per-database grant
  (`scripts/db-init/mysql/01-rails-user.sql`), because each vitest worker
  creates its own `AR_DB_SLOT` copy of the database.
- an extra `'rails'@'localhost'` user, because `MYSQL_SOCK` is a first-class
  sub-setting here and a socket connection authenticates as `localhost`, which
  `'%'` does not cover.
- a Postgres `rails` role with `CREATEDB SUPERUSER`, plus
  `POSTGRES_HOST_AUTH_METHOD=trust` on the container, since Rails' entries carry
  no credential and a passwordless role cannot otherwise connect over TCP
  (`scripts/db-init/postgres/01-rails-role.sql`).

The `inexistent_activerecord_unittest` grant is subsumed by the global grant
rather than reproduced literally.

## Acceptance criteria

- Confirm whether the privileges can be narrowed to a slot-aware grant (e.g.
  `activerecord_unittest%`) rather than `*.*` / `SUPERUSER`, and whether the
  Postgres role needs `SUPERUSER` at all or only `CREATEDB`.
- Either narrow them, or record the deviation as permanent with the reason.
