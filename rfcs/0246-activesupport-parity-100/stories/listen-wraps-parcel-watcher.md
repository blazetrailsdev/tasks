---
title: "listen-wraps-parcel-watcher"
status: in-progress
updated: 2026-11-22
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10587
claim: "2026-11-22T19:04:06Z"
assignee: "listen-wraps-parcel-watcher"
blocked-by: null
closed-reason: null
---

## Context

Operator ruling 2026-11-22: listen v3.9.0 is not ported line for line. It is
glue over native backends (rb-inotify, rb-fsevent, wdm) and a polling
fallback; Node's `@parcel/watcher` provides native backends, batched events
and ignore globs directly. Follows the gem-backed-ports-wrap-npm precedent
(memjs behind Dalli, wasm-vips behind image_processing). Supersedes trails#10578.

The only Rails consumer is `ActiveSupport::EventedFileUpdateChecker`
(`vendor/rails/v8.0.5.2/activesupport/lib/active_support/evented_file_update_checker.rb`),
which calls `Listen.to(*dirs, &callback)` and `start` / `stop`, with the
callback receiving `(modified, added, removed)`.

## Acceptance criteria

- `@blazetrails/listen` package depending on `@parcel/watcher`.
- Public surface at Rails names: `Listen.to(*dirs, options, block)`, `Listen.stop`,
  `Listener#start` / `stop` / `pause` / `isPaused` / `isProcessing` / `isStopped`,
  `ignore` / `only` options (`vendor/listen/v3.9.0/lib/listen.rb`, `listener.rb`).
- parcel events mapped to the `(modified, added, removed)` absolute-path arrays,
  batched per `latency` / `wait_for_delay`.
- `Listen::Error` and `Listen.logger` kept only if a consumer reads them.
- `Record`, `Change`, `QueueOptimizer`, `Silencer`, `Event::*`, adapters, `Fsm`
  are permanent unported-files rows with one receipt citing this ruling.
- Port `spec/lib/listen/listener_spec.rb` examples that test the public surface;
  integration test against a real temp dir.
