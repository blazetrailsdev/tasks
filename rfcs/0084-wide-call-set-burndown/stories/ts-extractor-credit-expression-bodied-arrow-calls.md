---
title: "collectCalls/extractSkeleton skip an expression-bodied arrow's outermost call"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: api-compare
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6354
claim: "2026-08-11T12:54:17Z"
assignee: "naming-burndown-activerecord-rest"
blocked-by: null
closed-reason: null
---

## Context

`collectCalls` (`scripts/api-compare/extract-ts-api.ts`) and `extractSkeleton`
both start their walk with `ts.forEachChild(body, visit)` — the body's
CHILDREN, never the body node itself. For an expression-bodied arrow
(`const helper = (value) => where(value)`) the body IS the `CallExpression`,
so the OUTERMOST call is never credited: `calls`, `callSeq` and `skeleton` all
record `where`'s arguments but not `where`.

Found while landing `ts-extractor-emit-call-arguments` (#6304). `callArgs`
avoids it — `walkForCallArgs` starts at the body node — and the fix there is a
one-line precedent (`visit(node)` in place of `ts.forEachChild(node, visit)`),
deliberately NOT applied to the sibling streams in that PR because it moves the
`parity:api:calls` population and belongs in its own measured change.

The Ruby side has no such gap: `walk_for_calls` (`extract-ruby-api.rb`) is
handed the whole body node and dispatches on it directly, so Ruby credits the
equivalent one-expression body. This is a TS-only under-count.

Population: every `export const f = (x) => oneCall(x)` and every file-local
arrow helper of that shape — common in the module-function namespaces and in
arel's visitor tables.

## Acceptance criteria

1. `collectCalls` and `extractSkeleton` credit an expression-bodied arrow's
   outermost call, matching `walkForCallArgs`.
2. The `parity:api:calls` artifact is regenerated and the row movement reported in the
   PR body — a newly-credited call can CLOSE a mismatch row (delete it, the
   baseline is only-shrink) or surface a new one.
3. A test pins `const f = (x) => where(x)` crediting `where` in `calls`,
   `callSeq` and `skeleton`.
