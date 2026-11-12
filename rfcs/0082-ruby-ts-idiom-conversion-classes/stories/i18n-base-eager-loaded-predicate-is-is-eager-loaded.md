---
title: "I18n Backend::Base#eager_loaded? ports as isEagerLoaded"
status: draft
updated: 2026-11-12
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`I18n::Backend::Base#eager_loaded?` (`vendor/i18n/v1.14.8/lib/i18n/backend/base.rb:111-113`)
is a predicate, `@eager_loaded ||= false`. trails ports it as
`protected eagerLoaded(): boolean` (`packages/i18n/lib/backend/base.ts`, near
`eagerLoadBang`), a bare camel name. CLAUDE.md "Ruby predicates" and
`pnpm parity:api:predicates` (RFC 0156) spell `foo?` as `isFoo`. Its only caller is
`reloadBang` in the same file (`if (this.eagerLoaded()) await this.eagerLoadBang();`,
Rails `base.rb:100-103`). The ivar is `_eagerLoaded` (since trails#10027), because
the method took the bare name.

## Acceptance criteria

- `eagerLoaded()` is renamed `isEagerLoaded()`, with its caller updated; Chain or
  any other backend that overrides it follows.
- The ivar takes the freed Rails name, `eagerLoaded`, if nothing else holds it.
- `pnpm parity:api:predicates` and the i18n tests pass.
