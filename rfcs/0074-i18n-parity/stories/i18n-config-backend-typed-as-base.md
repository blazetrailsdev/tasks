---
title: "Type Config#backend as Backend::Base instead of a hand-written interface slice"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6020
claim: "2026-08-03T20:53:09Z"
assignee: "i18n-config-backend-typed-as-base"
blocked-by: null
closed-reason: null
---

## Context

`packages/i18n/src/config.ts` declares `export interface Backend { ... }` — a
hand-written slice enumerating `availableLocales`, `reloadBang`,
`eagerLoadBang`, `storeTranslations`, `translate`, `exists` and `localize` —
and types `Config#backend` as it.

The gem has no such type. `I18n::Config#backend`
(`vendor/i18n/lib/i18n/config.rb:26-28`) returns `@@backend ||=
Backend::Simple.new`, i.e. a `Backend::Base` including object; the members the
slice lists are exactly `I18n::Backend::Base`'s
(`vendor/i18n/lib/i18n/backend/base.rb:14-25` for `load_translations` /
`store_translations`, plus `translate`, `exists?`, `localize`). Every member
added to the interface so far has been a bug report from a caller that could
not typecheck — `storeTranslations` was PR #6011, and the same will happen for
`load_translations`, `available_locales`, `reload!`, `eager_load!` and the
`Chain` / `Fallbacks` decorators as they land.

Coupled to this: `registerDefaultBackend` in the same file is the one novel
public name `pnpm parity:api:extra --package i18n` reports for `config.ts`. It exists
only because the interface has no concrete default — the gem just writes
`Backend::Simple.new` inline in `config.rb:27`.

## Converged shape

- Delete the `Backend` interface; type `Config#backend` as the `Base` abstract
  class from `packages/i18n/src/backend/base.ts`, which is already the port of
  `I18n::Backend::Base` and carries all seven members with the Rails
  signatures.
- With a concrete `Base`/`Simple` reachable, the default resolves the way
  `config.rb:27` writes it, and `registerDefaultBackend` goes away with it.
- `config.ts` → `base.ts` is type-only in the first step, so the existing
  `base.ts` → `i18n.ts` → `config.ts` import edge is not a runtime cycle; the
  default-instantiation step needs the value import and should be checked
  against it.
- Update `FakeBackend` in `packages/i18n/src/config.trails.test.ts` to extend
  `Base` rather than implement the deleted interface.

## Acceptance criteria

- No `Backend` interface in `packages/i18n/src/config.ts`; `Config#backend`
  reads and writes `Base`.
- `registerDefaultBackend` removed, or the remaining need for it stated with
  the TypeScript language shortcoming that forces it.
- `pnpm parity:api:extra --package i18n` novel count for `config.ts` drops from 1 to 0.
- `pnpm vitest run packages/i18n/src` green.
