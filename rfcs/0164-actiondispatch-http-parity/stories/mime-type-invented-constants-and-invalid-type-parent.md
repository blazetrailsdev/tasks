---
title: "Remove Mime's invented constants and hooks; seat InvalidType under InvalidMimeType"
status: draft
updated: 2026-09-28
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "mime-registry-splits-into-lookup-and-extension-lookup",
    "parity-api-credits-mime-module-singleton-methods",
  ]
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

`pnpm parity:api:extra --package actiondispatch` lists 24 novel names on
`packages/actionpack/src/action-dispatch/http/mime-type.ts`: `ATOM`, `BMP`,
`CSS`, `CSV`, `GIF`, `GZIP`, `ICS`, `JPEG`, `JS`, `MPEG`, `MULTIPART_FORM`,
`PDF`, `PNG`, `RSS`, `SVG`, `TIFF`, `URL_ENCODED_FORM`, `VCF`, `WEBP`, `XML`,
`YAML`, `ZIP`, `onRegister` and `toStr`, plus `HTML`, `JSON`, `TEXT` and `get`
as moved. Rails 8 registers types with `Mime::Type.register` in
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/mime_types.rb` and
reads them as `Mime[:html]` (`mime_type.rb:51-54`); it defines no per-type
constants.

`pnpm parity:api --inheritance` reports
`MimeNegotiation::InvalidType` with no parent in trails; Rails declares
`class InvalidType < ::Mime::Type::InvalidMimeType`
(`http/mime_negotiation.rb:12`), itself `< StandardError` (`mime_type.rb:262`).

Three call baseline rows sit in `actiondispatch/http/mime-type.json`.

## Acceptance criteria

- The constants, `onRegister` and `toStr` are gone; callers use `Mime[:sym]` /
  `Mime.fetch`.
- `InvalidType` extends `Mime::Type::InvalidMimeType`; the inheritance row is
  gone.
- `mime-type.json` is empty and its mark tightened.
- `pnpm parity:api:extra --package actiondispatch` lists no novel name on
  `http/mime-type.ts`.
