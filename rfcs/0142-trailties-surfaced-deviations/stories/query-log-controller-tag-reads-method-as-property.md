---
title: "query-log controller tag reads controllerName as a property and logs the function source"
status: draft
updated: 2026-11-22
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/lib/trailties/action-controller.ts:174-176` defines the `controller` query-log tag as
`context.controller?.controllerName`, but `controllerName` is a method on `AbstractController::Base`
(`packages/actionpack/lib/abstract-controller/base.ts`), so the SQL comment carries the function source:
`controller='controllerName()%20%7B...'` (seen 2026-11-21 in a generated app's log, trails#10547). The `action` tag reads `actionName` the same way.
Rails: `controller: ->(context) { context[:controller]&.controller_name }` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/railtie.rb:121`).

## Acceptance criteria

- The tag calls `controllerName()` (and reads `actionName` with whatever shape the controller exposes), so a request's SQL comment reads `controller='posts'`.
- A test asserts the tag's value for a controller context.
