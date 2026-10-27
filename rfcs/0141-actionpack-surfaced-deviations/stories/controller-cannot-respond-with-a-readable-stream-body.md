---
title: "A controller cannot hand a ReadableStream to the response, so a relay must buffer it"
status: draft
updated: 2026-10-27
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found building trailmap#82 (`/sessions/file`, `/sessions/transcript`). The action relays an archive file from ringo. It has a `fetch` `Response` whose `body` is a `ReadableStream<Uint8Array>` of up to ~100 MB, and nothing in actionpack accepts that body.

- `render({ plain })` takes a string, so the whole file is buffered and decoded.
- `sendData` (`action-controller/metal/data-streaming.d.ts:39`) takes `string | Buffer`.
- `ActionController::Live` (`action-controller/metal/live.d.ts`) writes strings through a `Queue<string>`, so it cannot carry binary data, and its thread emulation is heavy for a relay.

trailmap worked around it in `lib/archive-read.ts` (`readBounded`): it holds at most 128 MiB and refuses anything larger with a 413. Rails would `send_file` a local path, or set `response.body` to an object that responds to `each`, and Rack streams it.

Expected shape: `this.response.body = readableStream` (or `sendStream(stream, { type, disposition })`). The server adapter pipes it chunk by chunk and cancels the stream when the client disconnects.

## Acceptance criteria

- A controller action can set a `ReadableStream<Uint8Array>` as the response body, and the server streams it without buffering, binary-safe.
- A client disconnect cancels the source stream.
- `ActionController::TestCase` can read such a body as a string.
