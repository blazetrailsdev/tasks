---
title: "Port Psych.load_file / unsafe_load_file"
status: draft
updated: 2026-09-29
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["ruby-compat"]
deps: ["psych-load-and-safe-load"]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/ruby/v3.3.11/ext/psych/lib/psych.rb:647-674`: each opens the file `'r:bom|utf-8'` and passes
`filename:` plus `fallback: false` (`unsafe_load_file`) or
`fallback: nil` (`load_file`). `safe_load_file` (`:658`) has no Rails
caller and is not ported. Callers:
`vendor/rails/v8.0.2/activesupport/lib/active_support/configuration_file.rb:26`
(`YAML.unsafe_load_file(@content_path, **options)`), i18n
`vendor/i18n/v1.14.8/lib/i18n/backend/base.rb:264`
(`YAML.unsafe_load_file(filename, symbolize_names: true, freeze: true)`), and
`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/db/system/change/change_generator.rb:124`
(`YAML.load_file`).

## Acceptance criteria

- [ ] The two functions read through ruby-compat `File`, strip a UTF-8 BOM,
      forward `filename` (it shows up in `SyntaxError` messages) and use the
      per-function `fallback` defaults above. `unsafe_load_file` of an empty
      file returns `false`.
- [ ] Tests and README rows are added.

## Verification

`pnpm vitest run packages/ruby-compat/src/psych*.test.ts`.
