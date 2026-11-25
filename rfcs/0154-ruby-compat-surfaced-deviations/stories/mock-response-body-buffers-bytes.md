---
title: "mock-response-body-buffers-bytes"
status: draft
updated: 2026-11-25
rfc: "0154-ruby-compat-surfaced-deviations"
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

`Rack::MockResponse#body` (`vendor/rack/v3.2.8/lib/rack/mock_response.rb:71-99`) buffers into
`String.new`, an ASCII-8BIT String, with `buffer << chunk`. The port
(`packages/rack/lib/mock-response.ts`, `body`) keeps a JS string buffer and spells a
`Uint8Array` chunk into it one character per byte with a `String.fromCharCode` loop, under
`@inventedArm if`. `IO#read(length)` already answers a `Uint8Array`, so a chunk off a `File`
body arrives as bytes. Split out of `io-read-length-answers-a-binary-string-where-the-ascii-8bit-seat-is-uint8array`.

## Acceptance criteria

- [ ] `MockResponse#body` buffers as Ruby does (`buffer << chunk`), with no `String.fromCharCode`
      loop and no `@inventedArm if`, deciding how a byte body is exposed per CLAUDE.md
      § "A String has no encoding tag either".
- [ ] Existing rack mock-response tests stay green.
