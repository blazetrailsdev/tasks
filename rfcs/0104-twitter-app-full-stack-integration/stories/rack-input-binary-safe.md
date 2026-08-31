---
title: "rack-input-binary-safe"
status: draft
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 49
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rack.input` is byte-oriented in Ruby and character-oriented in trails, and the
seam is `StringIO`.

Ruby reads a request body off a socket as `ASCII-8BIT`, and
`Rackup::Handler::WEBrick::Input`
(`rackup-2.2.1/lib/rackup/handler/webrick.rb:60-89`) hands those bytes through
untouched, so a binary upload round-trips exactly. trails' `StringIO`
(`packages/activesupport/src/string-io.ts:17`) holds a JS string, which is
UTF-16 code units, so every producer must pick a decoding:

- `mock-request.ts:147` wraps whatever JS string the caller passed.
- `rack/src/handler/node.ts`'s `readBody` decodes the socket's bytes as UTF-8
  (PR #7244), because every current consumer is text-oriented — form bodies
  through `Request#POST` (`request.ts:325-...`), `method-override.ts:64`,
  `multipart/parser.ts:67`.

Both choices are lossy in one direction. UTF-8 corrupts a non-UTF-8 body; a
byte-faithful `latin1` decode would round-trip bytes but hand every text
consumer mojibake for non-ASCII, and would put this one producer out of step
with `mock-request.ts`. Surfaced by review on PR #7244, which serves the first
production HTTP path that can receive a real binary upload.

The limitation is wider than the encoding call. `StringIO#size`
(`string-io.ts:31-33`) returns `_string.length` — code units, not the bytesize
its own JSDoc claims — so `CONTENT_LENGTH` derived from it
(`mock-request.ts:155`) is already wrong for any non-ASCII body.

## Acceptance criteria

- `rack.input` carries bytes end to end: `StringIO` (or a byte-backed sibling
  standing in for Ruby's `ASCII-8BIT` IO) round-trips an arbitrary byte
  sequence through `read`.
- `StringIO#size` is a bytesize, matching its documented Ruby contract.
- Text consumers (`Request#POST`, `method-override`, `multipart/parser`) decode
  where Rack decodes rather than relying on the input having been decoded.
- `handler/node.ts`'s `readBody` stops decoding and hands bytes over; its
  `@noRailsEquivalent` note about the encoding choice comes out.
- A binary body (e.g. a PNG) posted through `Rack::Handler::Node` reaches the
  app byte-identical.
