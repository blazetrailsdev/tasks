---
title: "activesupport-messages-serializer-with-fallback-port"
status: claimed
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-26T13:34:54Z"
assignee: "activesupport-messages-serializer-with-fallback-port"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activesupport/lib/active_support/messages/serializer_with_fallback.rb`
has no TS counterpart (`packages/activesupport/src/messages/serializer-with-fallback.ts`
does not exist).

Until PR #5344 it scored 5/8, because the includer graph resolved
`include SerializerWithFallback` inside `ActiveSupport::Messages::*` broadly
and also bound the same-short-name `ActiveSupport::Cache::SerializerWithFallback`,
whose port then counted as the implementation site. Scoping the graph to Ruby's
constant lookup dropped it to 0/8.

Newly-visible: `SerializerWithFallback#load` (:17),
`MarshalWithFallback.{dump,_load,dumped?}` (:63/:67/:73),
`MessagePackWithFallback.available?` (:134).

## Acceptance criteria

- Port `messages/serializer_with_fallback.rb` (or record an
  `UNPORTED_FILES` entry with a reason if the Marshal/MessagePack formats have
  no JS analogue — decide explicitly rather than leaving it silently at 0/8).
- `pnpm api:compare --package activesupport` reflects the decision.
