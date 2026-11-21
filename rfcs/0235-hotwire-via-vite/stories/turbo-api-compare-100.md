---
title: "turbo-rails api:compare reaches 100%"
status: done
updated: 2026-11-21
rfc: "0235-hotwire-via-vite"
cluster: null
packages: ["turbo", "scripts"]
deps: []
deps-rfc: []
est-loc: 150
priority: 4
pr: trails#10460
claim: "2026-11-20T23:25:31Z"
assignee: "turbo-test-compare-100"
blocked-by: null
closed-reason: null
---

## Goal

Bring `pnpm parity:api --package turbo-rails` to 100% (operator ruling 2026-11-20: turbo reaches 100% api).

## Measured (origin/main 6267d8913, API_COMPARE_ALLOW_STALE_BUILD=1; re-measure on a clean build)

Overall 181/220 methods (82.3%), files 22/27. Gaps:

- engine.rb → engine.ts 0/1
- frames/frame_request.rb 0/2 (accept_header, turbo_frame_request?, turbo_frame_request_id) — impl exists at lib/app/controllers/turbo/frames/frame-request.ts

- immediate_debouncer.rb 0/4 — impl at lib/app/models/turbo/immediate-debouncer.ts
- native/navigation.rb 8/9 (turbo_native_app?)

- request_id_tracking.rb 0/1 — impl at lib/app/controllers/concerns/turbo/request-id-tracking.ts
- streams_channel.rb 27/31

- streams/broadcasts.rb 0/23 — impl at lib/app/channels/turbo/streams/broadcasts.ts
- streams/turbo_streams_tag_builder.rb 0/1

- test_assertions.rb 4/6

Most 0% rows have an implementation under lib/app/...; the gap is likely file mapping / mixin extraction, not missing code. Fix the mapping (or the source shape) so the extractor credits them; port anything truly missing. No `@noRailsEquivalent` escapes to hit the number.
