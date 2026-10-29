---
title: "StreamEventLoop's @map holds a monitor with value and interests, as nio4r's does"
status: done
updated: 2026-10-29
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9423
claim: "2026-10-29T00:55:25Z"
assignee: "stream-event-loop-map-holds-monitors"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#9384, which ported `StreamEventLoop#writes_pending`. Rails keeps one nio4r monitor per IO in `@map`: `@map[io] = @nio.register(io, :r)` with `@map[io].value = stream` (`vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/stream_event_loop.rb:32-33`). `writes_pending` sets `monitor.interests = :rw` (`:49-50`), and `run` sets it back to `:r` once `flush_write_buffer` reports empty (`:106`).

trails' `packages/actioncable/src/connection/stream-event-loop.ts` splits that into two maps, `_map: Map<Io, Stream>` and a separate `_interests: Map<Io, "r" | "rw">`. `_interests` has no Rails counterpart; it stands in for the monitor's `interests` attribute.

## Converged shape

`@map` holds a monitor-shaped record per IO, `{ value: stream, interests: "r" | "rw" }`, read and written where Rails reads and writes `monitor.value` and `monitor.interests`. `_interests` is deleted. `attach`, `detach`, `writes_pending` and the read loop's closing branch use `@map[io]` the way the Rails lambdas do. The existing `stream-event-loop.trails.test.ts` cases keep passing unchanged.
