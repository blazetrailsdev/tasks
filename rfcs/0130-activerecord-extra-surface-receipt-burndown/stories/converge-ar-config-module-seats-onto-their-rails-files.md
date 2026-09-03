---
title: "Converge the remaining 27 ar-config.ts module seats onto the Rails files that define them"
status: draft
updated: 2026-09-03
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ar-config.ts` has no Rails counterpart. It is a trails-invented object standing
in for the `ActiveRecord` module's singleton config accessors, and
`pnpm parity:api:extra --package activerecord` scores it
`1 novel, 27 moved [no Rails counterpart]` — "moved" meaning Rails does define
the name, just in a `.rb` this file does not map to.

RFC 0081 built this file (`convert-ar-config-accessors-exported-flags` #5563,
`convert-ar-config-accessors-internal-flags` #5564,
`relocate-ar-default-timezone-to-ar-config` #5566) by moving seats _into_ it.
PR #7428 established the opposite, correct direction for one of them:
`db_warnings_ignore` (`vendor/rails/activerecord/lib/active_record.rb:260-263`,
`singleton_class.attr_accessor :db_warnings_ignore` with
`self.db_warnings_ignore = []`) is a member the api manifest attributes to
**`base.rb`**, so it is now a `static get`/`static set` pair on `Base` in
`base.ts` beside `writingRole`/`readingRole` (`active_record.rb:265-269`), with
module-level storage, and the `ar-config.ts` entry deleted rather than kept in
parallel. That took `base.rb` from 550/552 to 552/552.

The remaining 27 are the same defect, unconverged:

    globalThreadPoolAsyncQueryExecutor actionOnStrictLoadingViolation
    ActiveRecord applicationRecordClass asyncQueryExecutor
    beforeCommittedOnAllRecords belongsToRequiredValidatesForeignKey databaseCli
    dbWarningsAction defaultTimezone disablePreparedStatements
    errorOnIgnoredOrder generateSecureTokenOn maintainTestSchema
    migrationStrategy permanentConnectionCheckout post protocolAdapters
    queryTransformers queues raiseIntWiderThan64bit raiseOnAssignToAttrReadonly
    runAfterTransactionCallbacksInOrderDefined timestampedMigrations
    useYamlUnsafeLoad validateMigrationTimestamps verifyForeignKeysForFixtures
    yamlColumnPermittedClasses

Per CLAUDE.md a documented deviation is debt, not permission — this file is a
register of 27 rows saying "we know this seat is in the wrong place".

## Converged shape

For each name, find the Ruby file the api manifest attributes it to (most are
`active_record.rb`'s `singleton_class.attr_accessor` block,
`active_record.rb:230-300`, which the manifest flattens onto `base.rb`) and give
it a real accessor pair there, deleting the `ar-config.ts` entry rather than
delegating to it. `db_warnings_ignore` in PR #7428 is the worked example,
including the `base-slot.ts` read from `abstract-adapter.ts` where a direct
`base.ts` import would close a module cycle.

Expect this to exceed the LOC ceiling — split it by destination file and file
each split as its own story rather than fanning out unfiled. `AsyncExecutor` and
`post` are a separate question (`AsyncExecutor` already carries
`@noRailsEquivalent PERMANENT`); scope them out or convert them last.

## Acceptance criteria

- Every `ar-config.ts` member that the manifest attributes to a Rails file is a
  real accessor pair in the TS file mirroring that Rails file, and its
  `ar-config.ts` entry is deleted, not delegated.
- `pnpm parity:api:extra --package activerecord` shows `ar-config.ts` shrinking
  toward `0 moved`; the extra-surface mark moves only via `:tighten`.
- Package totals for each destination file rise; no file regresses.
- `pnpm parity:api:calls`, `:calls:args`, `:params` clean.
