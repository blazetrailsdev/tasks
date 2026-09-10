---
title: "port-deep-mergeable-overridable-deep-merge-predicate"
status: draft
updated: 2026-09-10
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activesupport/lib/active_support/deep_mergeable.rb` is a mixin
module: `deep_merge` / `deep_merge!` (`:21-40`) dispatch through an overridable
instance predicate `deep_merge?(other)` (`:49-51`, `other.is_a?(self.class)`).

The trails port (`packages/activesupport/src/deep-mergeable.ts`) is a
`namespace DeepMergeable` of free functions over plain objects, with
`isDeepMergeable` (`:63`) hard-wired to `isPlainObject`. There is no instance
`deepMerge?` a host class can override, so
`deep_mergeable_test.rb:94` — `test "deep_merge? can be overridden to allow deep
merging of non-subclass values"` — cannot be ported; its `Wrapper` /
`OmniWrapper` Struct (`deep_mergeable_test.rb:6-37`) includes the module and
overrides `deep_merge?` with `super || other.is_a?(OtherWrapper)`.

The stub is `packages/activesupport/src/deep-mergeable.test.ts:70`
(`it.skip`). Surfaced by `port-inflector-dependencies-and-in-closure-residue`
(RFC 0105), which kept that PR to the test side per the RFC 0098 overlap note.

## Acceptance criteria

- `DeepMergeable` is an includable mixin (`include()` / `Included<>`) carrying
  `deepMerge`, `deepMergeBang` and an overridable `isDeepMerge` (the TS
  spelling of `deep_merge?` per docs/ruby-ts-conventions.md), mirroring
  `deep_mergeable.rb:21-51`.
- `deep-mergeable.test.ts` ports `Wrapper`/`SubWrapper`/`OtherWrapper`/
  `OmniWrapper` from `deep_mergeable_test.rb:6-37`, and
  "deep_merge? can be overridden to allow deep merging of non-subclass values"
  is unskipped and passing.
- `pnpm parity:api:extra:gate` and `pnpm parity:api:calls` stay green.
