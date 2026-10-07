---
title: "activerecord: Relation drops presence; activesupport's presence answers a thenable unevaluated"
status: ready
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-relation-part-1` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

`packages/activerecord/src/relation.ts` `Relation` defines
`async presence(): Promise<LoadedRelation<…> | null>` under `@noRailsEquivalent`.

Rails' `Relation` defines no `presence`. It defines `blank?`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:1274-1276`, `records.blank?`),
and `presence` is `Object#presence`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/object/blank.rb:45-47`,
`self if present?`), which reaches that `blank?` by ordinary dispatch.

trails ports `Object#presence` as the `presence(obj)` function in
`packages/activesupport/src/core-ext/object/blank.ts`, and it already has the async arm: when
`obj.isBlank` is an async function it answers `present.then((p) => (p ? value : undefined))`.
For a relation that arm is wrong. A `Relation` is a thenable (CLAUDE.md § "`Relation` is
evaluated by an async query"), so resolving a promise with it evaluates it, and
`await presence(relation)` answers the RECORDS, not the relation. `Relation#presence` exists to
answer `stripThenable(this)` instead, and the section does not name it.

The only callers are trails-only tests: `packages/activerecord/src/relation.trails.test.ts` and
`packages/activerecord/src/relation/thenable.trails.test.ts`. The second pins that an awaiting
caller gets the relation and not its records.

## Acceptance criteria

- [ ] activesupport's `presence(obj)` resolves its async arm with the object itself, not re-evaluated by the `await`, when the object is a thenable (the `then`-hiding view `stripThenable` builds, reached without activesupport importing activerecord), or `undefined`.
- [ ] `Relation#presence` and its receipt are deleted; the four call sites read `await presence(relation)`.
- [ ] `pnpm parity:api:extra:gate` and `:receipts:gate` green.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate && pnpm vitest run packages/activerecord/src/relation.trails.test.ts packages/activerecord/src/relation/thenable.trails.test.ts
```
