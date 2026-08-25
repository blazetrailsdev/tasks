---
title: "activerecord-quoted-date-through-date-package"
status: done
updated: 2026-08-06
rfc: "0088-date-gem-port"
cluster: null
deps: ["route-temporal-imports-activerecord"]
deps-rfc: []
est-loc: 250
pr: 6152
claim: "2026-08-06T13:43:09Z"
assignee: "activerecord-quoted-date-through-date-package"
blocked-by: null
closed-reason: null
---

## Context

**"Date functions flow through the date package, as in Rails" — the ActiveRecord
quoting layer.**

Rails' `ConnectionAdapters::Quoting#quoted_date` (`abstract/quoting.rb`) formats
a time for SQL by calling `value.to_fs(:db)` — ActiveSupport's `core_ext` on the
`date` gem's `Time`, i.e. one shared formatter. PostgreSQL overrides it to append
a BC suffix and otherwise calls `super`.

Trails spreads this across adapter files with their own formatting:

- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts:3475`
  `quotedDate` (BC-suffixing), consuming `pgQuotedDate` (`:29`)
- `connection-adapters/abstract/quoting.ts:155-160` — the Temporal-type dispatch
  into `dispatchQuotedDate`
- the sqlite3 / mysql quoting files
- `activerecord/src/insert-all.ts:724` notes the `type_cast` → `quoted_date` path

Once `packages/date` owns `strftime` and the temporal types, these should format
through it rather than each carrying its own rendering, so the SQL a date
produces has one definition.

**This story does not change emitted SQL.** It is a convergence of _where the
formatting lives_. Any SQL change is a bug in the story, not a feature of it.

## Acceptance criteria

- [ ] `quotedDate` and its adapter overrides format through `packages/date`
      rather than hand-rolled rendering.
- [ ] PG's BC-suffix override still calls into the shared path the way Rails'
      `super` does (`postgresql-adapter.ts:3467,3481`).
- [ ] **Emitted SQL is byte-identical.** Verify with the existing quoting tests on
      all three adapter lanes before and after; paste the diff (empty) in the PR
      body.
- [ ] The `instanceof` rejection guards at `quoting.ts:162,219` are **unchanged** —
      they are the JS-`Date` convention working correctly and are not this
      story's target.
- [ ] `pnpm parity:api:calls` clean — this touches ported method bodies, so the
      call-set ratchet applies. Converge any new mismatch; do not baseline it.
- [ ] AR suites pass on sqlite3, pg and mysql.
