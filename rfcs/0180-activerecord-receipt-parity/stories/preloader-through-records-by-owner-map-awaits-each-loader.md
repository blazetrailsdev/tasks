---
title: "activerecord: Preloader::ThroughAssociation maps its loaders through an awaiting map"
status: ready
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord", "ruby-compat"]
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

Surfaced by the `activerecord-audit-permanent-receipts-associations` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`Preloader::ThroughAssociation` builds its two owner maps with `map`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/preloader/through_association.rb:88-94`):

```ruby
def source_records_by_owner
  @source_records_by_owner ||= source_preloaders.map(&:records_by_owner).reduce(:merge)
end

def through_records_by_owner
  @through_records_by_owner ||= through_preloaders.map(&:records_by_owner).reduce(:merge)
end
```

In trails `recordsByOwner()` is async, so
`packages/activerecord/src/associations/preloader/through-association.ts` writes a `for … of` loop that
awaits each loader and pushes — a sequential `map` with no `map` call — and both methods carry
`@missingRailsCall map`. `Promise.all(loaders.map(...))` would emit the call but starts every loader at
once, where Ruby runs them in order.

No CLAUDE.md section ratifies the loop, and ruby-compat has no awaiting `map`. The settled answer for a
Ruby-core call with no JS call form is a ruby-compat export the body calls (`isEmpty`, `first`,
`aryCount`, `partition`); the same holds for a block that awaits.

`activerecord-converge-preloader-through-reduce-merge` owns the `reduce(:merge)` half of these two
lines; land the two together or in either order.

## Acceptance criteria

- [ ] The two bodies call a `map` that awaits each block result in order — a ruby-compat export with its MRI anchor (`vendor/ruby/v3.3.11/array.c:3625` `rb_ary_collect`) and unit tests — and the hand-written loops are gone.
- [ ] Both `@missingRailsCall map` receipts are deleted; `pnpm parity:api:calls` green with no new row.
- [ ] Loader order is unchanged: the preloader query-count and query-order tests pass.

## Verification

```bash
pnpm parity:api:calls && pnpm vitest run packages/activerecord/src/associations/nested-through-preloader.trails.test.ts packages/activerecord/src/associations/has-many-through-associations.test.ts
```
