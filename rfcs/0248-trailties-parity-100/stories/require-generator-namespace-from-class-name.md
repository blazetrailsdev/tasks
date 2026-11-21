---
title: "trailties: requireGenerator stops deriving namespaces from file paths"
status: claimed
updated: 2026-11-21
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-11-21T21:57:40Z"
assignee: "app-generator-css-tailwind-writes-tailwindcss-vite"
blocked-by: null
closed-reason: null
---

## Context

`requireGenerator` (`packages/trailties/lib/generators.ts:381-397`) sets each loaded generator's namespace from its file's directory (`klass.namespace(dirname.split("/").join(":"))`). Rails never does that. `Generators.lookup` only `require`s the file (`vendor/rails/v8.0.2/railties/lib/rails/generators.rb:283-300`), and the namespace comes from the class name (`Rails::Generators::Base.namespace`, `vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:54-57` → `Thor::Base.namespace` on `name`, with `_generator` removed). trails#10373 left a top-level generator on the class-name default; nested generators still get the path-derived namespace.

## Acceptance criteria

- [ ] `requireGenerator` makes no `klass.namespace(...)` call; every generator's namespace comes from `Base.namespace` on its Ruby class path, as Rails derives it.
- [ ] The generators tests (`generators.test.ts`, the find-by-namespace tests) pass unchanged.
