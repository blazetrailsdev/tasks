---
title: "activerecord: Relation drops [Symbol.asyncIterator]; call sites await the relation"
status: closed
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: "2026-10-09T00:33:51Z"
assignee: "relation-async-iterator-has-no-rails-counterpart"
blocked-by: null
closed-reason: 'PERMANENT: Relation#[Symbol.asyncIterator] is kept by the repo owner''s ruling (2026-10-08): for await over a relation is a wanted feature. Its receipt is @noRailsEquivalent PERMANENT and packages/activerecord/CLAUDE.md § "Relation is evaluated by an async query" records it (trails#8699).'
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-relation-part-1` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

`packages/activerecord/src/relation.ts` `Relation` defines `async *[Symbol.asyncIterator]()`,
which awaits `toArray()` and yields each record, under `@noRailsEquivalent`. Rails' `Relation`
has no such member: iteration is `include Enumerable` over `each`, which reads `records`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:67,342-345`,
`relation/delegation.rb:101-104`).

CLAUDE.md § "`Relation` is evaluated by an async query" ratifies `then` / `catch` / `finally`
(`applyThenable`) as the way an async query is evaluated: `await rel`. It does not name an async
iterator, and `for await (const r of rel)` is a second evaluation surface beside the ratified one;
`for (const r of await rel)` is the same loop through the thenable.
`collection-proxy-async-iterator-has-no-rails-counterpart` is the same finding on
`CollectionProxy` and `batch-enumerator-should-not-carry-a-generator` on `BatchEnumerator`.

A plain deletion is not safe on its own: `for await` falls back to the SYNC iterator, so every
`for await (… of <relation>)` site has to move to `await` first. `grep -rn "for await" packages docs`
finds about 130 sites, most of them over a relation, a proxy or a batch enumerator.

## Acceptance criteria

- [ ] Every `for await (… of <relation>)` site in the repo (source, tests, docs, website guides) is rewritten to iterate the awaited relation.
- [ ] `Relation`'s `[Symbol.asyncIterator]` and its receipt are deleted.
- [ ] `pnpm parity:api:extra:gate` and `:receipts:gate` green.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate && pnpm vitest run packages/activerecord/src/relation.trails.test.ts
```
