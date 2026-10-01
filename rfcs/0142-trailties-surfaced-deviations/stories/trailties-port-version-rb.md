---
title: "trailties: port Rails.version and drop its version.rb exclusion row"
status: draft
updated: 2026-10-01
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
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

`version.rb` is excluded from `parity:api` for trailties by its row in
`scripts/parity/unported-files/version.ts`. Lifting the row scores
`version.rb → version.ts` 0/1: `Rails.version`
(`vendor/rails/v8.0.2/railties/lib/rails/version.rb:7-9`) has no port.
Its body is `VERSION::STRING`; `packages/trailties/src/version.ts` holds only a `VERSION` string constant, where Rails' `VERSION` module lives in `gem_version.rb`.
activemodel's port is the model: `packages/activemodel/src/version.ts` (trails PR 8363),
which also added the minimal `Gem::Version` at `packages/ruby-compat/src/gem/version.ts`.

## Acceptance criteria

- [ ] `Rails.version` is ported in the file mirroring `version.rb`, with Rails' body.
- [ ] trailties is deleted from the list in `scripts/parity/unported-files/version.ts`; `pnpm parity:api` shows `version.rb` 1/1 for trailties.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args
```
