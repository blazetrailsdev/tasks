---
title: "Every shipped framework .tse (trailties welcome page) is copied and precompiled at build"
status: claimed
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: 7
pr: null
claim: "2026-10-21T00:47:23Z"
assignee: "tse-undefined-local-raises-template-error"
blocked-by: null
closed-reason: null
---

## Context

trailties ships `packages/trailties/src/templates/rails/welcome/index.tse`, the page `WelcomeController` renders (`controllerPath` `rails/welcome`; Rails `vendor/rails/v8.0.2/railties/lib/rails/templates/rails/welcome/index.html.erb`). trailties' `build` copies only the migration generator templates into `dist` (`build:templates` in `packages/trailties/package.json`). The welcome template is neither copied nor precompiled, so from `dist` it is missing, and since trails#9149 a file-backed template with no emitted module raises `LoadError`. actionpack already copies and precompiles its shipped templates (`build` in `packages/actionpack/package.json`, `trails-tsc-views build --in-place`).

## Acceptance criteria

- trailties' `build` copies `src/templates/rails` into `dist` and runs `trails-tsc-views build --views dist/templates/rails --in-place`, as actionpack does. trails-tsc becomes a devDependency.
- Rendering the welcome page from the built package loads the emitted module; covered by a test.
- Every `.tse` that a shipped package renders at run time is precompiled in that package's build. Audit the tree and list each one in the PR.
