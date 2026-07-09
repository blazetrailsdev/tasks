---
title: "mysql-checkversion-enforce-version-floor"
status: claimed
updated: 2026-07-09
rfc: "0056-adapter-type-column-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 210
pr: null
claim: "2026-07-09T03:31:20Z"
assignee: "mysql-checkversion-enforce-version-floor"
blocked-by: null
closed-reason: null
---

## Context

Follow-up surfaced in PR #4805 review (warm-mysql-version-at-connection-configure).
That PR made `Mysql2Adapter#configureConnection` eagerly call
`getDatabaseVersion()` at connect time, mirroring Rails' `configure_connection`
→ `check_version` → `database_version` chain.

`AbstractMysqlAdapter#checkVersion` is currently a no-op stub
(`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts:1291`
— `checkVersion(): void {}`), whereas Rails' `AbstractMysqlAdapter#check_version`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:684`)
raises `DatabaseVersionError` when `database_version < "5.6.4"`:

```ruby
def check_version
  if database_version < "5.6.4"
    raise DatabaseVersionError, "Your version of MySQL (#{database_version}) is too old. Active Record supports MySQL >= 5.6.4."
  end
end
```

Now that the version is warmed unconditionally at connect, checkVersion is the
natural, low-risk place to wire the real version-floor check end-to-end. Note
`checkVersion()` is sync while `getDatabaseVersion()` is async in trails — the
port must read the already-warmed `_databaseVersion` (populated before
checkVersion runs, or reorder so the warm precedes the floor check).

## Acceptance criteria

- [ ] `AbstractMysqlAdapter#checkVersion` raises `DatabaseVersionError` (add the
      error type if absent) when the warmed server version is < "5.6.4",
      matching Rails verbatim message.
- [ ] Uses the eagerly-warmed `_databaseVersion` — no extra round-trip.
- [ ] Test mirrors Rails' check_version coverage (a stubbed too-old version
      raises; a supported version does not).
