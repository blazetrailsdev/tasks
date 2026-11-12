---
title: "Port ViteRuby::Builder, Build, Commands, Runner and CompatibilityCheck"
status: draft
updated: 2026-11-12
rfc: "0239-vite-assets-port"
cluster: vite-assets
packages: [vite-assets]
deps: [vite-assets-core-package]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `vite-assets-core-package` to keep each PR under the est-loc ceiling.
The files are in `vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/`:
`builder.rb`, `build.rb`, `commands.rb`, `runner.rb`, `io.rb` and
`compatibility_check.rb`. `Runner` shells out to the npm `vite` binary, and
`Builder` decides whether a build is stale from the digest that `Build`
records. Upstream tests in `vendor/vite_ruby/v3.11.1/test/`:
`builder_test.rb`, `runner_test.rb`, `commands_test.rb`,
`compatibility_check_test.rb`.

## Acceptance criteria

- Each file is ported under its Rails name into `packages/vite-assets/lib/`.
  The subprocess call goes through the settled trails child-process idiom
  instead of `Open3`, with a receipt.
- `Builder`'s staleness check reads the same digest file at the same path
  as the gem.
- The four test files are ported under their upstream names, against the
  `test/test_app` fixture tree that `vite-assets-core-package` copied in.
