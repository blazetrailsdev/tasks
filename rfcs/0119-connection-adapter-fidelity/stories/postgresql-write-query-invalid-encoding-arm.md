---
title: "postgresql-write-query-invalid-encoding-arm"
status: done
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7565
claim: "2026-09-06T16:58:13Z"
assignee: "postgresql-write-query-invalid-encoding-arm"
blocked-by: null
closed-reason: null
---

## Context

Rails' PostgreSQL `write_query?` has two arms:

```ruby
def write_query?(sql) # :nodoc:
  !READ_QUERY.match?(sql)
rescue ArgumentError # Invalid encoding
  !READ_QUERY.match?(sql.b)
end
```

(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:24-28`.)

trails ports only the first arm —
`packages/activerecord/src/connection-adapters/postgresql/database-statements.ts`,
`isWriteQuery`:

```ts
export function isWriteQuery(sql: string): boolean {
  return !READ_QUERY.test(sql);
}
```

The rescue arm is Ruby's answer to a String whose bytes are not valid in its
encoding: `Regexp#match?` raises `ArgumentError`, and `String#b` re-tags the
same bytes as ASCII-8BIT so the match can proceed bytewise.

This gap pre-dates the move in #7416 (it was present verbatim on
`postgresql-adapter.ts` before the twelve bodies were relocated) and was
flagged during that PR's review as a pointer, not a blocker.

Part of the port is deciding what the second arm even means in TS: a JS string
is UTF-16 and `RegExp#test` does not throw on a lone surrogate, so the
`ArgumentError` this rescues may have no JS analogue at all. If it does not,
the honest outcome is a `@missingRailsCall`-style receipt at the call site
recording that — NOT silence.

The MySQL sibling (`mysql/database-statements.ts`, `isWriteQuery`) should be
checked for the same shape while here.

## Acceptance criteria

- Either the `sql.b` arm is ported, or a receipt at the `isWriteQuery` call
  site records with a Rails cite why TypeScript cannot reach it.
- Whichever way it lands, the decision is written down at the call site, not
  only in this story.
- `pnpm parity:api:calls` and `:calls:args` stay clean.
- If a behavioural arm is added, it carries a test that fails on the baseline.
