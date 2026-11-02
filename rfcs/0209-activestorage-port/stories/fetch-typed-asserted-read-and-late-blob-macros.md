---
title: "fetch-typed-asserted-read-and-late-blob-macros"
status: draft
updated: 2026-11-02
rfc: "0209-activestorage-port"
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

trails#9636 lets `fetch@typed` (`scripts/api-compare/extract-ts-api.ts`, `readCannotBeUndefined(n.whenTrue)`) take an `as T` read at its asserted type, so `Variation#format`'s `Object.hasOwn(this.transformations, "format") ? (… as string) : "png"` credits `transformations.fetch(:format, :png)` (`vendor/rails/v8.0.2/activestorage/app/models/active_storage/variation.rb`). ruby-compat's `fetch` reads an own `undefined` as missing, so the cast weakens the gate for every asserted read.

## Acceptance criteria

- `fetch@typed` credits a read only where the declared type excludes `undefined`, and `Transformations` is typed so `Variation#format` still credits, or the owner rules the asserted read acceptable.
- `packages/activestorage/src/engine.trails.test.ts` covers a `Blob` / `VariantRecord` evaluated after `active_storage_reflection` fired, and the invented hook converges on Rails' direct `has_one_attached` (`blob/representable.rb:12`, `variant_record.rb:5`) if the load order allows.
