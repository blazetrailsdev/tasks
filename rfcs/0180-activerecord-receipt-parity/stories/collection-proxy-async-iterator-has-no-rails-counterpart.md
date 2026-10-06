---
title: "activerecord: CollectionProxy drops [Symbol.asyncIterator]; call sites await the proxy"
status: draft
updated: 2026-10-01
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-associations` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`packages/activerecord/src/associations/collection-proxy.ts` `CollectionProxy` defines
`async *[Symbol.asyncIterator]()`, which awaits `loadTarget()` and yields each record, under
`@noRailsEquivalent`. Rails' `CollectionProxy` has no such member: iteration is `Enumerable` over
`each`, which reads `records` — `load_target`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/collection_proxy.rb:1024-1026`,
`relation.rb:67,342-345`).

CLAUDE.md § "`Relation` is evaluated by an async query" ratifies `then` / `catch` / `finally`
(`applyThenable`) as the way an async query is evaluated: `await proxy`. It does not name an async
iterator, and `for await (const r of proxy)` is a second evaluation surface beside the ratified one —
`for (const r of await proxy)` is the same loop through the thenable.
`batch-enumerator-should-not-carry-a-generator` is the same finding on `BatchEnumerator`, and
`Relation` carries the same member at `relation.ts` (owned by
`activerecord-audit-permanent-receipts-relation-part-2`).

A plain deletion is not safe on its own: `for await` falls back to the SYNC iterator, which walks the
unloaded target and yields nothing, so every `for await (… of <proxy>)` call site has to move to
`await` first.

## Acceptance criteria

- [ ] Every `for await (… of <collection proxy>)` site in the repo (source, tests, docs, website guides) is rewritten to iterate the awaited proxy.
- [ ] `CollectionProxy`'s `[Symbol.asyncIterator]` and its receipt are deleted.
- [ ] `pnpm parity:api:extra:gate` and `:receipts:gate` green.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate && pnpm vitest run packages/activerecord/src/associations/collection-proxy.trails.test.ts
```
