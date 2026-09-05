---
title: "action_dispatch/send-file.ts is a trails invention: own MIME table, bare Error, own content-disposition"
status: in-progress
updated: 2026-09-05
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: 30
pr: 7520
claim: "2026-09-05T14:22:13Z"
assignee: "type-registry-key-replaces-per-adapter-overrides"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-dispatch/send-file.ts` has no Rails
counterpart. Rails serves a file by installing a body and letting
`Rack::Sendfile` take over: `send_file` is
`vendor/rails/actionpack/lib/action_controller/metal/data_streaming.rb:77-86`,
which calls `response.send_file path`, and that is
`vendor/rails/actionpack/lib/action_dispatch/http/response.rb:374-377` seating a
`FileBody` (`response.rb:352-371`). No Rails file assembles a status, a header
hash and a body the way this module's `sendFile` / `sendData` do.

Three specific divergences inside it, surfaced while flipping its call sites
onto `File` in #7455:

- **`MIME_TYPES` and `lookupMimeType` duplicate `Mime`.** Rails resolves a type
  through `Mime::Type.lookup_by_extension` (`data_streaming.rb:143`); this
  module carries its own 22-entry extension table, and
  `packages/actionpack/src/action-dispatch/http/mime-type.ts` already ports the
  real registry.
- **The guard raises a bare `Error`.** `data_streaming.rb:77` raises
  `ActionController::MissingFile, "Cannot read file #{path}"`; this module
  throws `new Error(\`Cannot read file: ${path}\`)` — wrong class, and a stray
  colon in the message.
- **`buildContentDisposition` duplicates `ContentDisposition.format`**
  (`action_dispatch/http/content_disposition.rb`), which
  `data-streaming.ts` already calls.

## Acceptance criteria

- File serving goes through the Rails shape — `Response#sendFile` seating the
  body — and this module's `sendFile` / `sendData` are deleted rather than
  reimplemented, or the module is reduced to what a Rails file actually
  declares.
- Whatever survives resolves types through `MimeType` and formats the
  disposition through `ContentDisposition`, with no second table.
- The missing-file guard raises `ActionController::MissingFile` with Rails'
  exact message, `"Cannot read file #{path}"`.
- `pnpm parity:api:extra --package actionpack` reports no extra public name
  from this file without a receipt.
