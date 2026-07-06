---
title: "Move mysql char/varchar/enum/set string registration to concrete Mysql2/Trilogy adapter"
status: done
updated: 2026-07-06
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 4685
claim: "2026-07-06T16:29:03Z"
assignee: "mysql-string-type-registration-belongs-in-concrete-adapter"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of PR #4668. The mysql char/varchar/enum/set string cast-type
registrations (with the `"1"`/`"0"` boolean-string variant) live in
`AbstractMysqlAdapter#initializeTypeMap` (`abstract-mysql-adapter.ts:~1810-1814`).

In Rails these are registered in the _concrete_ `Mysql2Adapter#initialize_type_map`
(`mysql2_adapter.rb:38-49`, via `register_type(%r(char)i)` + the
`Type.register(:string, adapter: :mysql2)` block, `mysql2_adapter.rb:194-196`),
NOT in `AbstractMysqlAdapter#initialize_type_map`
(`abstract_mysql_adapter.rb:711` — which has no char/varchar/enum/set
registration; a bare abstract mysql adapter has no concrete client to bind to).
Same applies to TrilogyAdapter.

Consequence: a future non-mysql2/non-trilogy concrete adapter subclassing
`AbstractMysqlAdapter` would inherit mysql2-specific string-boolean behavior it
should not. No live bug today (no such subclass exists), but it is a real Rails
deviation worth converging.

## Acceptance criteria

- Relocate the char/varchar/enum/set string cast-type registrations (and the
  mysql `StringType` `"1"`/`"0"` boolean-string variant) from
  `AbstractMysqlAdapter#initializeTypeMap` down to the concrete
  `Mysql2Adapter`/`TrilogyAdapter` `initializeTypeMap`, mirroring
  `mysql2_adapter.rb:38-49`.
- Preserve the `extractLimit` limit-threading added in PR #4668
  (`typeForAttribute(varchar_col).limit === 255`).
- No regression in api:compare / test:compare delta across mysql/mariadb CI.

Hard rules: no `node:*` / `process.*`; async fs only; no new runtime deps;
500 LOC ceiling; single PR from main; test names match Rails verbatim.
