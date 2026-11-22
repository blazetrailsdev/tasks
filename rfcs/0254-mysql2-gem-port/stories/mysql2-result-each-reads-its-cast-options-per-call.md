---
title: "mysql2-result-each-reads-its-cast-options-per-call"
status: claimed
updated: 2026-11-22
rfc: "0254-mysql2-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-22T14:54:11Z"
assignee: "mysql2-client-default-auth-reaches-the-npm-handshake"
blocked-by: null
closed-reason: null
---

# Result#each reads its cast options per call

## Context

`rb_mysql_result_each` (`vendor/mysql2/0.5.6/ext/mysql2/result.c`) merges its options over the query's and reads `cast`, `cast_booleans`, `database_timezone` and `application_timezone` for each row it fetches. `packages/mysql2/lib/result.ts` `each` reads only `as`: rows are cast once, at query time, by the client's `typeCast`, so options passed to `each` have no effect. The method carries four `@missingRailsCall … CONVERGEABLE` receipts naming this story. They were moved here from `mysql2-client-prepare-prepares-on-the-server` (trails#10556) after `mysql2-result-each-ports-rb-mysql-result-each` (trails#10534) landed without the casting.

## Acceptance criteria

- [ ] `Result#each(opts)` honors `cast`, `castBooleans`, `databaseTimezone` and `applicationTimezone` given to it, e.g. by keeping the raw field values and casting through the client's `cast` on each call.
- [ ] The four receipts on `each` are removed.
- [ ] `result_spec.rb` examples that pass these options to `each` are un-skipped.
