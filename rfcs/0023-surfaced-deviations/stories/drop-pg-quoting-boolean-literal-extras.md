---
title: "drop-pg-quoting-boolean-literal-extras"
status: claimed
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-15T19:11:11Z"
assignee: "drop-pg-quoting-boolean-literal-extras"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of PR #4869 (`converge-arel-array-booleans-to-unquoted-true`),
which converged the Arel array boolean cast arm onto `unquoted_true`. Out of
scope there — different package, and it moves the api:compare surface.

`packages/activerecord/src/connection-adapters/postgresql/quoting.ts` declares
four boolean-literal methods on its `Quoting` interface (`:51-54`) and exports
all four (`:76-90`):

```ts
export function quotedTrue(): string {
  return abstractQuotedTrue();
}
export function unquotedTrue(): boolean {
  return true;
}
export function quotedFalse(): string {
  return abstractQuotedFalse();
}
export function unquotedFalse(): boolean {
  return false;
}
```

Rails' `connection_adapters/postgresql/quoting.rb` defines **none** of them.
Verified:

```sh
grep -rn "def quoted_true|def quoted_false|def unquoted_true|def unquoted_false" \
  vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/
# => no matches
```

Only `abstract/quoting.rb:165-180` (`"TRUE"` / bare `true` / `"FALSE"` / bare
`false`), `mysql/quoting.rb:72-78` and `sqlite3/quoting.rb:86-97` (both `1`/`0`)
define them. PostgreSQL inherits the abstract pair — that inheritance is the
whole reason PG's `encode_array` emits `'{true}'`.

They also appear to be **dead**: `postgresql-adapter.ts:22-34` imports twelve
symbols from this module (`quote`, `typeCast`, `quoteTableName`, `quotedDate`,
`quotedBinary`, …) and **none of these four**. No other file in `packages/`
references them. `AbstractAdapter` already supplies the pair at
`abstract-adapter.ts:840-846`, so the PG adapter inherits it correctly today —
which is why deleting them is expected to be behaviour-neutral.

Two distinct problems, worth separating:

1. **Extra methods vs Rails** — they inflate the api:compare surface with names
   Rails does not define on this class.
2. **`unquoted_true`/`unquoted_false` re-implement the abstract body** (`return
true`) instead of delegating like their `quoted_*` neighbours do
   (`abstractQuotedTrue()`). Even if something later wires them, the copy would
   silently not follow a change to the abstract pair.

## Acceptance criteria

- [ ] Delete the four exports and their `Quoting` interface entries from
      `postgresql/quoting.ts`, unless a caller is found — in which case wire it
      to the inherited abstract pair rather than keeping a re-implementation.
- [ ] Confirm the PG adapter still resolves `quotedTrue`/`unquotedTrue` via
      `AbstractAdapter` (`abstract-adapter.ts:840-846`) — a test pinning
      `'{true}'` / scalar `TRUE` through the PG path is enough.
- [ ] Check whether `sqlite3/quoting.ts` and the MySQL quoting module have the
      same shape; Rails DOES define the pair for both, so those are legitimate
      and must NOT be deleted — this is PG-only.
- [ ] api:compare / test:compare delta non-negative (deleting extra methods
      should improve the PG quoting file's ratio).

## Notes

Behaviour-neutral by expectation, so this is a fidelity/dead-code cleanup, not a
bug fix. Scope and review it as such.
