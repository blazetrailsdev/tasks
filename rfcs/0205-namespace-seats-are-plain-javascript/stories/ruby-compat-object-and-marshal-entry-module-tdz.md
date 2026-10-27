---
title: "ruby-compat: dist/object.js and dist/marshal.js throw a classpaths TDZ as entry modules"
status: ready
updated: 2026-10-27
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while verifying trails#8853's `object.ts` -> `variable.ts` import. After `pnpm build`, a
plain-node import of `packages/ruby-compat/dist/object.js` or `dist/marshal.js` as the ENTRY module
throws `ReferenceError: Cannot access 'classpaths' before initialization`, raised from
`dist/include.js` (the `include(rbCTime, rbMComparable)` block at the foot of
`packages/ruby-compat/src/include.ts`, which runs while `object.ts`'s module body is still
suspended on its own imports). `dist/index.js`, `dist/include.js` and `dist/variable.js` import
cleanly as entries. `object.js` with the #8853 import stripped throws the same error, so the cycle
predates that PR: `object.ts` reaches `include.ts` through its string / hash imports, and
`include.ts` reads `classpaths` and the `rbC*` seats from `object.ts` at module-eval time.

CLAUDE.md, "Call-time constant resolution" requires both directions of a cycle to be verified with
a plain-node import of the built modules as entry modules; a vitest run enters through the funnel
module and masks the TDZ. `packages/ruby-compat/src/object.ts` documents the same hazard for
`rbCNumeric` ("an `extends rbCNumeric` reads the binding before this module body has run whenever
this module is entered first").

## Acceptance criteria

- [ ] Every module in `packages/ruby-compat/dist/` imports cleanly as a plain-node entry module,
      `object.js` and `marshal.js` included.
- [ ] A test or CI step imports each built ruby-compat module as an entry, so a new module-eval
      read across the `object` / `include` cycle fails there.
- [ ] The entry modules named by the two stories closed into this one also load:
      `dist/struct.js` (`ruby-compat-object-struct-marshal-entry-module-tdz-on-classpaths`:
      `object.ts` imports `registeredConstant` from `variable.ts`, whose top-level
      `registerConstant` calls read `classpaths` from `object.ts`), and `dist/file.js`,
      `dist/io.js` and `dist/psych/visitors/yaml-tree.js`
      (`ruby-compat-dist-file-io-classpaths-tdz`). The fix is a sanctioned shape from
      CLAUDE.md § "Call-time constant resolution" (each defining module seats its own
      constant, as `rb_define_class` does), not a guard or a reordered import.
