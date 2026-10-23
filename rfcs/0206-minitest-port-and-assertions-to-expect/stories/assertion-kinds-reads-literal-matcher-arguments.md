---
title: "The assertion-kind gate reads toBe(true/false), toHaveLength(0) and toHaveProperty by their literal argument"
status: draft
updated: 2026-10-23
rfc: "0206-minitest-port-and-assertions-to-expect"
cluster: assertion-tooling
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`scripts/test-compare/assertion-kinds.ts` maps a trails matcher to a kind by
name alone (`TRAILS_MAP`, `:238-275`; `normalizeTrailsKind`, `:367-382`). So
three spellings CONTRIBUTING.md § "Porting a Minitest assertion" names as the
default port score the wrong kind:

- `expect(o.isFoo()).toBe(true)` / `toBe(false)` (`assert_predicate`,
  `assert`) score `equal`; Rails' `assert_predicate` is `truthy`
  (`RAILS_MAP`, `:113-119`).
- `toHaveLength(0)` (`assert_empty`) scores `length`; Rails' is `empty` (`:96`).
- `toHaveProperty([k])` (`assert_includes` on a Hash) is unmapped; Rails' is
  `includes`.

The extractor already captures the matcher's literal first argument in
lockstep with the kind (`values`, `scripts/test-compare/extract-ts-core.ts:412-419`),
so the histogram can read `(kind, value)` pairs. This absorbs RFC 0127's
`assert-empty-table-disagrees-with-kind-gate` (trails#9221 hit it in
`packages/activejob/src/logging.test.ts`). Every `expect-sweep-*` story
depends on this one.

## Acceptance criteria

- [ ] `toBe` / `not:toBe` with a literal `true` / `false` scores `truthy` /
      `falsy` (negated through `NEGATION`), and the literal is dropped from the
      value comparison for those kinds.
- [ ] `toHaveLength` with a literal `0` scores `empty`; any other length stays
      `length`.
- [ ] `toHaveProperty` scores `includes`.
- [ ] `assertion-kinds.test.ts` (or `extract-ts-assertions.test.ts`) covers
      each mapping, including the negated forms.
- [ ] Run `pnpm parity:test` before and after on `origin/main`: report the
      per-package `kind` / `value` counter movement in the PR body. Counters
      only fall (existing `toBe(true)` ports of `assert_predicate` start to
      match).
