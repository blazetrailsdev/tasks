---
title: "Route PG quotedBinary through the shared toBytes union"
status: ready
updated: 2026-07-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`toBytes` (`packages/activerecord/src/connection-adapters/abstract/quoting.ts`)
is the shared byte-source normaliser every `quotedBinary` is meant to route
through: it accepts `BinaryData` (Rails' `Type::Binary::Data`, which
`quoted_binary` is given at `abstract/quoting.rb:206`, `mysql/quoting.rb:80`,
`sqlite3/quoting.rb:79`, `postgresql/quoting.rb:152`), any `ArrayBuffer` view,
and a bare `ArrayBuffer`.

The abstract, MySQL (`mysql/quoting.ts`) and SQLite (`sqlite3/quoting.ts`)
implementations route through it. **PG's does not** — it hand-rolls
`value instanceof BinaryData ? value.bytes : value` and its signature omits
`ArrayBuffer`:

```ts
export function quotedBinary(value: Buffer | Uint8Array | string | BinaryData): string {
  return `'${escapeBytea(value instanceof BinaryData ? value.bytes : value)}'`;
}
```

So a direct `pgQuotedBinary(dataView)` raises inside `escapeBytea`'s
`Buffer.from` rather than hexing the view, where MySQL and SQLite handle it.

**Not a live bug**, which is why #4870 filed this rather than fixing it: `quote`
normalises views to bytes before dispatching, `escapeBytea` survives a bare
`ArrayBuffer` via `Buffer.from`, and PG's adapter override
(`postgresql-adapter.ts`) covers `ArrayBuffer` on its own branch. It is a
uniformity gap on a public surface — #4870's `b7ff8301d` moved MySQL onto
`toBytes` for exactly this reason and PG is the remaining hold-out. Surfaced in
Copilot review #7 of #4870; the `toBytes` doc there now records the exception
rather than asserting a uniformity that does not hold.

## Acceptance criteria

- [ ] PG's `quotedBinary` routes its byte union through `toBytes`, e.g.
      `const bytes = toBytes(value); return bytes ? \`'${escapeBytea(bytes)}'\` : \`'${escapeBytea(value as string)}'\``.
- [ ] The latin1 `string` form stays supported — PG's `escapeBytea` accepts one
      and `toBytes` returns `null` for strings, so the string branch must remain
      ordered after it.
- [ ] `pgQuotedBinary(dataView)` and `pgQuotedBinary(arrayBuffer)` hex the same
      bytes MySQL/SQLite do, rather than raising.
- [ ] The exception paragraph in `toBytes`' doc
      (`abstract/quoting.ts`) is removed once PG routes through it.
- [ ] api:compare / test:compare delta non-negative.
