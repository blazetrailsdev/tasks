---
title: "materialize-declares-generator-then-dynamic-import-misparse"
status: in-progress
updated: 2026-07-04
rfc: "0033-standalone-associations-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4557
claim: "2026-07-04T16:49:29Z"
assignee: "materialize-declares-generator-then-dynamic-import-misparse"
blocked-by: null
---

## Context

The `materialize-model-declares.ts` generator
(`packages/activerecord/scripts/materialize-model-declares.ts`) misparses
dynamic imports of the form `import("...").then((m) => m.Foo)` as a named
import of a symbol called `then`. Running it on
`packages/activerecord/src/associations/has-many-through-associations.test.ts`
produces a broken bake:

- It injects `import type { then } from "../test-helpers/models/cpk.js";`
- It rewrites existing dynamic-import call sites, e.g.
  `await import("../test-helpers/models/cpk.js").then((m) => m.CpkBookWithOrderAgreements)`
  becomes `await then((m) => m.CpkBookWithOrderAgreements)` (see
  `has-many-through-associations.test.ts:2349-2376`, tests
  "loading cpk association with unpersisted owner" and "cpk stale target").

This yields `ReferenceError: then is not defined` at runtime and is a
type-virtualization walker / generator bug: the walker treats the `.then`
member access on a dynamic `import(...)` Promise as an importable identifier.

Discovered in `materialize-declares-nested-remaining-bakes-followup` (PR TBD),
which baked the other clean files and skipped this one.

## Acceptance criteria

- [ ] Generator no longer treats `import("...").then(...)` member access as a
      named import; it leaves dynamic-import `.then` call sites untouched.
- [ ] Re-running the generator on `has-many-through-associations.test.ts`
      produces only valid `declare` accessors (no phantom `then` import, no
      rewritten dynamic-import sites).
- [ ] `has-many-through-associations.test.ts` bakes typecheck-green and its
      suite passes; bake it as part of this fix or hand back to the remaining
      bakes story.
