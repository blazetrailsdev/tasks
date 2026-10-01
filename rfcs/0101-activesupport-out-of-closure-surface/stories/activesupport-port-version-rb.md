---
title: "activesupport: port ActiveSupport.version and drop its version.rb exclusion row"
status: draft
updated: 2026-10-01
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`version.rb` is excluded from `parity:api` for activesupport by its row in
`scripts/parity/unported-files/version.ts`. Lifting the row scores
`version.rb → version.ts` 0/1: `ActiveSupport.version`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/version.rb:7-9`) has no port.
Its body is `gem_version`; `gemVersion()` in `packages/activesupport/src/gem-version.ts` returns a String under a `@missingRailsCall new — PERMANENT` receipt that a missing `Gem::Version` no longer justifies.
activemodel's port is the model: `packages/activemodel/src/version.ts` (trails PR 8363),
which also added the minimal `Gem::Version` at `packages/ruby-compat/src/gem/version.ts`.

## Acceptance criteria

- [ ] `ActiveSupport.version` is ported in the file mirroring `version.rb`, with Rails' body.
- [ ] activesupport is deleted from the list in `scripts/parity/unported-files/version.ts`; `pnpm parity:api` shows `version.rb` 1/1 for activesupport.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args
```
