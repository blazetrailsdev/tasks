---
title: "activerecord: has_many :through delete_records runs scope.each(&:_run_destroy_callbacks); Relation#each awaits its block"
status: draft
updated: 2026-10-11
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left over from `callback-run-sites-call-the-generated-run-name-callbacks` (trails#8774).

`HasManyThroughAssociation#delete_records`' `:destroy` arm without a primary key
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/has_many_through_association.rb:152`) is

```ruby
scope.each(&:_run_destroy_callbacks)
count = scope.delete_all
```

`packages/activerecord/src/associations/has-many-through-association.ts:207` is

```ts
for (const r of (await scope.toArray()) as Base[]) await r._runDestroyCallbacks();
```

trails#8774 converged the callee and left the loop: `Relation#each`
(`packages/activerecord/src/relation/delegation.ts:281`, declared `relation.ts:2034`) takes a
`(record, index) => void` block and does not await what it returns, and the destroy chain is async.
Rails' `each` is `records.each` (`relation/delegation.rb`, the `ARRAY_DELEGATES` list), which runs each
block to completion before the next.

## Acceptance criteria

- [ ] `Relation#each` awaits a block that returns a promise before yielding the next record, so an async block runs in order as Ruby's does.
- [ ] `has-many-through-association.ts` `deleteRecords` reads `await scope.each((r) => r._runDestroyCallbacks())` with no `toArray` and no `for` loop.
- [ ] A test on a `has_many :through` whose through model has no primary key shows the destroy callbacks of every through record finishing before `delete_all` runs.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green with no new row.
