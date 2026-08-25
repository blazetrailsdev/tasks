---
title: "Converge BroadcastLogger's level accessors and severity predicates to Rails"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6531
claim: "2026-08-14T17:15:04Z"
assignee: "call-args-tool-dispatched-identifier-in-argument-position"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `BroadcastLogger#dispatch` and the severity bangs in #6526.

`packages/activesupport/src/broadcast-logger.ts` keeps two divergences from
`vendor/rails/activesupport/lib/active_support/broadcast_logger.rb` that the
dispatch port left in place because they change observable level behaviour and
were out of that PR's scope:

1. **`level` / `level=` keep private storage Rails does not have.**
   Rails (`broadcast_logger.rb:107-109`):

   ```ruby
   def level
     @broadcasts.map(&:level).min
   end
   ```

   …and `level=` (`:151-153`) _only_ dispatches — it stores nothing. trails'
   `level=` also writes `this._level`, and the getter falls back to it when
   `broadcasts` is empty (`Math.min()` of an empty list is `Infinity`, where
   Ruby's `[].min` is `nil`). Converged shape: `level=` dispatches only; the
   getter is the min over `broadcasts` with the empty case matching Ruby's
   `nil`.

2. **The `debug?`/`info?`/`warn?`/`error?`/`fatal?` predicates re-derive the
   comparison instead of delegating.** Rails (`:169`, and the same shape at
   `:180`, `:191`, `:202`, `:213`):

   ```ruby
   def debug?
     @broadcasts.any? { |logger| logger.debug? }
   end
   ```

   trails computes `broadcasts.some((l) => l.level <= Logger.DEBUG)`, which
   silently disagrees with any broadcast that overrides its own predicate. Five
   `call-mismatches-exclude` rows (`broadcast-logger.json`, `debug?`/`info?`/
   `warn?`/`error?`/`fatal?` → `any?`) exist only because of this; converging
   the bodies to delegate retires all five.

## Acceptance criteria

- `level=` dispatches without private storage; `level` matches Rails including
  the empty-broadcasts case.
- The five predicates delegate to each broadcast's own predicate.
- The 5 `any?` rows are deleted from
  `scripts/api-compare/call-mismatches-exclude/activesupport/broadcast-logger.json`
  and the shard's mark tightened with `pnpm parity:api:calls:tighten`.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
