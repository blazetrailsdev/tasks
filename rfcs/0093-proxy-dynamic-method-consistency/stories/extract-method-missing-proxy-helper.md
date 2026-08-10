---
title: "Extract shared method_missing forwarding proxy helper"
status: done
updated: 2026-08-07
rfc: "0093-proxy-dynamic-method-consistency"
cluster: null
packages: ["activerecord", "activemodel"]
deps: []
deps-rfc: []
est-loc: 180
priority: 3
pr: 6202
claim: "2026-08-07T21:04:43Z"
assignee: "api-compare-orphan-buckets-activesupport-core-ext-tail-2"
blocked-by: null
closed-reason: null
---

## Context

Three sites hand-roll the same `method_missing` delegate-forwarding Proxy tail
— "own property → `Reflect.get`; else read `delegate[prop]`; `.bind()` if
function" — with only accidental spelling differences:

- `packages/activerecord/src/migration/command-recorder.ts:25` — mirrors
  `CommandRecorder#method_missing` / `respond_to_missing?`
  (`vendor/rails/activerecord/lib/active_record/migration/command_recorder.rb:395-406`);
  has a `has` trap; uses `Reflect.has(target, prop)`.
- `packages/activerecord/src/connection-adapters/connection-management.ts:73`
  (`BodyProxy.wrap`) — mirrors `Rack::BodyProxy` method_missing; has `has`;
  uses `prop in proxyTarget`.
- `packages/activemodel/src/type/normalized-value.ts:118`
  (`normalizedValueType`) — mirrors `DelegateClass(ActiveModel::Type::Value)`;
  checks an `overrides` record first; **no `has` trap**; deliberately passes
  `target` (not `receiver`) to `Reflect.get` so delegated methods like
  `deserialize` use the underlying type's un-normalized `cast`.

Extract a `methodMissingProxy`-style factory (~20 LOC, tagged
`@noRailsEquivalent` — the settled trails idiom for `method_missing`,
analogous to `include()` for Ruby `include`) supporting an optional overrides
record and delegate accessor, and adopt it at all three sites. The
`normalized-value.ts` receiver choice and bind-to-underlying-type semantics
must be preserved exactly (its comment explains why).

`model.ts:534` `withOptions` cannot adopt it unchanged (it intercepts rather
than falls through) — covered by the separate OptionMerger story.

## Acceptance criteria

- One shared helper; all three sites adopt it with unchanged observable
  behavior (`normalized-value` keeps un-normalized delegated `cast` dispatch —
  existing normalization tests prove it).
- Every adopter has a `has` trap (`respond_to_missing?`);
  `normalized-value.ts` gains one it lacks today.
- `pnpm parity:api:extra` for both packages: only the tagged helper appears;
  `pnpm parity:api:calls` non-negative.
