---
title: "activesupport: Cache::SerializerWithFallback.[] returns the registered serializer; load is a member of each, as include SerializerWithFallback makes it"
status: draft
updated: 2026-10-08
rfc: "0184-msgpack-gem-port"
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

Seen while porting trails#8689. Rails'
`ActiveSupport::Cache::SerializerWithFallback`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/cache/serializer_with_fallback.rb`)
is a module each serializer includes and extends itself with
(`:46-48`, `:66-68`, `:101-103`, `:119-121`: `include SerializerWithFallback;
extend self`), so `load` (`:17-37`) and the private `marshal_load` (`:40-44`)
are methods of every serializer, and `self.[]` (`:9-15`) answers
`SERIALIZERS.fetch(format)`: the registered module itself.

`packages/activesupport/src/cache/serializer-with-fallback.ts` diverges:

- `get` returns `{ ...s, load: sharedLoad }`, a new object on every call, so
  `SerializerWithFallback.get(:x) !== SerializerWithFallback.get(:x)` and the
  result is never the entry in `SERIALIZERS`. Rails returns the same module.
- The four serializer objects do not carry `load`; it is a free function
  `sharedLoad` attached only at `get`. `marshal_load` is likewise a free
  function rather than a member.
- `messagePackWithFallback.dumped` and the two marshal `dumped` bodies carry a
  `typeof dumped === "string"` guard Rails' `dumped?` (`:92-94`, `:113-115`,
  `:130-132`) does not have: `load` already guards `dumped.is_a?(String)` at
  `:18`.
- `Unrecognized payload prefix` logs `JSON.stringify(dumped[0])` where Rails
  logs `dumped.byteslice(0).inspect` (`:28`), and `Unrecognized payload class`
  logs `typeof dumped` where Rails logs `dumped.class` (`:34`).

`messages/serializer-with-fallback.ts` already has the converged shape (each
serializer spreads the shared `load` / `detectFormat` / `fallback`, and `get`
returns the `SERIALIZERS` entry).

## Acceptance criteria

- `get` returns the `SERIALIZERS` entry itself, as `:9-15` does; no object is
  built per call.
- `load` and `marshalLoad` are members of every cache serializer, matching
  `include SerializerWithFallback`.
- The three `dumped` bodies match Rails' line for line, with no `typeof` guard.
- The two warn messages render through `rbInspect` and the Ruby class name.
- `pnpm parity:api:calls`, `parity:api:calls:args` and
  `parity:api:extra --package activesupport` non-negative; the cache tests
  green.
