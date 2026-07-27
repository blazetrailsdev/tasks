---
title: "maintainTestSchemaBang omits Rails' suppress_messages wrapper"
status: ready
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #5391 (`module-level-config-accessor-shape`).

`Migration.maintainTestSchemaBang`
(`packages/activerecord/src/migration.ts:1511`) now gates on
`ActiveRecord.maintainTestSchema` like Rails does, but still omits the other half
of Rails' body. Rails (`vendor/rails/activerecord/lib/active_record/migration.rb:717-721`):

```ruby
def maintain_test_schema! # :nodoc:
  if ActiveRecord.maintain_test_schema
    suppress_messages { load_schema_if_pending! }
  end
end
```

trails calls `loadSchemaIfPendingBang()` bare — no `suppressMessages` wrapper, so
migration output is not silenced when the test harness maintains the schema.

The blocker is structural, not an oversight. In Rails
`Migration.suppress_messages` is a CLASS-level call that resolves through
`method_missing` (`migration.rb:723-725`) to `nearest_delegate.send(...)`, i.e.
the delegate INSTANCE's `suppress_messages` (`migration.rb:1029`). trails'
`suppressMessages` is an instance method (`migration.ts:1282`) and its static
`methodMissing` (`migration.ts:1524`) is not reachable from a direct static call
in TS, so there is no route from `maintainTestSchemaBang` to it without either
inventing a static wrapper or threading the delegate explicitly.

Currently baselined as a wide call-mismatch exclusion:
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/migration.json`,
entry `maintain_test_schema!` / `suppress_messages`.

## Acceptance criteria

- Decide and implement how a static `Migration` method reaches the delegate's
  `suppressMessages` (explicit `nearestDelegate` threading is the likely answer;
  a static alias that shadows the instance method is NOT — it would diverge from
  Rails' single definition).
- `maintainTestSchemaBang` wraps `loadSchemaIfPendingBang()` in it, matching
  migration.rb:719.
- The `maintain_test_schema!` / `suppress_messages` entry removed from the wide
  exclude baseline, and `pnpm exec tsx
scripts/api-compare/lint-call-mismatches-wide.ts` still passes.
- Check whether the same static-vs-instance gap blocks other `suppress_messages`
  call sites in Rails' Migration singleton and note them if so.
