---
title: "Port ActionController::TestCase's nine missing methods and fix its arity rows"
status: ready
updated: 2026-09-28
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps: ["test-case-process-rebuilds-the-request-instead-of-reusing-it"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package actioncontroller` reports `test_case.rb` at 51/60.
The missing methods, all in
`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb`:

- `Live#new_controller_thread` (`:28`) and `#clean_up_thread_locals` (`:37`), with
  their `alias_method :original_new_controller_thread` (`:25`) and
  `:original_clean_up_thread_locals` (`:34`) — the originals are
  `metal/live.rb:377,386`
- `TestRequest#should_multipart?` (`:154`)
- `Behavior#setup_controller_request_and_response` (`:564`)
- `Behavior#setup_request` (`:605`)
- `Behavior#document_root_element` (`:681`)
- `Behavior#check_required_ivars` (`:685`)

Three arity rows sit on the same two files:

- `build_response(klass)` (`test_case.rb:592`); trails
  `buildResponse()` (`packages/actionpack/src/action-controller/test-case.ts:387`)
- `process_controller_response(action, cookies, xhr)` (`:635`); trails takes
  `(action, _xhr)`
- `Testing::Functional#clear_instance_variables_between_requests()`
  (`action_controller/metal/testing.rb`); trails takes `(controller, trackedVars)`
  (`metal/testing.ts:11`)

## Acceptance criteria

- All nine methods exist at their Rails names and hosts, with Rails' bodies.
  `setup_controller_request_and_response` is what the test class's setup runs,
  as in Rails, rather than an inlined equivalent.
- The three arity rows are gone from `pnpm parity:api --arity`.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green; any row
  this converges is deleted by hand, not reseeded.
