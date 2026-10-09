---
title: "parity:api:calls pairs a tagged constructor whose only Rails initialize comes from another package's module"
status: draft
updated: 2026-10-09
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8727 made `parity:api:calls` throw `@inlinedFrom was never compared` for a tagged constructor the pairing pass never read (`scripts/api-compare/compare.ts`, after the per-file loop; `uncomparedInlinedTags` in `inlined-bodies.ts`). The chain is only built inside an existing `initialize` → `constructor` pair (`inlinedSegmentsFor`).

`flattenIncludedMethodInfos` (`compare.ts`) resolves an `include` against the including package's manifest alone. So a class that defines no `initialize` of its own and gets one only from a module in ANOTHER package has no pair, and tagging its constructor reds with no way to fix it. The motivating case is the RFC's own: `ActiveRecord::Base` includes `ActiveModel::API` directly (`vendor/rails/v8.0.2/activerecord/lib/active_record/base.rb:283`), whose `initialize` is `vendor/rails/v8.0.2/activemodel/lib/active_model/api.rb:80-84`. Base does pair today through `ActiveRecord::Core#initialize` (same package), but a class with only a cross-package module body does not.

`parity-api-credits-module-initialize-through-inlined-from` covers the `parity:api` CREDIT for such a module; it does not create the call-gate pair.

## Acceptance criteria

- A constructor carrying `@inlinedFrom` tags whose Rails class defines no `initialize` and inherits none through same-package flattening is still compared by `parity:api:calls` and `parity:api:calls:args`, against the tagged chain.
- The "never compared" throw remains for a tag on a constructor with no Rails class at all (wrong file, ambiguous owner).
- A test covers a class whose only `initialize` comes from a module in another package's manifest.
- Existing baselines are untouched.
