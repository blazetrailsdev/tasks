---
title: "trails-tsc-views: an unknown name in a template types as any, so tsc accepts it"
status: draft
updated: 2026-10-28
rfc: "0142-trailties-surfaced-deviations"
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

From trailmap#89 (`trailmap-uses-csrf-meta-tags-and-type-checks-view-shims`). trailmap's `tsconfig.json`
now includes `.trails/views`, and `tsc --noEmit` is clean, but `<%= noSuchHelper() %>` in a layout
still type-checks. The generated shim declares each bare name as
`__lookup("noSuchHelper", true) as Scope<"noSuchHelper">`, and `Scope<K>` falls through
`ObjectLocals`, `View`, `TopLevel` and `globalThis` to `any`. So an unknown name is `any`, and
calling it compiles.

## Acceptance criteria

- [ ] A name that is not a local, a view/helper member, a `TopLevel` constant or a global is a
      compile error in the shim, not `any`.
- [ ] A trails-tsc-views test asserts that a template calling an unknown helper fails to type-check.
