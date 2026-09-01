---
title: "Port ExecutionWrapper/Executor and the full ActiveSupport::Reloader"
status: in-progress
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: 50
pr: 7362
claim: "2026-09-01T20:35:26Z"
assignee: "rack-input-binary-safe"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/reloader.ts` ports only the `:prepare` callback
surface of `ActiveSupport::Reloader`
(`vendor/rails/activesupport/lib/active_support/reloader.rb:34` `to_prepare`,
`:95` `prepare!`) — enough for `Rails::Application::Finisher`'s
`add_to_prepare_blocks` / `run_prepare_callbacks` and for
`Application#reloader` (`application.rb:123`).

Missing, all documented in the file header:

- the `ExecutionWrapper` superclass
  (`activesupport/lib/active_support/execution_wrapper.rb`) and
  `ActiveSupport::Executor` (`executor.rb`), so `run!`, `complete!`,
  `to_run`, `to_complete` and `wrap` (reloader.rb:62-83) are absent;
- the `:class_unload` callbacks and `before_class_unload` /
  `after_class_unload` (reloader.rb:30-46, :123-130);
- `check` / `check!` / `reloaded!` / `reload!` (reloader.rb:50-92) and the
  `Dependencies::Interlock` unload lock (reloader.rb:100-119).

`packages/activesupport/src/reloader.test.ts` holds the Rails
`reloader_test.rb` names as skipped stubs; `test_prepare_callback` itself
exercises `to_complete` and `wrap`, so it cannot be unskipped until the
wrapper lands.

## Acceptance criteria

- `ActiveSupport::ExecutionWrapper` and `ActiveSupport::Executor` are ported
  with the Rails names and bodies; `Reloader extends ExecutionWrapper`.
- The `:class_unload` callbacks, `check`/`check!`/`reloaded!`/`reload!` and
  `wrap` are ported.
- The skipped cases in `reloader.test.ts` and `executor.test.ts` are
  unskipped against the real classes, names unchanged.
