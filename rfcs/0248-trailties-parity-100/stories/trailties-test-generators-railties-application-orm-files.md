---
title: "trailties-test-generators-railties-application-orm-files"
status: draft
updated: 2026-11-25
rfc: "0248-trailties-parity-100"
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

Split from `trailties-test-generators-lookup-namespace-nesting`, whose PR ported
`vendor/rails/v8.0.5.2/railties/test/generators_test.rb:114` "find by namespace in subfolder" and `:159`
"rails generators does not show active record hooks" (and converged `Generators.hidden_namespaces`,
`railties/lib/rails/generators.rb:134-160`, and `print_list`'s `base.camelize`, `rails/command/behavior.rb:23-32`).
Still unported, all Miss:

- `vendor/rails/v8.0.5.2/railties/test/railties/generators_test.rb` (8)
- `vendor/rails/v8.0.5.2/railties/test/application/generators_test.rb` (8)
- `vendor/rails/v8.0.5.2/railties/test/generators/generator_test.rb` (2)
- `vendor/rails/v8.0.5.2/railties/test/generators/orm_test.rb` (2)

## Acceptance criteria

- [ ] Each test is ported under its Rails name and body into the mirrored `packages/trailties/test/...` file and passes.
- [ ] No Miss left for the four files in `pnpm parity:test -- --package trailties`.
