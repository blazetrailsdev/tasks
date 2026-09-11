---
title: "AbstractAdapter#initialize drops Rails' logger assignment and lock_thread = nil"
status: blocked
updated: 2026-09-11
rfc: "0094-sqlite3-adapter-construction-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 14
pr: trails#7686
claim: "2026-09-11T02:14:13Z"
assignee: "sqlite3-connection-parameters-carry-trails-driver-key"
blocked-by: "logger half shipped in trails#7686; lock_thread=nil reds concurrent-statement tests (NullLock), see abstract-adapter-null-lock-breaks-concurrent-async-statements"
closed-reason: null
---

## Context

Rails' `AbstractAdapter#initialize` does two things at the end of its body that
trails' ported constructor does not
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:132,140,157`):

```ruby
@logger = ActiveRecord::Base.logger          # :132 (hash branch)
@logger = deprecated_logger || ActiveRecord::Base.logger   # :140 (raw-connection branch)
...
self.lock_thread = nil                       # :157
```

PR #7656 ported the four-parameter signature and both branches, but left these
two out. In `packages/activerecord/src/connection-adapters/abstract-adapter.ts`:

- `logger` is only a field default — `logger: unknown = null;` (`:842`). Nothing
  ever assigns `ActiveRecord::Base.logger`, in either branch, so every adapter
  has a null logger regardless of what the app configured.
- `setLockThread(null)` is never called from the constructor. The field
  initializer leaves `lock` as a `LoadInterlockAwareMonitor`, where Rails'
  `lock_thread = nil` selects `ActiveSupport::Concurrency::NullLock`
  (`abstract_adapter.rb:172-181`). So a freshly constructed trails adapter locks
  where Rails' does not.

The logger half was deferred in #7656 because reaching `Base` from
`abstract-adapter.ts` risks the TDZ cycle that `activerecord/src/base-slot.ts`
exists to break; that slot is the sanctioned route.

## Converged shape

- Both constructor branches assign the logger, the raw-connection branch as
  `deprecatedLogger ?? Base.logger`, reading `Base` through
  `activerecord/src/base-slot.ts` rather than importing `base.ts`.
- The constructor calls `this.setLockThread(null)` at Rails' position, directly
  after the statement pool is built and before `preparedStatements`.

## Acceptance criteria

- [ ] A newly constructed adapter reports the configured `Base.logger`.
- [ ] A newly constructed adapter's `lock` is the null lock, matching
      `abstract_adapter.rb:172-181` for `lock_thread = nil`.
- [ ] No new import cycle: verify with a plain-node import of the built
      `dist/**.js` modules as entry modules, not via vitest.
