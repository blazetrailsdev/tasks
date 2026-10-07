---
title: "send_data hands data to render unchanged; the response body carries a Buffer byte-exact"
status: done
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8610
claim: "2026-10-07T01:03:17Z"
assignee: "controller-runtime-supers-map-onto-module-super"
blocked-by: null
closed-reason: null
---

## Context

`DataStreaming#send_data`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/data_streaming.rb:129-132`)
is `send_file_headers! options` then
`render options.slice(:status, :content_type).merge(body: data)`: the data is
handed to `render` as it is.

The port in `packages/actionpack/src/action-controller/metal/data-streaming.ts`
adds an arm Rails does not have,
`body: Buffer.isBuffer(data) ? data.toString("latin1") : data`. It exists
because `Metal#responseBody=`
(`packages/actionpack/src/action-controller/metal.ts`) turns a `Buffer` into a
string with `body.toString()`, which decodes as UTF-8 and corrupts binary
bytes, and because `RenderOptions.body` is typed `string`. The arm was moved
with the method from `base.ts` in trails#8535; it carries no receipt.

## Acceptance criteria

- `sendData` passes `data` to `render` unchanged, as `data_streaming.rb:131`
  does, with no `Buffer` arm.
- The response body path carries a `Buffer` through to the rack body without a
  UTF-8 decode, so `send_data` of binary data is byte-exact; `RenderOptions.body`
  admits it.
- A test under the Rails name from
  `actionpack/test/controller/send_file_test.rb` covers binary `send_data`.
