---
title: "InsertAll#disallow_raw_sql! rejects every raw String — drop the invented permit matcher, raise ArgumentError (insert_all.rb:212-219)"
status: draft
updated: 2026-08-16
rfc: "0111-error-class-message-parity"
cluster: bare-error-throws
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

Surfaced while converging `Sanitization#disallow_raw_sql!` onto the model
in PR #6601 (`converge-disallow-raw-sql-onto-model`). `InsertAll` has its
OWN private `disallow_raw_sql!`, correctly separate from Sanitization's —
but trails' copy does not match it.

Rails
(`vendor/rails/activerecord/lib/active_record/insert_all.rb:212-219`):

```ruby
def disallow_raw_sql!(value)
  return if !value.is_a?(String) || Arel.arel_node?(value)

  raise ArgumentError, "Dangerous query method (method whose arguments are used as raw " \
                       "SQL) called: #{value}. " \
                       "Known-safe values can be passed " \
                       "by wrapping them in Arel.sql()."
end
```

It takes ONE argument and raises for **every** String that is not an Arel
node — there is no permit matcher, because `on_duplicate` / `returning`
are never column names.

trails (`packages/activerecord/src/insert-all.ts:525`):

```ts
private disallowRawSqlBang(value: unknown, permit: RegExp = COLUMN_NAME_WITH_ORDER): void {
  if (value instanceof Nodes.SqlLiteral) return;
  if (typeof value !== "string") return;
  if (permit.test(value)) return;
  throw new Error(...);
}
```

Three divergences:

1. **An invented `permit` parameter with a `COLUMN_NAME_WITH_ORDER`
   default.** Rails' body has no matcher, so trails silently ACCEPTS raw
   strings Rails rejects — `insertAll(..., { onDuplicate: "id" })` passes
   here and raises in Rails. This is a permissive security-relevant gap,
   not just a shape difference.
2. **Wrong error class.** `throw new Error(...)`; Rails raises
   `ArgumentError`.
3. **Wrong message.** trails: `"Dangerous query method called with raw SQL
string: #{value}. …"`. Rails:
   `"Dangerous query method (method whose arguments are used as raw SQL) called: #{value}. …"`.

The `Arel.arel_node?` guard is also narrowed to
`value instanceof Nodes.SqlLiteral`; `Arel.arel_node?` accepts any Arel
node.

## Converged shape

Port `insert_all.rb:212-219` line for line: drop the `permit` parameter,
raise `ArgumentError` with Rails' exact message, and widen the node guard
to any Arel node. Both call sites (`insert-all.ts:94,96`, mirroring
`insert_all.rb:24-25`) already pass a single argument.

## Acceptance criteria

- [ ] `InsertAll#disallowRawSqlBang` takes one argument, has no permit
      matcher, and raises `ArgumentError` with the message from
      `insert_all.rb:215-218` verbatim.
- [ ] The node guard accepts any Arel node, not only `Nodes.SqlLiteral`.
- [ ] A cover pins that a plain string `onDuplicate` / `returning` raises
      (it does not today) — must fail on baseline.
- [ ] `pnpm parity:api:calls` / `:args` clean.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
