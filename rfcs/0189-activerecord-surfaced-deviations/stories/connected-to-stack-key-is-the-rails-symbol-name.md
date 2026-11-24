---
title: "activerecord: key the connected-to stack as active_record_connected_to_stack"
status: draft
updated: 2026-11-24
rfc: "0189-activerecord-surfaced-deviations"
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

Rails keys the connected-to stack as `ActiveSupport::IsolatedExecutionState[:active_record_connected_to_stack]`
(`vendor/rails/v8.0.5.2/activerecord/lib/active_record/core.rb:216-224`). trails keys it with
`Symbol.for("ar_connected_to_stack")` (`packages/activerecord/lib/core.ts:547-555`). A Ruby Symbol is a JS
string (root CLAUDE.md), so the key should be the string `"active_record_connected_to_stack"`.

This difference is observable. A controller whose `live_streaming_excluded_keys` is
`["active_record_connected_to_stack"]` (`actionpack/test/controller/live_stream_test.rb:580-594`, ported in
trails#10707) cannot exclude AR's real stack, because the string never matches the JS Symbol key.

## Acceptance criteria

- [ ] `core.ts` stores and reads the stack under `"active_record_connected_to_stack"`
- [ ] A test shows a live action whose excluded keys list that string does not see the opener's AR stack
