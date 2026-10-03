---
title: "DescendantsTracker#descendants and ReloadedClassesFiltering#descendants live in descendants-tracker.ts, not on ActiveRecord::Base"
status: draft
updated: 2026-10-03
rfc: "0101-activesupport-out-of-closure-surface"
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

Surfaced by trails#8437. `descendants_tracker.rb -> descendants-tracker.ts` scores 8/10; one miss is `WeakSet#initialize`, the other is the instance `descendants`.

Rails declares `descendants` on the instance side twice in `vendor/rails/v8.0.2/activesupport/lib/active_support/descendants_tracker.rb`:

- `ReloadedClassesFiltering#descendants` (`:63-65`): `DescendantsTracker.reject!(super)`, beside `#subclasses` (`:59-61`).
- `DescendantsTracker#descendants` (`:107-110`): `subclasses = DescendantsTracker.reject!(self.subclasses)` then `subclasses.concat(subclasses.flat_map(&:descendants))`.

`packages/activesupport/src/descendants-tracker.ts` ports only `ReloadedClassesFiltering.subclasses` (`:7-13`) and the singleton `DescendantsTracker.subclasses` / `.descendants` (namespace functions). The body of `DescendantsTracker#descendants` lives on the extender instead: `packages/activerecord/src/base.ts` `static get descendants()` (`:964-967`), line-for-line the Rails body, where Rails gets it from `extend ActiveSupport::DescendantsTracker` (`activerecord/lib/active_record/base.rb:286`). The extra-surface scorer allows it there through that extend edge, so nothing flags the relocation.

Sibling draft `descendants-tracker-singletons-dispatch-to-klass` covers the singleton pair only.

## Converged shape

`DescendantsTracker#descendants` and `ReloadedClassesFiltering#descendants` are defined in `descendants-tracker.ts`, and `Base` gets `descendants` from `extend(Base, DescendantsTracker…)` rather than declaring the body. `base.ts` keeps at most a `declare static` for the type.

## Acceptance criteria

- [ ] `descendants-tracker.ts` defines the instance `descendants` on both modules with the Rails bodies; `base.ts` no longer carries the body.
- [ ] `pnpm parity:api` shows `descendants_tracker.rb` at 9/10 or better, and `base.rb` unchanged.
- [ ] `pnpm parity:api:calls`, `:extra:gate` green; the DescendantsTracker tests in activesupport and `packages/activerecord/src/base.test.ts` pass.
