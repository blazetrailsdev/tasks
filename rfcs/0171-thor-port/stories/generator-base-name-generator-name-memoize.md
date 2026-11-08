---
title: "trailties: GeneratorBase.baseName / generatorName memoize as @base_name ||= does"
status: draft
updated: 2026-11-08
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`GeneratorBase.baseName` / `generatorName` (`packages/trailties/src/generators/base.ts`, after trails#9872) recompute from `rbModName(this)` on every call. Rails memoizes both on the class:
`@base_name ||= if base = name.to_s.split("::").first ... end` and `@generator_name ||= if generator = name.to_s.split("::").last ... end`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:334-347`).

## Acceptance criteria

- [ ] `baseName` / `generatorName` memo into own-property `_baseName` / `_generatorName` with one `||` over the own ivar (`Object.hasOwn` guard per CLAUDE.md § "`inherited` is deferred to own-property memo guards"), matching the shape of thor-class-memo-readers-memoize-with-one-or (trails#9543).
- [ ] A subclass does not read its parent's memo.
