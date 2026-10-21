---
title: "actionview: remaining super-calling modules are plain objects (Context, TagHelper, UrlHelper, Rendering, Layouts, RoutingUrlFor…)"
status: ready
updated: 2026-10-21
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: conversion
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`actionview-drop-ruby-compat-module-class` (trails#9050) converted the actionview modules with no `super`. On origin/main (2026-10-21), these are still ruby-compat `new Module(...)`, most because they call `superMethod(` or a `super` reaches them (RFC 0197 § "Module `super` is inlined"):

- `context.ts` `Context` (reached from `RenderingHelper#_layout_for`, `rendering_helper.rb:207-215`)
- `helpers.ts` `Helpers`
- `helpers/active-model-helper.ts` `ActiveModelHelper`, `ActiveModelInstanceTag` (`object`, `contentTag`, `tag` super into `TagHelper`, `active_model_helper.rb:20-26`)
- `helpers/rendering-helper.ts` `RenderingHelper`; `helpers/tag-helper.ts` `TagHelper`; `helpers/url-helper.ts` `UrlHelper`
- `layouts.ts` `LayoutConditions`, `Layouts`; `rendering.ts` `Rendering` (`process`, `_processFormat`, `_normalizeArgs`)
- `routing-url-for.ts` `RoutingUrlFor` (`urlFor`, `urlOptions`, `optimizeRoutesGeneration` super into `UrlHelper` / actionpack `UrlFor`)
- `lookup-context.ts` `Accessors`
- `test-helpers/active-record-unit.ts:101`, `test-helpers/fixtures/helpers/abc-helper.ts`, `helpery-test-helper.ts`

Some `super` targets live in actionpack (`AbstractController::Rendering`, `ActionDispatch::Routing::UrlFor`), so this story may have to land with, or after, `actionpack-module-super-inlined-into-includers`.

## Acceptance criteria

- Each module above is a plain-object or class module. Each module `super` is inlined into its includers with `@inlinedFrom` (closed includer set), or written as `rbCallSuper` (open includer set), per RFC 0197.
- `git grep -nE 'new Module\(|\.superMethod\(' -- packages/actionview/src ':!*.test.ts'` is empty.
- `parity:api:extra:gate`, `parity:api:calls`, `parity:api:calls:args` and `parity:api:inlined` are green.
