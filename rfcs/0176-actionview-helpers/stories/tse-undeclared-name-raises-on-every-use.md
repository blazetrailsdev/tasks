---
title: "tse-undeclared-name-raises-on-every-use"
status: done
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9161
claim: "2026-10-21T02:16:27Z"
assignee: "tse-undeclared-name-raises-on-every-use"
blocked-by: null
closed-reason: null
---

## Context

trails#9161 made an undeclared TSE name raise. A name that misses every scope in the stand-in's `__lookup` (`packages/trails-tsc/src/plugins/tse.ts`, `virtualizeTseWithDeltas`) gets back a Proxy over a raising function. The Proxy raises `ReferenceError` on get, has, apply, construct and set. Ruby raises `NameError` on any read of an undefined local (`vendor/rails/v8.0.2/actionview/lib/action_view/template.rb:560-578` wraps it in `Template::Error`). The Proxy misses every use that never touches it: `x ?? "d"`, `x == null`, `x === undefined`, `if (x)`, `!x`, `x || ""`. In each of these the sentinel reads as truthy and non-null, so no error is raised.

The converged shape raises at each reference: rewrite each non-`typeof` reference to an unbound name in the emitted body into a raising read, keeping line mappings, and drop the Proxy.

## Acceptance criteria

- [ ] `<%= x ?? "d" %>`, `<% if (x) %>`, `<%= !x %>`, `<%= x || "" %>` and `<%= x == null %>` raise `ReferenceError` for an undeclared `x`. Covered in `packages/trails-tsc/src/plugins/tse.test.ts`.
- [ ] `typeof x` still reads `"undefined"`, and a raise inside a `try` is still caught there.
