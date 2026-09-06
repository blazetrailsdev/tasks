---
title: "config.helpersPaths is never included into ActionController::Base (include_all_helpers)"
status: done
updated: 2026-09-06
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["actionpack", "actionview", "trailties"]
deps: ["actionpack-helper-glob-only-matches-ruby-file-names"]
deps-rfc: []
est-loc: 180
priority: null
pr: 7558
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced porting `webhook/markdown.go` into trailmap (trailmap#8). The pieces
for Rails' `include_all_helpers` are all present and none of them are wired
together, so an application's `app/helpers` is never included into
controllers or views. trailmap's renderer therefore ships as a plain exported
object a view imports by path rather than as a helper method — the workaround
is the finding.

What exists:

    packages/actionpack/src/abstract-controller/helpers.ts:202
      helperModulesFromPaths(paths, options)   — resolves a path list
    packages/trailties/src/engine.ts:245
      app.config.helpersPaths.unshift(...helpers)  — prepend_helpers_path
    packages/trailties/src/application/configuration.ts:26
      helpersPaths: string[] = []

What is missing: any non-test caller joining them. `grep -rn helpersPaths
packages/*/src` returns only the three trailties sites above — nothing in
actionpack or actionview reads the config, and `helperModulesFromPaths` has
no production caller at all. Rails does this in the
`AbstractController::Helpers` / `ActionController::Base` railtie
(`include_all_helpers`, defaulting true, honouring
`config.action_controller.include_all_helpers`).

`helper-methods-not-in-tse-scope` (done, #7285) made `helper` and
`helperMethod` reach `.tse` scope; this is the remaining half — nothing
populates them from `app/helpers` in the first place.

Depends on the kebab-case glob fix
[[actionpack-helper-glob-only-matches-ruby-file-names]]: wiring this up while
the glob only matches `*_helper` would include nothing in a real app.

## Expected shape

An initializer includes every module under `config.helpersPaths` into
`ActionController::Base`, gated by an
`config.actionController.includeAllHelpers` flag that defaults to true, so a
booted app's `app/helpers/*` are callable from controllers and `.tse`
templates with no import.

## Acceptance criteria

- A booted app calls a bare `renderMarkdown(...)` from a `.tse` with no
  import of the helper module.
- `includeAllHelpers = false` suppresses the inclusion, per Rails.
- Test names match Rails verbatim.
