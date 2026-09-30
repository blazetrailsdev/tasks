---
title: "generated-app-needs-non-null-assertions-on-trails-application"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
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

`Trails.application` is typed `Application | null`
(`packages/trailties/src/rails.ts:20,40`). That's faithful: Rails' `Rails.application`
(`vendor/rails/v8.0.2/railties/lib/rails.rb:45`) is `nil` before an application
class is defined. But every generated file that runs after `config/application`
has loaded must assert it: `Trails.application!.configure(...)` in
`config/environments/{development,test,production}.ts`, and
`Trails.application!.config.filterParameters` in
`config/initializers/filter-parameter-logging.ts`.

Found auditing the types of a freshly scaffolded app (`trails new blog` + `generate scaffold Post title:string body:text`) on `main` `53a6249ae6`, while writing the README for PR #8195.

## Converged shape

The generated `config/application.ts` narrows the type for the app's own files, for
example with a `declare module "@blazetrails/trailties"` augmentation that types
`Trails.application` as the app's `Blog` class. The framework's own type stays
`Application | null`, so the Rails nil semantics are kept for code that runs before boot.
The generator templates drop every `!`.

## Acceptance criteria

- [ ] No file `trails new` generates contains `Trails.application!`, and the app still type-checks.
- [ ] `Trails.application.config` in an environment file is typed as the app's configuration.
