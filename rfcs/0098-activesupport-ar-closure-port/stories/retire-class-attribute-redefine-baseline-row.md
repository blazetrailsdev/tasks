---
title: "Retire the stale class-attribute redefine call-mismatch row"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: 6524
claim: "2026-08-14T14:47:03Z"
assignee: "deprecation-raise-behavior-raises-deprecationexception"
blocked-by: null
closed-reason: null
---

## Context

PR #6520 converged `classAttribute` onto
`vendor/rails/activesupport/lib/active_support/core_ext/class/attribute.rb:86-134`,
including writing the default through `ClassAttribute.redefine`
(`vendor/rails/activesupport/lib/active_support/class_attribute.rb:7-24`).

The story's third acceptance criterion could not be met at the time: the
`redefine` call-mismatch row lives in
`scripts/api-compare/call-mismatches-exclude/activesupport/class-attribute.json`,
which only comes into existence with the `core_ext/class/attribute.rb` ->
`class-attribute.ts` `RUBY_FILE_TS_OVERRIDES` row in `scripts/parity/conventions.ts`
— shipped by PR #6518, unmerged when PR #6520 landed. Once that row is on `main`,
`class-attribute.ts` re-enters the call-parity population and the baselined
`redefine` row is stale, because the body now makes the call.

## Acceptance criteria

- [ ] Delete the `redefine` row from
      `scripts/api-compare/call-mismatches-exclude/activesupport/class-attribute.json`
      (by hand, via `serializeBaseline` — never `--write`/reseed).
- [ ] Tighten the resulting stale high-water mark with
      `pnpm parity:api:calls:tighten activesupport/class-attribute.json`.
- [ ] `pnpm parity:api:calls` is green.
- [ ] The remaining rows (`caller_locations` / `first`) stay: they are the
      generated-method-location omission shared with `delegate` and
      `mattr_accessor`, not this file's debt.
