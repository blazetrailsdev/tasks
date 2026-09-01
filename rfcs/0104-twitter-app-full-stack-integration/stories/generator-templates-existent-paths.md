---
title: "generator-templates-existent-paths"
status: in-progress
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 63
pr: 7353
claim: "2026-09-01T18:42:23Z"
assignee: "converge-configuration-root-lazy-find-root"
blocked-by: null
closed-reason: null
---

## Context

`Application#ensureGeneratorTemplatesAdded`
(`packages/trailties/src/application.ts`) ports
`vendor/rails/railties/lib/rails/application.rb:631-634`:

```ruby
def ensure_generator_templates_added
  configured_paths = config.generators.templates
  configured_paths.unshift(*(paths["lib/templates"].existent - configured_paths))
end
```

The trails port only ensures `config.generators().templates` exists — it
skips the `paths["lib/templates"].existent` scan and carries a
`@missingRailsCall existent` tag, because `Path#existent`
(`packages/trailties/src/paths.ts:147`) is async while initializers run
synchronously (`Initializable#runInitializers`,
`packages/trailties/src/initializable.ts:167-175`).

## Acceptance criteria

- `ensureGeneratorTemplatesAdded` unshifts the existent
  `paths["lib/templates"]` directories (minus those already configured)
  onto `config.generators().templates`, matching Rails.
- The `@missingRailsCall existent` tag on the method is deleted.
- A test asserts an existing `lib/templates` directory lands ahead of a
  pre-configured template path.
