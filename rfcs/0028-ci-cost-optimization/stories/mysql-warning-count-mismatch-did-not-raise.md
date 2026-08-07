---
title: "MariaDB: warning_count/SHOW WARNINGS mismatch did not raise SQLWarning"
status: done
updated: 2026-08-07
rfc: "0028-ci-cost-optimization"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5719
claim: "2026-08-07T22:48:41Z"
assignee: "port-c-civil-to-jd-and-c-jd-to-civil-at-their-rails-names"
blocked-by: null
closed-reason: null
---

## Context

Filed from `pg-maria-adapter-unique-flake-burndown-round-2` (PR #6203). MariaDB
run
[30649373370](https://github.com/blazetrailsdev/trails/actions/runs/30649373370)
(branch `remove-global-reset-and-skip-shield-after-canonical-bur-1de1`,
2026-07-31T16:59Z) failed on:

```text
FAIL packages/activerecord/src/adapters/abstract-mysql-adapter/warnings.test.ts
  > Mysql2Adapter > WarningsTest
  > db_warnings_action handles when warning_count does not match returned warnings
AssertionError: expected Error: expected SQLWarning to be an instance of SQLWarning
```

PR #6203 fixed the _assertion_, which was self-masking: the old body threw its
own `new Error("expected SQLWarning")` inside the `try` whose `catch` then
asserted it, so a run where `execute` resolved was indistinguishable from one
that raised the wrong class. It is now
`await expect(raised).rejects.toBeInstanceOf(SQLWarning)`.

It did **not** fix the underlying cause. The test spies `_warningCount` to
return 1 while `SHOW WARNINGS` returns `[]`, and expects
`abstract-mysql-adapter`'s warning check to raise `SQLWarning` with
`"Query had warning_count=1 but 'SHOW WARNINGS' did not return the warnings."`
(Rails: `abstract_mysql_adapter.rb`, `handle_warnings` /
`ActiveRecord::SQLWarning`). On that run it resolved instead. Seen once, on
MariaDB only, unreproduced locally.

## Acceptance criteria

- [ ] Determine why `adapter.execute("SELECT 'x'")` resolved with the
      `_warningCount` spy in place — a real port divergence in the warnings
      path (spy not reaching the call site, warning check skipped under some
      `dbWarningsAction` state, MariaDB-specific `SHOW WARNINGS` behavior), or
      per-worker test-ordering interference.
- [ ] If it is a port divergence, converge against
      `vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb`
      rather than loosening the test — the test name is Rails-verbatim and stays.
- [ ] If it is ordering interference, close with the evidence and register it
      in the CI-flake list.
