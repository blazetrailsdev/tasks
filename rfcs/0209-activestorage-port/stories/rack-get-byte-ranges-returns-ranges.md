---
title: "rack-get-byte-ranges-returns-ranges"
status: draft
updated: 2026-11-03
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rack's `Utils.get_byte_ranges` (`vendor/rack/.../lib/rack/utils.rb`, `get_byte_ranges`) answers an Array of Ruby `Range`s (`r0..r1`). trails' `getByteRanges` (`packages/rack/src/utils.ts:389`) answers `[number, number][]` tuples, so callers index `range[0]`/`range[1]` where Ruby reads `range.begin`/`range.end`, and `ActiveStorage::Streaming#send_blob_byte_range_data` (`packages/activestorage/src/streaming.ts`; Rails `activestorage/app/controllers/concerns/active_storage/streaming.rb:14-54`) has to build `new Range(range[0], range[1])` before `blob.download_chunk(range)`, receipted `@inventedArm new — CONVERGEABLE rack-get-byte-ranges-returns-ranges`. Other consumers: `packages/rack/src/files.ts:160` and its `BaseIterator`, `byteRanges`, and ~26 assertions in `packages/rack/src/utils.test.ts`.

## Acceptance criteria

- `getByteRanges` / `byteRanges` answer ruby-compat `Range<number>`s, as Rack does.
- `Rack::Files` and its iterators read `range.begin` / `range.end`.
- `streaming.ts` passes the range straight to `downloadChunk`, and its `@inventedArm new` receipt is removed.
