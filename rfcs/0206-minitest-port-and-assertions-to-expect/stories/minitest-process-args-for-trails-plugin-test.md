---
title: "Port Minitest.process_args so the rails plugin test parses -b / --backtrace"
status: draft
updated: 2026-11-12
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Minitest.process_args` (minitest gem, `lib/minitest.rb`) is unported. Rails' plugin test helper
`with_plugin(*args)` (`vendor/rails/v8.0.2/railties/test/minitest/rails_plugin_test.rb:83-94`)
calls `Minitest.process_args(args)` then `Minitest.plugin_rails_init(options)`. The trails port
(`packages/trailties/test/minitest/trails-plugin.test.ts`, `withPlugin`) takes a pre-parsed
`{ fullBacktrace }` object instead, so the `-b` arm of "does not replace backtrace filter when using
--backtrace option" (`rails_plugin_test.rb:41-43`) has no distinct input and is dropped with a receipt in
`scripts/test-compare/assertion-receipts/trailties.ts` (trails#10014).

## Acceptance criteria

- Port `Minitest.process_args` at its minitest name into @blazetrails/minitest, parsing `--backtrace` / `-b`
  into `fullBacktrace` (plus whatever other options it already has seats for).
- `withPlugin` takes `...args` and calls `Minitest.processArgs(args)` like Rails' helper.
- Restore the `-b` arm in trails-plugin.test.ts and delete its assertion receipt.
