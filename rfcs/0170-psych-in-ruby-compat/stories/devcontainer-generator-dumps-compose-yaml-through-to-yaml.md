---
title: "Devcontainer generator: emit compose.yaml through to_yaml, not JSON"
status: draft
updated: 2026-09-30
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["trailties"]
deps: ["psych-object-to-yaml", "psych-libyaml-seam-without-top-level-await"]
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/devcontainer/devcontainer_generator.rb:42`
templates `devcontainer/compose.yaml`, and `:146-150`
`devcontainer_db_service_yaml` is `{ database.name => service }.to_yaml(**options)[4..-1]`.
trails (`packages/trailties/src/generators/rails/devcontainer/devcontainer-generator.ts:97,164-193`)
writes `JSON.stringify(...)` into `compose.yaml`. JSON is valid YAML, so
docker accepts it, but the file is not Rails' output and only JSON-aware code
can edit it.

## Acceptance criteria

- [ ] `compose.yaml` is produced from Rails' template shape, with the
      db-service fragment from `toYaml(...).slice(4)`.
- [ ] `devcontainer-generator.test.ts` asserts Rails' YAML text
      (`vendor/rails/v8.0.2/railties/test/generators/devcontainer_generator_test.rb`).

## Verification

`pnpm vitest run packages/trailties/src/generators/rails/devcontainer/`.
