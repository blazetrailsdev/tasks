---
title: "addressable: port URI parse, query_values and to_s"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-deps
packages: [addressable]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design. geared_pagination's `Headers#uri`
(`geared_pagination/headers.rb:36-40`) is the only caller:
`Addressable::URI.parse(request.url)`, `query_values`, `query_values=` and
`to_s`. `query_values=` (`addressable/uri.rb:1870-1913`) sorts a Hash's
pairs, writes a bare key for `nil`, repeats the key for an Array, and encodes
with `encode_component(..., UNRESERVED)`, so `URLSearchParams` gives a
different string (`+` for space, insertion order).

## Acceptance criteria

- [ ] addressable 2.10.0 vendored and `packages/addressable` created
- [ ] the new package registered as a new package needs (`ci.yml` lanes, the workspace guard fixture, `vendor/sources.ts`)
- [ ] `URI.parse`, `queryValues`, `setQueryValues`, `toS`, `encodeComponent`, `unencodeComponent` ported at their Rails names, parse delegating to Node's `URL`
- [ ] the gem's spec examples for those methods ported and passing
- [ ] nothing else of the gem ported
