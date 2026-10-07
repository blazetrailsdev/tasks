---
title: "activerecord: ExplainProxy drops then/catch/finally; call sites await inspect"
status: ready
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-relation-part-1` audit: the receipts below were `PERMANENT`, no CLAUDE.md section ratifies them, and they are re-tagged `CONVERGEABLE` onto this story.

`packages/activerecord/src/relation.ts` `ExplainProxy` declares `then` / `catch` / `finally`
(`applyThenable(ExplainProxy.prototype, "inspect")`), so `await relation.explain()` runs the
plan. `catch` and `finally` carry `@noRailsEquivalent`.

Rails' `ExplainProxy`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb:6-55`) has no such members. It
is a plain object whose `inspect` (`relation.rb:12-14`) runs `exec_explain`; a console prints
the plan because it inspects the proxy, and code reads it with `.inspect`.

CLAUDE.md § "`Relation` is evaluated by an async query" ratifies `then` / `catch` / `finally`
on `Relation.prototype`, where `await rel` stands in for `records`. `ExplainProxy` is not a
Relation and has no `records`: its one evaluating method, `inspect`, is already ported and
already returns a `Promise<string>`. The thenable is a second spelling of `await proxy.inspect()`.

About 41 call sites in `packages/` `await` a proxy directly
(`grep -rn "await .*\.explain(" packages --include=*.ts`); 4 already call `.inspect()`.

## Acceptance criteria

- [ ] Every `await <relation>.explain(…)` site (source, tests, docs, website guides) reads `await <relation>.explain(…).inspect()`.
- [ ] `ExplainProxy`'s `then` / `catch` / `finally` declarations, its `applyThenable` call and the two receipts are deleted.
- [ ] `pnpm parity:api:extra:gate` and `:receipts:gate` green.

## Verification

```bash
pnpm parity:api:extra:gate && pnpm parity:api:receipts:gate && pnpm vitest run packages/activerecord/src/explain.test.ts
```
