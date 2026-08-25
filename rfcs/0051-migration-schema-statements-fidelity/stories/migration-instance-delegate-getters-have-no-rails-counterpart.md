---
title: "Migration's instance delegate/nearestDelegate getters are invented — Rails defines both only on the class"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6300
claim: "2026-08-09T20:59:21Z"
assignee: "adapter-class-sync-swallows-the-pool-error-rails-raises"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6287, which converged `Migration.delegate` to Rails' shape: the
Migration _instance_ seeded by `self.delegate = new`
(`vendor/rails/activerecord/lib/active_record/migration.rb:684,813`), reached
from the class through `nearest_delegate` (`migration.rb:687-689`) and
`method_missing` (`migration.rb:723-725`). That work merged trails'
never-assigned adapter-typed `static delegate` with the parallel `_delegate`
field, and left the _instance_-side pair untouched as out of scope.

`packages/activerecord/src/migration.ts` still carries two instance members
Rails' `Migration` does not define at all:

    get delegate(): DatabaseAdapter { return this.connection; }
    get nearestDelegate(): DatabaseAdapter { return this.connection; }

Grep `vendor/rails/activerecord/lib/active_record/migration.rb` for
`nearest_delegate` and `delegate`: every hit is inside `class << self`. There is
no instance reader for either, and Rails' instance `method_missing`
(`migration.rb:1006-1012`) routes through `connection`, not through a delegate
getter. So these are invented surface that shadow the class-level names with a
different type (adapter, not Migration), which is exactly the confusion the
class-side merge just removed.

## Converged shape

Delete both instance getters and route their call sites through `connection`,
as `migration.rb:1006-1012` does. Check `parity:api:extra --package activerecord`
before and after — both names should leave the extra-surface count.

## Acceptance criteria

- [ ] `Migration` has no instance `delegate` / `nearestDelegate`; `delegate` and
      `nearestDelegate` exist only on the class, typed `Migration | null`,
      matching `migration.rb:684-689`.
- [ ] Call sites read `this.connection` directly.
- [ ] `pnpm parity:api:extra --package activerecord` does not regress; `pnpm parity:api:calls`
      clean.
