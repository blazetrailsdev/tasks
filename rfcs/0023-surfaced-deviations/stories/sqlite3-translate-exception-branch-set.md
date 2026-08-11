---
title: "sqlite3 translate_exception mirrors Rails' six arms (missing BusyException, extra ValueTooLong)"
status: draft
updated: 2026-08-11
rfc: "0023-surfaced-deviations"
cluster: null
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

Found while landing `converge-translate-exception-cause-kwarg` (PR #6375),
which converged the argument lists in this function but deliberately did not
touch its branch structure.

`SQLite3Adapter#translate_exception`
(`activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:692-710`)
has exactly six arms, in this order:

```ruby
if    exception.message.match?(/(column(s)? .* (is|are) not unique|UNIQUE constraint failed: .*)/i)  # RecordNotUnique
elsif exception.message.match?(/(.* may not be NULL|NOT NULL constraint failed: .*)/i)               # NotNullViolation
elsif exception.message.match?(/FOREIGN KEY constraint failed/i)                                     # InvalidForeignKey
elsif exception.message.match?(/called on a closed database/i)                                       # ConnectionNotEstablished
elsif exception.is_a?(::SQLite3::BusyException)                                                      # StatementTimeout
else  super
end
```

trails' module-level `translateException`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:~3178`)
diverges on three counts:

1. **A `ValueTooLong` arm Rails does not have** —
   `if (msg.includes("String or BLOB exceeded size limit"))`. No counterpart at
   `sqlite3_adapter.rb:692-710`; Rails lets that fall through to `super`.
2. **The `SQLite3::BusyException` → `StatementTimeout` arm is missing**
   (`:705-706`). A busy/locked database therefore surfaces as a bare
   `StatementInvalid` rather than `StatementTimeout`, so callers that
   discriminate on the timeout class cannot.
3. **Each message regex is OR'd with a driver `code?.includes("CONSTRAINT_*")`
   check** that Rails does not perform. Rails matches on the message only.

The `else super` arm is also inlined as a direct `StatementInvalid`
construction rather than dispatching to the inherited translator.

## Converged shape

`translateException` has Rails' six arms, in Rails' order, matching on the
message the way Rails does, with the `BusyException` arm restored (against
whatever better-sqlite3 surfaces for `SQLITE_BUSY`) and the `ValueTooLong` arm
either removed or justified at the call site with a cite showing the driver
cannot reach the Rails arm. The final arm dispatches to the inherited
translator rather than re-constructing `StatementInvalid` inline.

## Acceptance criteria

1. The branch set, branch order and match conditions mirror
   `sqlite3_adapter.rb:692-710`.
2. A busy/locked SQLite database yields `StatementTimeout` (`:705-706`).
3. Dropping the `code?.includes(...)` disjuncts does not regress the adapter
   suites — if a driver code arm is genuinely required because better-sqlite3
   phrases a message differently than the C sqlite3 gem, it stays with a
   one-line call-site justification naming the message it covers.
4. `pnpm parity:api:calls` / `:args` green; SQLite suites green.
