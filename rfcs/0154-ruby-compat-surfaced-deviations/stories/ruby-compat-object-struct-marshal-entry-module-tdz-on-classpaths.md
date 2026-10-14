---
title: "ruby-compat: object.js, struct.js and marshal.js throw a classpaths TDZ when loaded as entry modules"
status: draft
updated: 2026-10-14
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Loading the built `packages/ruby-compat/dist/object.js`, `dist/struct.js` or `dist/marshal.js` directly as a Node entry module throws `ReferenceError: Cannot access 'classpaths' before initialization`. Observed on the merge commit of trails#8879 (24c04cf964):

```bash
cd packages/ruby-compat
node -e "import('./dist/object.js')"   # Cannot access 'classpaths' before initialization
node -e "import('./dist/struct.js')"   # same
node -e "import('./dist/marshal.js')"  # same
node -e "import('./dist/index.js')"    # ok; variable.js, psych.js, include.js are ok too
```

The cycle: `src/object.ts:18` imports `registeredConstant` from `./variable.js`, and `src/variable.ts:6` imports `classpaths` from `./object.js`. `variable.ts:316-326` calls `registerConstant(...)` at module top level, and `registerConstant` (`variable.ts:46-57`) reads `classpaths` for any class-valued constant. Entering the graph at `object.js` evaluates `variable.js` first, while `classpaths` (declared in `object.ts`) is still in TDZ. `struct.ts:3` and `marshal.ts` import `object.js`, so they enter the same way.

trails#8879 added `import { Struct } from "./struct.js"` and `registerConstant("Struct", Struct)` (`variable.ts:9,323`), needed for `class_loader.struct` (`vendor/ruby/v3.3.11/ext/psych/lib/psych/class_loader.rb`). Whether the TDZ predates that PR is NOT established: the only older build available was too stale to compare. `git bisect` over `variable.ts` / `object.ts` with a forced build per step would settle it.

vitest enters through the funnel module and masks this (CLAUDE.md § "Call-time constant resolution"), so the suite is green.

## Acceptance criteria

- A plain-node import of each built `packages/ruby-compat/dist/*.js` as an entry module succeeds; in particular `object.js`, `struct.js`, `marshal.js`.
- The fix is one of the sanctioned shapes in CLAUDE.md § "Call-time constant resolution": the top-level `registerConstant` seats move to where `classpaths` is already initialised (each defining module seats its own constant, as Ruby's `rb_define_class` does), not a guard around the read.
- A regression check imports every built ruby-compat module as an entry module, and is verified to fail before the fix.
