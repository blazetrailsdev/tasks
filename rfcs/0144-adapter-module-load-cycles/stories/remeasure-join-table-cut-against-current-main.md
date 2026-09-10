---
title: "Re-measure the join-table/model-schema cut on current main and rewrite both blockers"
status: in-progress
updated: 2026-09-10
rfc: "0144-adapter-module-load-cycles"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: tasks#98
claim: "2026-09-10T20:38:29Z"
assignee: "remeasure-join-table-cut-against-current-main"
blocked-by: null
closed-reason: null
---

## Context

RFC 0144's two remaining stories share a `blocked-by` that names a fix which has
since shipped, so neither premise can be trusted as written.

`break-schema-statements-join-table-cycle-blocking-module-eval-includes` records
that cutting `migration/join-table.ts -> model-schema.ts` with a zero-import
slot breaks the adapter cycle but reds the AR suite at collection time
(`Class extends value undefined` at `associations/collection-proxy.ts`), and
names the cause as `associations.ts:6` eagerly force-loading
`collection-proxy.ts`.

**That force-load is gone.** PR 7061 (merged 2026-08-25, "zero-import
CollectionProxy load") replaced it with the slot import that is on line 6 today:

```ts
import { _CollectionProxyCtor } from "./associations/collection-proxy-slot.js";
```

So the measurement behind both blockers predates its own fix. What has _not_
changed is line 3 of the same file — a bare side-effect import,
`import "./relation.js"` — which may carry the same load-order guarantee under a
different name. Nobody has re-run the cut since.

This story re-establishes the facts so the two blockers describe what actually
fails now, or so they can be unblocked.

## Acceptance criteria

- [ ] Against current main, cut `migration/join-table.ts -> model-schema.ts`
      with a zero-import slot and record what happens: `scripts/test-deps/`,
      `adapter-graph-import-tdz.test.ts`, and whether the AR suite still fails
      at collection time.
- [ ] If it still fails, name the surviving edge with the same specificity the
      original measurement used — a full import path, not "a cycle" — and say
      whether `associations.ts:3`'s `import "./relation.js"` is load-bearing.
- [ ] Verified by a plain-node import of the **built** `dist/**.js` modules,
      entered at each participant in turn. A vitest run does not count: it
      enters the funnel module first and masks the TDZ.
- [ ] Both `break-schema-statements-join-table-cycle-blocking-module-eval-includes`
      and `abstract-adapter-mixin-wiring-restore-module-eval` end this story
      either unblocked or carrying a `blocked-by` written from this measurement,
      with no reference to the retired `associations.ts:6` force-load.

## Definition of done

Editing the two blockers to delete the stale sentence, without re-running the
cut, does not close this story. The point is a current measurement, not a
tidier description of an old one.

## Verification

`pnpm vitest run scripts/test-deps/` and
`pnpm vitest run packages/activerecord/src/adapter-graph-import-tdz.test.ts`
with the cut applied locally, plus `node -e` imports of the built `dist`
modules entered at `relation.js`, `associations.js`, `model-schema.js` and
`collection-proxy.js`.

## Notes

May end with no production diff. If the cut now works, say so and unblock both
stories — that is the best outcome and it closes this one.
