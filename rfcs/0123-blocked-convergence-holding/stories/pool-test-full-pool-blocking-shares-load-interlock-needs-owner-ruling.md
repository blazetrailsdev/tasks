---
title: "connection_pool_test.rb: full pool blocking shares load interlock needs Dependencies.interlock ported or ruled permanent"
status: blocked
updated: 2026-10-12
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: "owner decision: port ShareLock and Dependencies.interlock, or ratify the limit in CLAUDE.md"
closed-reason: null
---

## Context

`test_full_pool_blocking_shares_load_interlock`
(`vendor/rails/v8.0.2/activerecord/test/cases/connection_pool_test.rb:151-188`) is the one
`connection_pool_test.rb` case still excluded in `scripts/parity/unported-files/unscoped.ts`.
trails#8818 ported its two siblings (`concurrent connection establishment`,
`lock thread allow fiber reentrency`) and left this one.

The test takes `ActiveSupport::Dependencies.interlock.running` in one thread and
`.loading` in another, and asserts that a thread blocked on a full pool still lets the other
load. That holds in Rails because `LoadInterlockAwareMonitorMixin#mon_enter`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/concurrency/load_interlock_aware_monitor.rb:13-16`)
wraps its blocking enter in `ActiveSupport::Dependencies.interlock.permit_concurrent_loads`.

In trails:

- `ActiveSupport::Dependencies::Interlock`
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/dependencies/interlock.rb`) and
  `ActiveSupport::Concurrency::ShareLock`
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/concurrency/share_lock.rb`, 225 lines)
  are not ported. Both are scoped skips in `scripts/parity/conventions.ts` (the
  `dependencies/interlock.rb` and `share_lock.rb` `SCOPED_SKIP_GROUPS` entries), whose
  reasons call them Zeitwerk load machinery with nothing to guard under ESM.
- `LoadInterlockAwareMonitorMixin.monEnter`
  (`packages/activesupport/src/concurrency/load-interlock-aware-monitor.ts`) makes no
  `permit_concurrent_loads` call.
- `port-dependencies-interlock-permit-concurrent-loads` (RFC 0119) was closed as not
  portable.
- `packages/trailties/CLAUDE.md` § "Trails has no autoloader" is about the application
  loader only, so it does not by itself ratify dropping the framework interlock. A reviewer
  on trails#8818 refused a `PERMANENT:` row citing it.

## Acceptance criteria

- [ ] The repo owner rules one way: either `ShareLock` and `Dependencies::Interlock` are
      ported (`running`, `loading`, `permit_concurrent_loads`), `monEnter` calls
      `permit_concurrent_loads`, and the test is ported in
      `packages/activerecord/src/connection-pool.test.ts` with Rails' body; or the limit is
      ratified in CLAUDE.md and the `unscoped.ts` row's reason starts `PERMANENT:` citing
      that section.
- [ ] The `unscoped.ts` row for `full pool blocking shares load interlock` is deleted or
      made permanent accordingly, and `pnpm vitest run scripts/parity/unported-files.test.ts`
      passes.
