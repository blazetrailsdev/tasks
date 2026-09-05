---
title: "ControllerRuntime writes camelCase payload keys and never ports log_process_action"
status: ready
updated: 2026-09-05
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Railties::ControllerRuntime`
(`vendor/rails/activerecord/lib/active_record/railties/controller_runtime.rb`)
diverges from its port in `packages/activerecord/src/trailties/controller-runtime.ts`
in three ways, all surfaced while converging the actionpack half in #7501.

- **`append_info_to_payload` writes camelCase keys.** `controller_runtime.rb:59-61`
  writes `payload[:db_runtime]`, `payload[:queries_count]` and
  `payload[:cached_queries_count]`; `controller-runtime.ts:37-39` writes
  `payload["dbRuntime"]`, `payload["queriesCount"]`, `payload["cachedQueriesCount"]`.
  #7501 converged the actionpack twin (`instrumentation.rb:105-107`) to the Rails
  wire key `view_runtime`, so these three are now the only camelCase keys on the
  `process_action.action_controller` payload — and the `log_process_action`
  reader below cannot see them.
- **The `ClassMethods#log_process_action` override is unported.**
  `controller_runtime.rb:12-23` appends
  `"ActiveRecord: %.1fms (%d %s, %d cached)"` to `super`'s messages when
  `payload[:db_runtime]` is set, pluralizing `"query"` on `queries_count`.
  There is no counterpart in `controller-runtime.ts`, so the `ActiveRecord:`
  segment never reaches the log line.
- **Neither `append_info_to_payload` nor `cleanup_view_runtime` is wired to a
  controller.** Rails mixes the module into `ActionController::Base` through a
  `on_load(:action_controller)` hook, so its `super` chain sits above
  `Instrumentation`'s. In trails the three functions are exported and tested in
  isolation (`controller-runtime.trails.test.ts`) but nothing assigns them onto
  a controller prototype, so the AR runtime never reaches a real request.

`Base.prototype.appendInfoToPayload` / `cleanupViewRuntime`
(`packages/actionpack/src/action-controller/base.ts`) are the actionpack-side
seats the AR overrides would have to chain onto; `logProcessAction`'s
`to_f` coercion and single `view_runtime` read landed in #7501 and are the
`super` this override calls.

## Converged shape

The three payload keys spelled as Rails spells them, the `log_process_action`
override ported with its `super` chain, and the module actually mixed onto the
controller so a booted app emits the `ActiveRecord:` segment.

## Acceptance criteria

- `appendInfoToPayload` writes `db_runtime`, `queries_count` and
  `cached_queries_count`.
- `ControllerRuntime`'s `log_process_action` override exists and appends the
  `ActiveRecord: %.1fms (%d %s, %d cached)` segment over `super`'s messages,
  pluralizing on `queries_count` as `controller_runtime.rb:18-19` does.
- The module reaches a real controller, and a test asserts the segment on a
  request that ran a query — not merely that the functions are callable.
- `pnpm parity:api:calls` / `:args` show no new rows.
