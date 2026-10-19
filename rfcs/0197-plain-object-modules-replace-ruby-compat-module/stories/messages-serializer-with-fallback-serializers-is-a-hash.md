---
title: "activesupport: Messages::SerializerWithFallback::SERIALIZERS is a Hash"
status: done
updated: 2026-10-19
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9096
claim: "2026-10-19T20:37:52Z"
assignee: "activemodel-drop-ruby-compat-module-class"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/messages/serializer-with-fallback.ts:184` declares
`SERIALIZERS` as a plain `Record<Format, Serializer>`. Rails'
`activesupport/lib/active_support/messages/serializer_with_fallback.rb:14,23,25`
uses it as a Hash (`SERIALIZERS.fetch`, `.key`, `[]`). Since trails#9063, every
plain object that `rbModConstSet` binds is treated as a module. The cache-side
`SERIALIZERS` (`cache/serializer-with-fallback.ts`) became a ruby-compat `Hash`
in that PR. The messages-side one is seated through an object literal, so it is
not pathed today, but its shape is inconsistent with the cache side.
Consumers: `messages/metadata.ts:34` (`Object.values(SERIALIZERS)`) and
`actionpack/src/action-dispatch/middleware/cookies.ts:797-798`.

## Acceptance criteria

- `SERIALIZERS` in `messages/serializer-with-fallback.ts` is a ruby-compat `Hash`
  keyed by format name, and `[]` / `.key` / `fetch` read it the way Rails does.
- `metadata.ts` and `cookies.ts` read it through Hash methods.
- The messages and cookies tests pass.
