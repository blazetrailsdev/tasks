---
title: "PG quoteBinaryColumn is invented dead surface duplicating quotedBinary"
status: draft
updated: 2026-08-29
rfc: "0077-quoting-binds-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `check_int_in_range` (PR #7196,
`pg-integer-out-of-64bit-range-message-is-invented`). After that PR removed the
invented `checkIntegerRange` name, `pnpm parity:api:extra --package activerecord`
reports exactly one remaining novel name in
`packages/activerecord/src/connection-adapters/postgresql/quoting.ts`:

```
  connection-adapters/postgresql/quoting.ts — 1 novel, 0 moved
    quoteBinaryColumn
```

`quoting.ts:75-77`:

```ts
export function quoteBinaryColumn(value: Buffer): string {
  return `'\\x${value.toString("hex")}'`;
}
```

Rails' `PostgreSQL::Quoting`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:1-238`)
has no `quote_binary_column`; a grep of `activerecord/lib` finds no such method
anywhere. The hex-bytea literal Rails does emit comes from `quoted_binary`
(`quoting.rb` / `abstract/quoting.rb`), which trails already ports as
`quotedBinary` (`quoting.ts:88-93`). `quoteBinaryColumn` has **no callers** in
the repo — a `grep -rn quoteBinaryColumn packages scripts --include=*.ts`
(excluding `dist/`) hits only its own definition.

So this is dead, invented, exported surface duplicating `quotedBinary`.

## Acceptance criteria

- `quoteBinaryColumn` is deleted from
  `packages/activerecord/src/connection-adapters/postgresql/quoting.ts`, along
  with any re-export of it.
- If a caller is found during the work, it routes through `quotedBinary`
  (the port of Rails' `quoted_binary`) instead.
- `pnpm parity:api:extra --package activerecord` reports
  `connection-adapters/postgresql/quoting.ts — 0 novel`.
- No `@noRailsEquivalent` receipt is added — the name has no Rails counterpart
  and no caller, so the convergence is deletion, not justification.
