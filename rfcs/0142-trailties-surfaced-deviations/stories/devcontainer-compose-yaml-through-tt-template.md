---
title: "Devcontainer generator renders compose.yaml from its .tt template"
status: draft
updated: 2026-10-15
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails renders `.devcontainer/compose.yaml` from the ERB template
`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/devcontainer/templates/devcontainer/compose.yaml.tt`
via `template "devcontainer/compose.yaml"` in `devcontainer_generator.rb`. trails#8925 builds the
YAML inline in `packages/trailties/src/generators/rails/devcontainer/devcontainer-generator.ts`
(`composeYaml`, tagged `@noRailsEquivalent PERMANENT`) because trailties has no `.tt` template
renderer; only the db service fragment goes through `toYaml(...)`.

## Acceptance criteria

- Ship the compose.yaml template as a trailties template file mirroring compose.yaml.tt, rendered through Thor's `template` action.
- Delete `composeYaml` and its receipt; the generator calls `template("devcontainer/compose.yaml")` as Rails does.
- Existing devcontainer generator tests stay green.
