---
title: "Marcel::MimeType.for(extension:) call sites pass Rails' arguments (variation, representable)"
status: ready
updated: 2026-11-24
rfc: "0215-activestorage-cloud-services"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm exec tsx scripts/api-compare/lint-call-args.ts --no-regen --package activestorage` on origin/main (2026-11-23) reports two NEW call-argument mismatches against `Marcel::MimeType.for(extension: ...)`:

- `packages/activestorage/lib/variation.ts:60` `Marcel.MimeType.for(null, { extension: this.format })`; Rails `vendor/rails/v8.0.5.2/activestorage/app/models/active_storage/variation.rb:71` passes `format.to_s`.
- `packages/activestorage/lib/blob/representable.ts:100` `Marcel.MimeType.for(null, { extension: this.filename.extension() })`; Rails `vendor/rails/v8.0.5.2/activestorage/app/models/active_storage/blob/representable.rb:193` passes `filename.extension` (gate reads `ref:extension`).

## Acceptance criteria

- [ ] Both calls pass what Rails passes (`String(this.format)` / the `toS` form for `format.to_s`; the `extension` read as the gate credits it), or the gate is shown to mis-score and fixed there
- [ ] `lint-call-args --package activestorage` reports 0 new rows
