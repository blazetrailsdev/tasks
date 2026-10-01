---
title: "actionview: port ActionView.version and drop its version.rb exclusion row"
status: draft
updated: 2026-10-01
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
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

`version.rb` is excluded from `parity:api` for actionview by its row in
`scripts/parity/unported-files/version.ts`. Lifting the row scores
`version.rb → version.ts` 0/1: `ActionView.version`
(`vendor/rails/v8.0.2/actionview/lib/action_view/version.rb:7-9`) has no port.
Its body is `gem_version`, and `ActionView.gem_version` (`gem_version.rb:5-7`) is unported too: `gem_version.rb → gem-version.ts` scores 0/1.
activemodel's port is the model: `packages/activemodel/src/version.ts` (trails PR 8363),
which also added the minimal `Gem::Version` at `packages/ruby-compat/src/gem/version.ts`.

## Acceptance criteria

- [ ] `ActionView.version` is ported in the file mirroring `version.rb`, with Rails' body.
- [ ] actionview is deleted from the list in `scripts/parity/unported-files/version.ts`; `pnpm parity:api` shows `version.rb` 1/1 for actionview.

## Verification

```bash
pnpm build && pnpm parity:api && pnpm parity:api:calls && pnpm parity:api:calls:args
```
