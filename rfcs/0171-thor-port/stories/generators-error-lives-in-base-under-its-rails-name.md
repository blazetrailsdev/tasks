---
title: "generators-error-lives-in-base-under-its-rails-name"
status: draft
updated: 2026-10-29
rfc: "0171-thor-port"
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

`Rails::Generators::Error < Thor::Error` is defined in
`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:14`, and every Rails generator raises it as
bare `Error`. trails ports it as `GeneratorError` in
`packages/trailties/src/generators/generated-attribute.ts:7`. That is the wrong name in the wrong file:
31 references across 13 files, including `AppBase#applyRailsTemplate` (trails#9462) and
`AppGenerator`'s constructor.

## Acceptance criteria

- [ ] `generators/base.ts` exports `class Error extends Thor's Error`. `GeneratorError` and its
      `generated-attribute.ts` home are removed.
- [ ] Every raise site uses the moved class. `parity:api` pairs `Rails::Generators::Error` with it.
