---
title: "layouts-write-layout-method-drops-underscore"
status: closed
updated: 2026-10-17
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-17T11:34:30Z"
assignee: "actionview-url-and-sanitize-helper-concerns-and-sanitizer-memos"
blocked-by: null
closed-reason: "FALSIFIED: trails' _impliedLayoutName dasherizes controller_path (ratified kebab-case file names, view-paths.ts @inventedArm dasherize PERMANENT), so 'controller-layouts/implicit' has a \\b before 'layouts' where Rails' 'controller_layouts/implicit' does not; underscore() restores Rails' match. Dropping it reds RenderLayoutTest 'rendering a normal template, but using an implicit NAMED layout' and 'rendering a renderable object, using the implicit layout'."
---

## Context

Rails `_write_layout_method` (vendor/rails/v8.0.2/actionview/lib/action_view/layouts.rb:285) tests `/\blayouts/.match?(_implied_layout_name)` directly. The port at packages/actionview/src/layouts.ts:86 tests `underscore(impliedLayoutName)`, which adds an `underscore` call Rails does not make. This was raised in review of trails#8953.

## Acceptance criteria

- [ ] `_writeLayoutMethod` matches `/\blayouts/` against `impliedLayoutName` as Rails does, with no `underscore` call.
- [ ] Layout lookup tests still pass.
