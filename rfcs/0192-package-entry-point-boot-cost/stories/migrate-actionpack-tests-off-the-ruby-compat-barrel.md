---
title: "actionpack: migrate test ruby-compat barrel imports to subpaths"
status: draft
updated: 2026-11-24
rfc: "0192-package-entry-point-boot-cost"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 800
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10707 moved `packages/actionpack/lib` off the `@blazetrails/ruby-compat` barrel (RFC 0192 Phase 2). It
left `packages/actionpack/test` and `dx-tests` alone to stay under the LOC ceiling. That codemod, which resolved
each binding's owning module with the TS checker against `packages/ruby-compat/lib/index.ts`, rewrote 301 files
(about 1900 lines including lib). Tests do not count toward boot cost, but they keep the
`from "@blazetrails/ruby-compat"` grep noisy.

## Acceptance criteria

- [ ] `grep -r 'from "@blazetrails/ruby-compat"' packages/actionpack/test packages/actionpack/dx-tests` returns 0
- [ ] Type-only bindings use `import type`
- [ ] The tests are unchanged and pass
