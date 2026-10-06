---
title: "presence call sites drop the ?? null they no longer need"
status: draft
updated: 2026-10-06
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
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

Surfaced by trails#8570, which made activesupport's `presence`
(`packages/activesupport/src/core-ext/object/blank.ts`) answer `null` for a blank value, as Ruby's
`Object#presence` answers `nil` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/object/blank.rb`).

Call sites written against the old `undefined` answer still carry an `?? null` (or `?? undefined`) that
Rails' body does not have, each an invented short-circuit arm:

- `packages/activemodel/src/errors.ts` (`presence(matches.map(...)) ?? null`)
- `packages/activerecord/src/enum.ts` (`presence(value) ?? null`)
- `packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts` (`presence(value) ?? null`)
- `packages/activerecord/src/connection-adapters/mysql/schema-statements.ts` (`presence(field["Comment"]) ?? null`)
- `packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts` (`presence(comment) ?? undefined`)
- `packages/activerecord/src/associations/through-association.ts` (`presence(filterMap(...)) ?? null`)
- `packages/actionview/src/helpers/form-helper.ts` (`presence(compact(...).join("_")) ?? null`)

## Acceptance criteria

- [ ] Each site passes `presence(...)` bare, matching the Rails line it ports; types that carried the
      result admit `null`.
- [ ] `pnpm parity:api:arms:report` shows no `+or` on those methods from this residue.
