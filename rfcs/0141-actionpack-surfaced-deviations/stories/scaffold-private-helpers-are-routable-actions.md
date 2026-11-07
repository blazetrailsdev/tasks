---
title: "scaffold-private-helpers-are-routable-actions"
status: draft
updated: 2026-11-07
rfc: "0141-actionpack-surfaced-deviations"
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

# Scaffold controller's `private` helpers are routable actions

## Context

`packages/trailties/src/generators/trails/scaffold-controller/templates/controller.ts.tt:64-75`
emits `private async setPost()` and `private postParams()`. Rails' template
(`railties/lib/rails/generators/rails/scaffold_controller/templates/controller.rb.tt`)
puts them under `private`, so they are not actions. In trails the TS `private`
keyword is erased, so `AbstractController::Base.actionMethods`
(`packages/actionpack/src/abstract-controller/base.ts`, `ownPublicMethodNames`)
lists both and a dynamic `:action` segment can dispatch them. The blessed
non-action spelling is a `_` prefix or an ES `#private` method
(packages/actionpack/CLAUDE.md, "A non-action helper is `_`-prefixed or `#private`").

## Acceptance criteria

- The scaffold (and authentication generator templates with the same shape)
  emit `_setPost` / `_postParams` (callbacks name `":_setPost"`), so neither is
  in the generated controller's `actionMethods()`.
- Snapshots updated; a generator test pins that the helpers are not actions.
