---
title: "activerecord: QueryCache#select_all tests arel.locked and compiles inside the cached arm"
status: draft
updated: 2026-10-04
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left open by trails#8482.

Rails' `QueryCache#select_all`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/query_cache.rb:236-253`)
tests `@query_cache&.enabled? && !(arel.respond_to?(:locked) && arel.locked)` first, calls
`to_sql_and_binds(arel, binds, preparable)` only inside that arm, and otherwise calls `super` with the
original arguments.

trails' `selectAll` (`packages/activerecord/src/connection-adapters/abstract/query-cache.ts:300-336`) calls
`toSqlAndBinds` before the test, decides "locked" by matching the compiled SQL against a `LOCKED_QUERY`
regexp (`query-cache.ts:13`), and forwards the compiled SQL and rebuilt options to `super` on the uncached
arm. The short-circuit projection of `pnpm parity:api:arms:report --package=activerecord` reports
`-and +or +or +or +or +or +or` for the pair.

## Acceptance criteria

- [ ] The cached-arm guard is `rbObjRespondTo(arel, "locked") && arel.locked`, and `LOCKED_QUERY` is deleted.
- [ ] `toSqlAndBinds` is called inside the cached arm only, with Rails' three arguments.
- [ ] The uncached arm forwards the original `arel`, `name`, `binds` and options to `super`.
- [ ] The query-cache suites pass on every adapter lane, including the Rails cases for locked relations.
