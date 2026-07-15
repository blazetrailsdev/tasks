---
title: "abstract quote/type_cast boolean arms call module-level, not self-dispatch"
status: ready
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of PR #4895 (`drop-pg-quoting-boolean-literal-extras`). Out of
scope there: #4895 was a deletion, and converging this moves live behaviour.

Rails' abstract `quote`/`type_cast` reach the boolean literals through **self**,
so an adapter's override applies to the inherited method:

```ruby
# vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:77-78
when true       then quoted_true
when false      then quoted_false
# :98-99
when true       then unquoted_true
when false      then unquoted_false
```

trails calls the **module-level** functions instead, so no override is reachable:

- `connection-adapters/abstract/quoting.ts:112`
  `if (typeof value === "boolean") return value ? quotedTrue() : quotedFalse();`
- `connection-adapters/abstract/quoting.ts:175-176`
  `if (value === true) return unquotedTrue();` / `:176` for `false`.

Two consequences:

1. **trails compensates by duplicating the whole boolean arm per adapter**, which
   Rails does not do — `sqlite3/quoting.ts:85` (`quote`) and `:201`
   (`typeCast`, `BigInt(value ? unquotedTrue() : unquotedFalse())`), and
   `mysql/quoting.ts:282`. Each module re-implements the dispatch Rails gets from
   one method. That duplication is the deviation; it is only _currently_
   behaviour-correct because each module hardcodes its own pair.
2. **Value-pinning tests cannot guard an override.** `postgresql/quoting.test.ts:34`
   (`inherits abstract boolean SQL literals`) asserts the right values but would
   pass unchanged even if PG _did_ override the pair — noted in that test's
   comment. Self-dispatch is what would make such a test a real guard.

## Acceptance criteria

- [ ] `abstract/quoting.ts` `quote`/`typeCast` reach the boolean literals via the
      host receiver (`this.quotedTrue()` / `this.unquotedTrue()`), mirroring
      Rails' self-dispatch, rather than the module-level functions.
- [ ] The per-adapter duplicate boolean arms (`sqlite3/quoting.ts:85`, `:201`,
      `mysql/quoting.ts:282`) collapse onto the inherited path where doing so is
      behaviour-preserving.
- [ ] `postgresql/quoting.test.ts:34`'s comment disclaiming the dispatch gap is
      removed once the assertions actually pin dispatch.
- [ ] api:compare / test:compare delta non-negative.

## Notes

**Not a mechanical one-token change — verify before assuming scope.** SQLite's
`typeCast` boolean arm returns `BigInt(...)` (`sqlite3/quoting.ts:201`), so
routing it through the inherited path can flip SQLite's `1` to `1n`; the
`type_casted_binds` sweep hit exactly this. Sequence with, or fold into,
`type-casted-binds-payload-self-dispatch` (RFC 0023, ready) — that story covers
the `type_cast` _producers_, this one covers the boolean arms inside
`quote`/`type_cast` themselves; they touch adjacent lines in the same file, so
they should not be worked in parallel by different agents.

Precedent: `abstract-quote-binary-data-self-dispatch` (done) converged the same
shape at the `Type::Binary::Data` arm.
