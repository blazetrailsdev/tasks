---
title: "activerecord: GeneratedRelationMethods ports MUTEX.synchronize once Mutex#synchronize releases synchronously"
status: draft
updated: 2026-10-02
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of trails#8391 (`activerecord-audit-permanent-receipts-relation-part-1`), which
converged `GeneratedRelationMethods#generateMethod`
(`packages/activerecord/src/relation/delegation.ts`) onto
`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/delegation.rb:74-92` except for its
first two lines:

```ruby
MUTEX = Mutex.new            # delegation.rb:72

def generate_method(method)
  MUTEX.synchronize do       # delegation.rb:75
    return if method_defined?(method)
```

The port has no `MUTEX` and no `synchronize`. Nothing registers the omission:
`synchronize` is in `NO_JS_CALL_FORM` (`scripts/api-compare/compare.ts`), so the call gate raises
no row and a `@missingRailsCall synchronize` receipt would be stale; and CLAUDE.md § "The pool
monitor guards only sections that span an `await`" names `ConnectionPool` and `Engine#app`, not
this body. This story is the register.

The blocker is ruby-compat's `Mutex#synchronize` (`packages/ruby-compat/src/mutex.ts`,
`vendor/ruby/v3.3.11/thread_sync.c:697` `rb_mutex_synchronize_m`), which is `async`:

- An uncontended call does run its block before the first `await`, but it releases the mutex in
  a `finally` AFTER `await storage.run(...)`, a microtask later. A second `synchronize` in the
  same tick therefore finds the chain held, awaits its predecessor, and runs its block
  asynchronously.
- `generate_method` must define the method before it returns. It is reached from the synchronous
  `scope` macro (`vendor/rails/v8.0.2/activerecord/lib/active_record/scoping/named.rb:188,197`)
  and from `ClassSpecificRelation#method_missing`, which dispatches to the model right after
  (`relation/delegation.rb:128`). Two `scope` declarations in one class body are two
  `generate_method` calls in one tick.

ruby-compat's monitor already has the needed shape: CLAUDE.md § "The adapter lock defaults to a
monitor, not `NullLock`" records that "an uncontended entry runs its block before `synchronize`
returns" (`packages/ruby-compat/src/monitor.ts`).

## Acceptance criteria

- [ ] `Mutex#synchronize` runs an uncontended block before it returns and, when the block's answer is not a promise, releases the mutex before it returns too, so back-to-back synchronous sections never queue. A block that answers a promise keeps today's hold-until-settled behaviour. Unit tests cover both, and `FutureResult` / `ConnectionPool` / `LoadInterlockAwareMonitor` callers stay green.
- [ ] `GeneratedRelationMethods` carries `static MUTEX = new Mutex()` and `generateMethod`'s body runs inside `GeneratedRelationMethods.MUTEX.synchronize(...)`, as `delegation.rb:72,75` does.
- [ ] `pnpm parity:api:calls` and `:extra:gate` green.

## Verification

```bash
pnpm vitest run packages/ruby-compat/src/mutex.trails.test.ts packages/activerecord/src/relation/delegation.test.ts packages/activerecord/src/scoping/ && pnpm parity:api:calls
```
