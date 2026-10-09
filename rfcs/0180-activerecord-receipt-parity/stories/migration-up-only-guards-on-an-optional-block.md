---
title: "activerecord: Migration#upOnly guards on an optional block Rails' up_only does not test"
status: draft
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `reversible` in trails#8700.

Rails' `Migration#up_only` (`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:928-930`) is:

```ruby
def up_only(&block)
  execute_block(&block) unless reverting?
end
```

`packages/activerecord/src/migration.ts` `upOnly` declares the block optional (`fn?: () => Promise<void>`) and guards on it:
`if (!this.isReverting() && fn) { await this.executeBlock(fn); }`. The `&& fn` test is an arm Rails does not take: with no
block, Rails still calls `execute_block`, whose `yield` raises `LocalJumpError`. trails#8700 removed the same invented
guard from `reversible` (`migration.rb:909-912`).

## Converged shape

`async upOnly(block: () => Promise<void>): Promise<void>` with the body
`if (!this.isReverting()) await this.executeBlock(block);`. The parameter is required and named for Rails' `&block`.

## Acceptance criteria

- [ ] `upOnly` has no test on its block; the only guard is `isReverting()`.
- [ ] The parameter is required, and every in-repo `upOnly(` caller still type-checks.
- [ ] `pnpm parity:api:params` and `pnpm parity:api:arms:throws` stay green.
