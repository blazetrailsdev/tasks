---
title: "Port Rails::DevCaching and the dev:cache command"
status: ready
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' generated `development.rb.tt:18-28` wraps the caching settings in
`if Rails.root.join("tmp/caching-dev.txt").exist?`, and its comment says to run
`rails dev:cache` to toggle them. That command is `Rails::Command::DevCommand#cache`
(`railties/lib/rails/commands/dev/dev_command.rb:8-11`), which calls
`Rails::DevCaching.enable_by_file` (`railties/lib/rails/dev_caching.rb`, where
`FILE = "tmp/caching-dev.txt"`).

trails has no dev command and no `DevCaching`. So since trails#8099 the
generated `development.ts` comment says "Create tmp/caching-dev.txt to toggle"
where Rails' says "Run rails dev:cache".

## Acceptance criteria

- `packages/trailties/src/dev-caching.ts` ports `Rails::DevCaching`
  (`enable_by_file`, `enable_by_argument`) with Rails' names and messages.
- `packages/trailties/src/commands/dev.ts` ports `DevCommand#cache`.
- The generated `development.ts` comment matches Rails':
  "Run trails dev:cache to toggle Action Controller caching."
- Rails' `railties/test/commands/dev_test.rb` is ported with verbatim test names.
