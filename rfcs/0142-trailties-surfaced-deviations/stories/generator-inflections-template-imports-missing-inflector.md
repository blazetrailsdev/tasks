---
title: "generator-inflections-template-imports-missing-inflector"
status: draft
updated: 2026-11-12
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

`packages/trailties/lib/generators/trails/app/templates/config/initializers/inflections.ts.tt`
shows `import { Inflector } from "@blazetrails/activesupport"` and
`Inflector.inflections((inflect) => …)`. `@blazetrails/activesupport` exports
no `Inflector` (`packages/activesupport/lib/index.ts:138` exports
`inflections(locale = "en", block)` from `inflector/inflections.ts:198`), so
uncommenting the generated file fails at import with
`SyntaxError: … does not provide an export named 'Inflector'`.

Rails' template is
`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/config/initializers/inflections.rb.tt`
(`ActiveSupport::Inflector.inflections(:en) do |inflect| … end`).

Found while booting `examples/twelve-dollar-server`, which needs
`inflect.acronym("JWT")` so Zeitwerk maps `lib/jwt.ts` to `JWT`.

## Acceptance criteria

- The template's commented example imports and calls a name
  `@blazetrails/activesupport` actually exports, matching Rails'
  `ActiveSupport::Inflector.inflections(:en)` shape (either export the
  `Inflector` namespace or spell the call `inflections("en", …)`).
- A generator test that uncomments / evaluates the template, or asserts the
  imported name resolves.
