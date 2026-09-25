---
title: "Engine never loads lib/tasks, so generated and hand-written app tasks are dead code"
status: ready
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 150
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by the trailmap Rails-idiom audit. The generator creates `lib/tasks/`
(`packages/trailties/src/generators/app-generator.ts:899`), and
`trails generate task` writes files into it
(`packages/trailties/src/generators/rails/task/task-generator.ts:15`). The
engine declares the path (`packages/trailties/src/engine/configuration.ts:62`,
`paths.add("lib/tasks", { glob: "**/*.{ts,js}" })`). Nothing ever loads it: no
engine code reads `paths.get("lib/tasks")`, and `Trailtie#runTasksBlocks`
(`packages/trailties/src/trailtie.ts:129`) runs only the registered
`rakeTasks` blocks. A generated task is dead code.

Rails' `Engine#run_tasks_blocks`
(`railties/lib/rails/engine.rb:685-688`) calls `super`, then
`paths["lib/tasks"].existent.sort.each { |ext| load(ext) }`. That is how
`bin/rails <app task>` finds application tasks.

This is why trailmap's operational tooling (`scripts/equivalence.ts`,
`scripts/page-equivalence.ts`, `scripts/gate-page-snapshot.ts`) is run with
`tsx scripts/...` from `package.json`. Each script also establishes its own
connection (`scripts/equivalence.ts:62`, `scripts/page-equivalence.ts:116`)
rather than depending on the environment the way a `task gate: :environment`
would.

## Acceptance criteria

- `Engine` overrides `runTasksBlocks` to call `super`, then load every existent
  `lib/tasks` file in sorted order, mirroring `engine.rb:685-688`.
- `trails <namespace>:<task>` runs a task defined in an app's
  `lib/tasks/*.ts`, with the dispatch added to the CLI if it has none. A
  boot-app fixture proves it end to end.
- The task generator's output is loadable by that mechanism: a generated task
  file runs through `trails <namespace>:<action>`.
