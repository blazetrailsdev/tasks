---
title: "TSE stand-in reads and writes free names live, as the with chain does"
status: in-progress
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 10
pr: trails#9196
claim: "2026-10-21T21:15:05Z"
assignee: "build-views-precompiles-every-registered-handler"
blocked-by: null
closed-reason: null
---

## Context

The emitted TSE stand-in (`packages/trails-tsc/src/plugins/tse.ts`, `__lookup`) reads each free name once, when the function starts. The run-time `with (TopLevel) { with (this) { with (__yield) { with (localAssigns) {…}}}}` chain in `packages/actionview/src/template.ts:404` resolves a name each time it is read. Three things differ:

1. A view property that changes during the render (such as `outputBuffer` during `capture`) is read stale.
2. Assigning to a view property inside a template writes the stand-in's local, not the view.
3. A name that is never defined reads `undefined` where `with` throws `ReferenceError`.

## Acceptance criteria

- Each free name compiles to a live read and write against the same chain: `locals` (non-strict only), then the view, then `TopLevel`, then `globalThis`. A miss throws `ReferenceError` at the point of use.
- Calls on the view still receive the view as `this`.
- The `tse-stand-in.test.ts` harness still matches the eval path, with a new case for a write to a view property and a case for the stale read.
