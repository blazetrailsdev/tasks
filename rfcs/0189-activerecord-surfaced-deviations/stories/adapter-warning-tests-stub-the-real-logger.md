---
title: "Adapter warning tests stub Base.logger"
status: draft
updated: 2026-11-20
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10453 moved logger severity predicates onto `isX()`. Three AR adapter warning tests build a bare fake logger (`{ isDebug, isInfo, warn: vi.fn() }`):
`packages/activerecord/test/cases/adapters/abstract-mysql-adapter/warnings.test.ts:46`, `adapters/mysql2/mysql2-adapter.trails.test.ts:259`, `adapters/postgresql/postgresql-adapter.test.ts:748`.
Rails stubs the real logger instead: `assert_called_with(ActiveRecord::Base.logger, :warn, [mysql_warning])` (`vendor/rails/v8.0.2/activerecord/test/cases/adapters/abstract_mysql_adapter/warnings_test.rb:33`).

## Acceptance criteria

- [ ] Each test keeps `Base.logger` and asserts with `assertCalledWith(Base.logger, "warn", [...])` (activesupport method-call-assertions), as Rails does; the fake objects are deleted.
