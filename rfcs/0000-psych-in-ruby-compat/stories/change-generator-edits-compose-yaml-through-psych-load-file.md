---
title: "db:system:change generator: edit compose.yaml through YAML.load_file / to_yaml"
status: draft
updated: 2026-09-29
rfc: "0000-psych-in-ruby-compat"
cluster: fidelity
packages: ["trailties"]
deps:
  [
    "psych-load-file-family",
    "psych-object-to-yaml",
    "devcontainer-generator-dumps-compose-yaml-through-to-yaml",
  ]
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

`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/db/system/change/change_generator.rb:120-145`
`edit_compose_yaml`: `YAML.load_file(compose_yaml_path)`, mutate
`services` / `volumes`, then `File.write(path, compose_config.to_yaml)`.
trails (`packages/trailties/src/generators/rails/db/system/change/change-generator.ts:172-200`)
uses `JSON.parse` / `JSON.stringify`, and throws its own
"Could not parse …" error on a block-style YAML file.

## Acceptance criteria

- [ ] `editComposeYaml` calls `YAML.loadFile` / `toYaml`, and the invented
      parse-error wrapper is deleted.
- [ ] `change-generator.test.ts` cases from
      `vendor/rails/v8.0.2/railties/test/generators/db_system_change_generator_test.rb` run
      against block-style YAML.

## Verification

`pnpm vitest run packages/trailties/src/generators/rails/db/system/change/`.
