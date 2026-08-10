---
title: "Derive the Fallbacks factory's return type from its class, not a hand-listed interface"
status: closed
updated: 2026-08-08
rfc: "0074-i18n-parity"
cluster: null
packages:
  - i18n
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Won't-do: blocked by a TypeScript declaration-emit limitation, not by trails code. Deriving the Fallbacks factory's return type from the class it returns — either by dropping the annotation (inferred `typeof Fallbacks`) or via a `ReturnType<typeof fallbacksClass>` alias — makes tsc emit the anonymous mixin class type into fallbacks.d.ts, which fails with one TS4094 per protected member inherited from Base (18 of them) plus TS4058 for Localizable. Both shapes were verified against `pnpm typecheck`. Naming the type is the only emit-legal option, and that is exactly the hand-listed interface this story asks to remove; onFallback being protected also rules out declaring it on an interface. Revisit if the mixin stops inheriting protected members, or under a TS release that can name mixin class types in .d.ts."
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
`on_fallback` (`fallbacks.rb:113`) invisible to `parity:api` until PR #6093
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
- `pnpm parity:api --package i18n` stays at 217/217; `pnpm parity:api:extra` gains no
  novel name.
