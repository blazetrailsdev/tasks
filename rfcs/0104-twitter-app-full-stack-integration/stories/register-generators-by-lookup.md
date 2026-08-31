---
title: "14 generators exist on disk but are unreachable from trails generate"
status: ready
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: null
priority: 61
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/generators/rails/` contains 16 generator
directories; `packages/trailties/src/commands/generate.ts` registers four
subcommands (`model`, `migration`, `controller`, `scaffold`) plus
`authentication`, which this RFC's app work wired up.

Unreachable from the CLI, each with an implementation on disk:

`benchmark`, `credentials`, `db`, `devcontainer`, `encrypted-file`,
`encryption-key-file`, `generator`, `helper`, `master-key`, `resource`,
`resource-route`, `scaffold_controller`, `script`, `task`.

`AuthenticationGenerator` was in this list despite having both a test file
and a `__snapshots__` directory — it was fully built and simply never
registered. That is the pattern: the generators exist and are tested in
isolation, but `generate.ts` was never extended past the original four, so
`trails generate authentication` answered `error: unknown command`.

Rails registers generators by lookup over the load path
(`vendor/rails/railties/lib/rails/generators.rb`, `Rails::Generators.find_by_namespace`),
so a generator file that exists is a generator you can run — there is no
separate registration list to fall out of sync.

## Acceptance criteria

- Every generator under `packages/trailties/src/generators/rails/` is
  invocable as `trails generate <name>`.
- Registration is by lookup rather than a hand-maintained list, mirroring
  `Rails::Generators.find_by_namespace`, so a new generator directory is
  reachable without editing `generate.ts`.
- `trails generate --help` lists them.
- A test asserts every generator directory has a reachable command.
