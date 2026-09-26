---
title: "trails destroy hand-lists files instead of invoking generators with behavior: :revoke"
status: done
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 6
pr: trails#8156
claim: "2026-09-26T18:22:02Z"
assignee: "named-route-helpers-camelcase-multiword-names"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8097. `packages/trailties/src/commands/destroy.ts` implements
`trails destroy model|controller|migration|scaffold` as hand-written `removeFile` lists
that recompute each generator's output paths (`app/models/${fileName}.ts`,
`${tableName}-controller.ts`, a `create_<table>` migration regex). It covers four
generators, drifts from what they actually emit (views, helpers and routes are not
removed for a scaffold), and covers nothing else.

Rails' destroy command (`railties/lib/rails/commands/destroy/destroy_command.rb`)
calls `Rails::Generators.invoke name, args, behavior: :revoke, destination_root:`.
Every generator action then runs its revoke arm: Thor `create_file` removes the file,
and `route` / `inject_into_file` un-inject.

## Acceptance criteria

- `trails destroy <generator> <args>` is `Generators.invoke(name, args, { behavior: "revoke" })`,
  mirroring `destroy_command.rb`, with no per-generator path lists.
- `GeneratorBase#createFile` and the route/injection actions honour
  `behavior: "revoke"` (the option already exists on `GeneratorOptions`).
- A destroy after a generate removes everything the generate created, including scaffold
  views, the helper and the routes line.
