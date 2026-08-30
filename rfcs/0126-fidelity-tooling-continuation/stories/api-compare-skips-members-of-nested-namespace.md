---
title: "api-compare misses members of a namespace nested in a namespace (Ruby module ClassMethods)"
status: claimed
updated: 2026-08-30
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 4
pr: null
claim: "2026-08-30T13:30:13Z"
assignee: "api-compare-buckets-reopened-module-under-one-file"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Configurable` nests its class-method module inside the mixin
module (`vendor/rails/activesupport/lib/active_support/configurable.rb:28` —
`module ClassMethods` inside `module Configurable`). PR #6654 ported that shape
literally: `packages/activesupport/src/configurable.ts` has
`export namespace ClassMethods` inside `export namespace Configurable`, holding
`config` (configurable.rb:29-36), `configure` (:38-40) and `configAccessor`
(:107-127).

api-compare does not resolve a member of a namespace nested inside another
namespace. Post-merge, `pnpm parity:api --package activesupport --missing`
reports:

```text
configurable.rb    configurable.ts    4  2  6  67%
    - configure → configure
    - config_accessor → configAccessor
```

Both members exist, are exported, and carry the conventional names — they are
simply one namespace level deeper than the extractor walks. (`config` matches
because `Configurable.config`, the instance method at configurable.rb:150-152,
sits at the outer level and satisfies the lookup.)

This penalizes the faithful shape: hoisting `configure`/`configAccessor` out of
`ClassMethods` would score 6/6 while diverging from Rails' module layout, which
is exactly backwards. The adjacent stories cover nested _classes_
(`compare-drops-nested-class-methods-from-coverage-denominator`,
`extra-surface-nested-class-method-allowance-is-file-wide`); this is nested
_namespaces_, which the mixin idiom in CLAUDE.md ("Module mixins") produces
wherever a Ruby `module ClassMethods` is ported.

## Converged shape

`scripts/api-compare/extract-ts-api.ts` walks into a nested
`ModuleDeclaration` and qualifies its members against the Ruby nested-module
path, so `Configurable.ClassMethods.configure` resolves to
`ActiveSupport::Configurable::ClassMethods#configure`. Check
`scripts/parity/conventions.ts` first — if the Ruby→TS path rules already
describe nested modules, the gap is only in the TS-side walker.

## Acceptance criteria

- `pnpm parity:api --package activesupport --missing` reports configurable.rb
  at 6/6 with no `configure` / `config_accessor` rows, with no source change to
  `packages/activesupport/src/configurable.ts`.
- Overall `pnpm parity:api` delta is non-negative; no other file regresses.
- A unit test in the api-compare suite covers a member of a namespace nested
  one level inside another namespace.
