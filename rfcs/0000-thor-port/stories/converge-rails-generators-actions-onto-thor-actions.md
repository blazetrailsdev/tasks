---
title: "Converge Rails::Generators::Actions (generate, rake, git, environment, route, initializer, …) onto Thor's run / in_root / inject actions"
status: draft
updated: 2026-09-30
rfc: "0000-thor-port"
cluster: null
packages: ["trailties"]
deps:
  [
    "generator-base-thor-initialize-arguments-and-options-parse",
    "converge-generator-base-file-actions-onto-thor-actions",
    "port-thor-actions-module",
  ]
deps-rfc: []
est-loc: 550
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Generators::Actions` (`vendor/rails/v8.0.2/railties/lib/rails/generators/actions.rb`, 532 lines) is built on Thor. `execute_command`
(`:461-473`) is `in_root { run(...) }`. `environment` / `route` / `initializer` / `lib` /
`vendor` / `rakefile` use `inject_into_file`, `append_file` and `create_file`. `git` and `gem`
go through `run` and `append_file` / `inject_into_file`. `log` is `say_status`.

trailties splits the port across `packages/trailties/src/generators/actions.ts` (117 lines: `log`, `generate`, `git`,
`afterInstall`, `rake`, `executeCommand`, `optimizeIndentation`) and
`packages/trailties/src/generators/trails-actions.ts` (270 lines: `pkg`, `route`, `environment`, `initializer`, and more).
Both use `getChildProcess().spawnSync` and a local `requireAsyncFs`, not Thor.

## Acceptance criteria

- [ ] Each Rails `actions.rb` method that trails ports lives in `generators/actions.ts` at its
      Rails name and calls the Thor actions its Rails body calls (`in_root`, `run`,
      `inject_into_file`, `append_file`, `create_file`, `say_status`). The `spawnSync` calls and
      `requireAsyncFs` are gone.
- [ ] Members with no Rails counterpart that stay in `trails-actions.ts` (for example `pkg`, the
      npm analogue of `gem`) carry receipts.
- [ ] `parity:api:calls` rows for `actions.rb` converge (delete and `tighten`).
