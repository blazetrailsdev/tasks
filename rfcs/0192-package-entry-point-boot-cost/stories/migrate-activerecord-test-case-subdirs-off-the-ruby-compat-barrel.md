---
title: "activerecord: test/cases/*/ subdirectories off the ruby-compat barrel"
status: draft
updated: 2026-11-26
rfc: "0192-package-entry-point-boot-cost"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 560
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10789 (with #10777) moved every `from "@blazetrails/ruby-compat"` import in
`packages/activerecord/lib` onto the subpath that owns the binding, so `lib` now has 0.
`packages/activerecord/test` still has 664 barrel imports across 652 files. **This story covers `packages/activerecord/test/cases/*/` (every subdirectory; associations 107, adapters 42, relation 39, connection-adapters 32, …): 280 files.**
(`test/models`, `test/cases`, `test/cases/associations`, `test/support`, …).

Approach that worked for `lib`: resolve each imported name with the TS checker
(`typescript-5`) against `packages/ruby-compat/lib/index.ts`, take the declaring
source file as the subpath, check that the owning module exports the same name, and
emit `import type` for bindings that are types only. Then run prettier.

Pitfalls seen in #10789:

- A `vi.mock("@blazetrails/ruby-compat", …)` in a test stops intercepting once the
  consumer imports the subpath. In #10789 this made `trailties/test/commands/dbconsole.test.ts`
  hang, because the real `sqlite3` CLI ran. Mock the owning module instead
  (see `barrel-vi-mocks-target-owning-subpath`).
- The barrel's side-effect imports set up namespace members that only those modules
  define, e.g. `Concurrent.AtomicBoolean` (`ruby-compat/lib/concurrent/atomic-boolean.ts:50`),
  `Exception#detailedMessage` (`exc-detailed-message.ts`), `Kernel.rand`
  (`index.ts:628-635`). A test that reads one of these must import its owning
  module directly.

## Acceptance criteria

- [ ] No `from "@blazetrails/ruby-compat"` import remains under `packages/activerecord/test/cases/*/` (every subdirectory; associations 107, adapters 42, relation 39, connection-adapters 32, …)
- [ ] Every rewritten import names the module that owns the binding; type-only bindings are `import type`
- [ ] Any `vi.mock` of the barrel that a migrated consumer depends on targets the owning subpath
- [ ] The activerecord suite is unchanged in CI
