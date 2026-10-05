---
title: "activerecord: a failed migration's StandardError carries the rescued exception's backtrace"
status: draft
updated: 2026-10-05
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while converging `Migrator#execute_migration_in_transaction` in trails PR 8524.

`activerecord/lib/active_record/migration.rb:1537-1542`:

```ruby
rescue => e
  msg = +"An error has occurred, "
  msg << "this and " if use_transaction?(migration)
  msg << "all later migrations canceled:\n\n#{e}"
  raise StandardError, msg, e.backtrace
```

The raised `StandardError` carries the rescued exception's backtrace (the third argument of `raise`).

`packages/activerecord/src/migration.ts` `executeMigrationInTransaction` ends with `throw Object.assign(new StandardError(msg), { cause: e })`. The new error's stack is the rethrow site, not the migration's failure site, and `cause` is assigned by hand where Ruby sets it implicitly from the exception being rescued.

## Converged shape

- Build the error, give it the rescued backtrace through ruby-compat's `excSetBacktrace` (`packages/ruby-compat/src/backtrace-location.ts`), and set the cause through `excSetupMessage(mesg, e)` (`packages/ruby-compat/src/exception.ts`), the port of `raise`'s implicit cause.
- No `Object.assign`.

## Acceptance criteria

- [ ] The error raised for a failing migration reports the failing migration's frames, asserted in a `migration.trails.test.ts` case.
- [ ] `error.cause` is still the original exception.
