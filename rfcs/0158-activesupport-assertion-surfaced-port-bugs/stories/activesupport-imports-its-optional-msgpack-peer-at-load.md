---
title: "activesupport loads without its optional msgpack peer, as Rails lazy-requires message_pack"
status: closed
updated: 2026-10-08
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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
closed-reason: "Duplicate of message-pack-loaded-at-call-time-so-msgpack-is-an-optional-peer (0184), filed the same day. Extra evidence: it blocks downstream bumps — trailmap#44 could not vendor trails e8f1bb88fa and pinned to c83105fc59."
---

## Context

Since trails#8674 (`f331b8a520`), `@blazetrails/activesupport` declares
`@blazetrails/msgpack` an OPTIONAL peer dependency
(`packages/activesupport/package.json`, `peerDependenciesMeta`) and imports it
unconditionally: `packages/activesupport/src/message-pack.ts:1`
(`import "@blazetrails/msgpack"`), reached at load time through
`messages/serializer-with-fallback.ts:6`, `messages/metadata.ts`,
`cache/serializer-with-fallback.ts` and
`cache/behaviors/cache-store-serializer-behavior.ts`.

An application that installs activesupport without msgpack, which is what
"optional" permits, cannot load it at all:

    Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@blazetrails/msgpack'
    imported from …/@blazetrails/activesupport/dist/message-pack/serializer.js

Found bumping trailmap (trailmap#44): its `prepare` step
(`trails-tsc-views build`) died on install at trails `e8f1bb88fa`, so the bump
was pinned to `c83105fc59`, the last commit it needed that predates #8674.
trailmap's `scripts/vendor-trails.sh` packs the transitive closure of
`dependencies`, so an optional peer is never vendored.

Rails loads message pack lazily, and only if asked:
`activesupport/lib/active_support/messages/serializer_with_fallback.rb:10-11`

    if format.to_s.include?("message_pack") && !defined?(ActiveSupport::MessagePack)
      require "active_support/message_pack"

and `:134-140` (`available?` rescues `LoadError` and answers false). The
`msgpack` gem is not a dependency of activesupport's gemspec.

Converged shape: nothing on activesupport's load path imports
`message-pack.ts` statically. The `message_pack` formats load it on first use
(dynamic `import()` or the repo's lazy-require seam), and `available?` answers
false when the peer is absent, as Rails' does.

## Acceptance criteria

- Importing `@blazetrails/activesupport` (and `actionpack`, `trailties`) with
  `@blazetrails/msgpack` not installed succeeds; a test proves it, e.g. by
  resolving the package from a directory where the peer is absent.
- A `message_pack` serializer format with the peer absent fails the way Rails
  does (`LoadError` from the require / `available?` false), not at module load.
- With the peer present, the message-pack tests pass unchanged.
- If laziness is judged not worth it, the alternative is to make msgpack a real
  `dependency` and say so; an optional peer imported eagerly is the one state
  that is wrong.
