---
title: "rbModConstSet(Object, …) does not write the top-level constant table constantize reads"
status: draft
updated: 2026-10-28
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rbModConstSet(Object, id, value)` (`packages/ruby-compat/src/include.ts:102-126`) defines `Object[id]` and a classpath, but it does not write `RCLASS_CONST_TBL` (`object.ts:143`). That table is what `registerConstant`, `constantize` (`packages/activesupport/src/inflector.ts:194-224`, which reads only the table at the first segment) and `rbPathToClass` read. In MRI, `rb_const_set` on `rb_cObject` (`vendor/ruby/v3.3.11/variable.c:3674`) is the one top-level table. So a test that seats `rbModConstSet(Object, "ViewLoadPathsTest", …)` (`packages/actionview/src/actionpack/controller/view-paths.test.ts:78`) is invisible to `constantize("ViewLoadPathsTest::…")`. That surfaced on trails#9406.

Adding `if (mod === Object) RCLASS_CONST_TBL.set(id, value)` was tried and reverted with the helpers change; it was not evaluated on its own.

## Acceptance criteria

- [ ] `rbModConstSet(Object, …)` and `registerConstant` write the same table.
- [ ] A ruby-compat test asserts that `constantize` resolves a constant seated by `rbModConstSet(Object, …)`.
