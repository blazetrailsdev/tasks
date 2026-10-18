---
title: "lookup re-raises a nested module-not-found as Rails' LoadError arm does"
status: draft
updated: 2026-10-18
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Command::Behavior#lookup` (`vendor/rails/v8.0.2/railties/lib/rails/command/behavior.rb:40-46`)
re-raises any `LoadError` whose message does not end with the command's own path, for example a
`require` inside the command file that fails. Only other exceptions get
`warn "[WARNING] Could not load ..."` and fall through to the next candidate.

trails' `lookup` (`packages/trailties/src/command/behavior.ts`, trails#9015) rescues only
ruby-compat's `LoadError`. A failing `import()` inside a command module throws Node's native
`Error` with `code: "ERR_MODULE_NOT_FOUND"`. That error is not a `LoadError`, so it takes the
warn arm, and a missing dependency inside a command warns where Rails raises.

## Acceptance criteria

- A nested module-not-found raised while loading a command re-raises out of `lookup`, as Rails'
  `raise unless /#{Regexp.escape(path)}$/.match?(e.message)` does. Converge it by having the
  load-path thunks surface Node's not-found error as ruby-compat `LoadError`, so `lookup`'s body
  keeps exactly Rails' two rescue arms.
- A test mocks a command module to throw `ERR_MODULE_NOT_FOUND` and asserts that `findByNamespace`
  rejects.
