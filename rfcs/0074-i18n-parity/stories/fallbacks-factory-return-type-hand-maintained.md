---
title: "Derive the Fallbacks factory's return type from its class, not a hand-listed interface"
status: draft
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/i18n/src/backend/fallbacks.ts:82-92` declares a hand-written
`FallbacksMethods` interface and returns
`T & (abstract new (...args) => FallbacksMethods)` from the `Fallbacks` factory.
The gem has no such type: `include I18n::Backend::Fallbacks`
(`vendor/i18n/lib/i18n/backend/fallbacks.rb:33`) exposes every method the module
defines, with no declaration to keep in step.

The interface lists ONE member (`extractNonSymbolDefaultBang`), so the factory's
return type silently hides everything else the class declares. That is what made
`on_fallback` (`fallbacks.rb:113`) invisible to `api:compare` until PR #6093
taught `extract-ts-api.ts` to read the returned class declaration directly
(`factoryClassMembers`). The extractor no longer depends on the interface — but
every _caller_ still does, so a member added to the class is still absent from
the type until someone remembers to add a line, which is the same drift.

## Converged shape

Drop the hand-maintained `FallbacksMethods` and let the factory's return type
come from the class it returns — `InstanceType<ReturnType<typeof Fallbacks>>`
shaped, or a `class Fallbacks extends Superclass` whose type is inferred — so
that `include I18n::Backend::Fallbacks` exposing every module method is what the
TS type says too, with nothing to maintain by hand.

## Acceptance criteria

- `FallbacksMethods` is deleted, or reduced to a type derived from the class
  rather than a hand-listed member set.
- A caller of `Fallbacks(Simple)` sees `translate`, `exists`, `resolveEntry` and
  `extractNonSymbolDefaultBang` on the instance type, and `onFallback` stays
  `protected` (`fallbacks.rb:111-116`).
- `pnpm api:compare --package i18n` stays at 217/217; `pnpm api:extra` gains no
  novel name.
