---
title: "warnings.test.ts carries a MariaDB-only beforeEach and stubs above Rails' seam"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "MariaDB-lane test-infra divergence; the clear_warnings beforeEach is already justified at the call site (#5719) and the _warningCount spy is behaviourally equivalent. No Rails behaviour diverges."
---

## Context

`packages/activerecord/src/adapters/abstract-mysql-adapter/warnings.test.ts`
diverges from its Rails original,
`vendor/rails/activerecord/test/cases/adapters/abstract_mysql_adapter/warnings_test.rb`,
in two ways. Both were surfaced by PR #5719, which removed the global
between-test reset and made the first one load-bearing.

1. **A trails-only statement in `beforeEach`.** PR #5719 added
   `await adapter.execute("SELECT 1 FROM (SELECT 1) AS clear_warnings")` to the
   `beforeEach` (`warnings.test.ts:15-27`). It has no counterpart in
   `warnings_test.rb:7-10`, whose `setup` only leases the connection. It exists
   because trails runs MariaDB as its MySQL-family CI stand-in
   (`.github/workflows/ci.yml:1244-1251`) while Rails only ever runs MySQL, and
   MariaDB keeps the previous statement's diagnostics area when the next
   statement has no non-degenerate `FROM`. So the Note 1051 left by
   `db_warnings_action ignores note level warnings`
   (`DROP TABLE IF EXISTS non_existent_table_warnings_test`) is still what
   `SHOW WARNINGS` returns during the following
   `db_warnings_action handles when warning_count does not match returned warnings`
   case, whose precondition Rails states but does not enforce
   (`warnings_test.rb:98`, "SHOW WARNINGS will return []"). Before #5719 the
   global reset's DDL cleared the area incidentally.

2. **The stub targets a different object than Rails'.** Rails stubs the raw
   connection: `@connection.raw_connection.stub(:warning_count, 1)`
   (`warnings_test.rb:99`). trails spies the adapter method instead:
   `vi.spyOn(adapter, "_warningCount").mockResolvedValue(1)`
   (`warnings.test.ts:96-100`). `_warningCount`
   (`connection-adapters/mysql2-adapter.ts:1986`) reads the raw connection's
   `warningCount`, so the two are equivalent today, but the trails form stubs one
   layer above the thing Rails stubs and would not catch a regression in
   `_warningCount` itself.

## Acceptance criteria

- Decide and record whether the `clear_warnings` statement converges or stays.
  If it stays, it is a deliberate MariaDB-lane deviation and belongs at the call
  site with a justification (per CLAUDE.md, deviations are justified at the call
  site, which #5719 did) — this story then only needs to confirm no narrower
  option exists (e.g. having the note-level case not leave a note, or ordering
  the two cases so the dependency cannot arise).
- Move the stub to the raw connection so it matches
  `warnings_test.rb:99`, or record why the adapter-level spy is the only
  reachable seam in TS.
- No test-name changes; `warnings.test.ts` names already match Rails verbatim.
- Verify on both `mysql:8` and `mariadb:11` — the two lanes disagree here, and a
  change verified on only one proves nothing. Repro recipe: run the single file
  against a local `mariadb:11` container after applying
  `scripts/db-init/mysql/01-rails-user.sql`.
