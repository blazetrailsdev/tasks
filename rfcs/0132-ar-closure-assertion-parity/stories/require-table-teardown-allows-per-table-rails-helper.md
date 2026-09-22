---
title: "require-table-teardown lint must allow Rails' per-table drop_table helper"
status: in-progress
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 4
pr: trails#7972
claim: "2026-09-22T16:44:44Z"
assignee: "require-table-teardown-allows-per-table-rails-helper"
blocked-by: null
closed-reason: null
---

## Context

Rails' `PostgresqlUUIDHelper#drop_table(name)` (`vendor/rails/activerecord/test/cases/adapters/postgresql/uuid_test.rb:11-13`)
is called once per table in teardowns (`:397-400`, `:460-464`). trails' lint
`blazetrails/require-table-teardown` (`eslint/require-table-teardown.mjs:243-266`, "Prefer the
dropTable list form") flags any 2+ adjacent `dropTable` calls, including a bare one-name helper
(`<<bare>>` receiver, `:941-959`), and autofixes them into one `dropTable("a", "b", opts)` call. So
a faithful port of a Rails test helper decomposition cannot pass lint (surfaced in trails#7962 review).

## Acceptance criteria

- The rule does not flag a run of bare-receiver `dropTable(name)` calls (a ported Rails test helper),
  or otherwise lets per-table Rails teardown shapes through.
- `uuid.test.ts` restores the `dropTable(name)` helper and Rails' separate teardown calls.
