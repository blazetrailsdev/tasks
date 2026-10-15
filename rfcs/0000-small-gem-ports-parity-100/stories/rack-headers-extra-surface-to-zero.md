---
title: "Rack::Headers extra surface to zero (10 novel, 19 moved in headers.ts)"
status: draft
updated: 2026-10-15
rfc: "0000-small-gem-ports-parity-100"
cluster: rack-extra
packages: [rack]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package rack` scores `headers.ts` at 10 novel (`compactInPlace`, `flatten`, `has`, `mergeInPlace`, `rassoc`, `rejectInPlace`, `selectInPlace`, `sort`, `transformKeysInPlace`, `transformValuesInPlace`) and 19 moved (`compact`, `constructor`, `deconstructKeys`, `deleteIf`, `dup`, `each`, `eachKey`, `eachValue`, `empty`, `equals`, `from`, `get`, `inspect`, `keepIf`, `length`, `set`, `toArray`, `toHash`, `toString`). Ruby `Rack::Headers < Hash` (`vendor/rack/v3.1.14/lib/rack/headers.rb`) overrides only the key-normalizing methods; everything else is inherited from `Hash`. The `*InPlace` names are the bang methods spelled outside `docs/ruby-ts-conventions.md`. Existing stories: `rack-headers-to-hash-is-invented-surface` (0120, a deps edge) and `rack-headers-empty-is-a-getter-not-an-is-empty-predicate`.

## Acceptance criteria

- [ ] `headers.ts` shows 0 novel and 0 moved: bang methods use the conventions spelling, and inherited Hash surface comes from ruby-compat's `Hash` rather than being redeclared.
- [ ] `member?` / `merge!` are not re-added here (they belong to `rack-api-residual-members-inheritance-arity`).
