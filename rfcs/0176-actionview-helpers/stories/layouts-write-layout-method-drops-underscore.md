---
title: "layouts-write-layout-method-drops-underscore"
status: ready
updated: 2026-10-16
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails `_write_layout_method` (vendor/rails/v8.0.2/actionview/lib/action_view/layouts.rb:285) tests `/\blayouts/.match?(_implied_layout_name)` directly. The port at packages/actionview/src/layouts.ts:86 tests `underscore(impliedLayoutName)`, which adds an `underscore` call Rails does not make. This was raised in review of trails#8953.

## Acceptance criteria

- [ ] `_writeLayoutMethod` matches `/\blayouts/` against `impliedLayoutName` as Rails does, with no `underscore` call.
- [ ] Layout lookup tests still pass.
