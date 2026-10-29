---
title: "import-cycles: count reads in local functions called at module-eval time"
status: draft
updated: 2026-10-29
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/parity/import-cycles.ts` (trails#9434) treats every read inside a function, method or arrow body as deferred, unless the function expression is called where it is written (`isInvokedInPlace`, called from `isModuleEvalTime`). A module-level call of a function declared in the same file still runs that function's body while the module evaluates:

```ts
import { B } from "./b.js";
function f() {
  return B;
}
const x = f(); // reads B at module-eval time
const g = () => B;
g(); // same
```

`scanFile` records these edges with empty `evalNames`, so a TDZ hazard inside a cycle goes uncounted (reviewer finding on trails#9434). This is tooling with no Rails counterpart; it serves CLAUDE.md § "Call-time constant resolution".

## Acceptance criteria

- `scanFile` collects the file's local function declarations and `const` function or arrow bindings. A module-eval call of one, directly or through other local functions with a visited set, adds that body's reads of imported names to `evalNames`.
- Tests in `scripts/parity/import-cycles.test.ts` cover both shapes above, plus a helper that is defined but only called from a method, which stays deferred.
- Any newly surfaced edges are converged, or added as rows owned by `converge-module-eval-import-cycle-edges` in the same PR. Never add rows silently.
