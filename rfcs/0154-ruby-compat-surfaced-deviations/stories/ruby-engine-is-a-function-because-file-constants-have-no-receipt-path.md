---
title: "RUBY_ENGINE is a function because a module-level literal const has no extra-surface receipt path"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`RUBY_ENGINE` is a String constant in MRI (`vendor/ruby/v3.3.11/version.c:120`, over `ruby_engine`
at `:78`). trails#8414 added it to `packages/ruby-compat/src/ruby-platform.ts` for
`Thor::Command#sans_backtrace`'s `RUBY_ENGINE =~ /rbx/` arm
(`vendor/thor/v1.3.2/lib/thor/command.rb:110`) and had to spell it as a function,
`RUBY_ENGINE(): string`.

The reason is tooling, not the language. `extractFileConstants`
(`scripts/api-compare/extract-ts-api.ts`, the `tsLiteralValue` pass) records every module-level
`export const NAME = <literal>` as a file constant, and `walkTsFileSurface`
(`scripts/api-compare/extra-surface.ts:1188`) scores it. Nothing reads a `@noRailsEquivalent`
receipt on that declaration, so `export const RUBY_ENGINE = "ruby"` with a PERMANENT receipt still
reds the pinned gate:

```text
+ ruby-compat  novel: 0 → current 1
ruby-platform.ts — 1 novel, 0 moved [no Rails counterpart]
  RUBY_ENGINE
```

A `static readonly` member has a receipt path (`Process.CLOCK_MONOTONIC`,
`packages/ruby-compat/src/process.ts:33`); a module-level const has only `@internal`
(`extractInternalFileConstants`), which is the wrong claim for a public export.

`RUBY_PLATFORM()` in the same file is a function for a real reason (its value comes from the
process adapter) and is not part of this story.

## Acceptance criteria

- [ ] A `@noRailsEquivalent PERMANENT|CONVERGEABLE <story>` receipt on a module-level literal
      `export const` is read, and the constant is scored `Allowed`, as a receipted member is.
- [ ] `RUBY_ENGINE` is `export const RUBY_ENGINE = "ruby"` and `command.ts` reads it as a value.
- [ ] `pnpm parity:api:extra:gate` stays green with ruby-compat pinned at novel 0.
