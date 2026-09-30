---
title: "Converge NamedBase onto Thor's argument :name and its template override"
status: ready
updated: 2026-09-30
rfc: "0171-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "generator-base-thor-initialize-arguments-and-options-parse",
    "converge-generator-base-file-actions-onto-thor-actions",
  ]
deps-rfc: []
est-loc: 350
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Generators::NamedBase` (`vendor/rails/v8.0.2/railties/lib/rails/generators/named_base.rb`, 227 lines) declares
`argument :name, type: :string` and `class_option :skip_namespace` / `:skip_collision_check`
(`:10-12`). It overrides `Thor::Actions#template` (`:20-27`) so a skipped-behavior run can tell
whether the file would be created. Its `initialize` (`:14-17`) calls `super` and
`assign_names!(name)`. trailties' `packages/trailties/src/generators/named-base.ts` (188 lines) takes `name` through its
constructor options and has no `template` override.

## Acceptance criteria

- [ ] `NamedBase` declares `argument("name", ...)` and reads `this.name` through Thor's
      accessor. The constructor option is removed.
- [ ] `template` is overridden as `named_base.rb:20-27` does (`with_indentation`,
      `inside(template_path)`), calling Thor's through `super`.
- [ ] `named_base.rb` reads complete in `parity:api --package trailties`.
