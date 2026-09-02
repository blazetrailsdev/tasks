---
title: "activemodel: Errors#import drops the override-options symbolization loop"
status: in-progress
updated: 2026-09-02
rfc: "0134-activemodel-surfaced-deviations"
cluster: rails-deviation
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 15
priority: 10
pr: 7396
claim: "2026-09-02T17:16:38Z"
assignee: "attribute-user-provided-default-slot-guard-invented-throw"
blocked-by: null
closed-reason: null
---

## Context

Rails `Errors#import` (`vendor/rails/activemodel/lib/active_model/errors.rb:154-161`)
runs `[:attribute, :type].each { |key| override_options[key] = override_options[key].to_sym if override_options.key?(key) }`
before wrapping in `NestedError`.

trails `import` (`packages/activemodel/src/errors.ts:57-59`) pushes the
`NestedError` with `overrideOptions` untouched. Under the repo's
Symbol-is-`":name"` convention a caller passing a plain-string `type` override
diverges from Rails' symbolized one (a `":too_short"` stored type vs a
`"too_short"` one changes `added?`/`ofKind` matching, which branch on the
leading colon — errors.ts:177,190). Not baselined, no `@missingRailsCall` tag.

## Acceptance criteria

- `import` normalizes `attribute` and `type` in `overrideOptions` the way
  errors.rb:155-159 does, spelled with the colon-prefix Symbol convention.
- A regression test importing an error with a string `type` override and
  asserting `added?` matching, failing on the baseline.
