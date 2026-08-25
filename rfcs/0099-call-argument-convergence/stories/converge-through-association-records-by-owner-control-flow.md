---
title: "Converge Preloader::ThroughAssociation#records_by_owner control flow"
status: done
updated: 2026-08-21
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6826
claim: "2026-08-21T15:50:42Z"
assignee: "wave-4c-ar-core-residue-attributes-remainder-part-3"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the `records_by_owner` -> `loaded?` argument row in
PR #6823 (`args-dl-receiver-first-arg-residue`). The row itself is a
comparator-pairing artifact, but reading the two bodies side by side showed a
larger invented control flow.

Rails, `activerecord/lib/active_record/associations/preloader/through_association.rb:11-25`:

```ruby
def records_by_owner
  @records_by_owner ||= owners.each_with_object({}) do |owner, result|
    if loaded?(owner)
      result[owner] = target_for(owner)
      next
    end

    through_records = through_records_by_owner[owner] || []

    if owners.first.association(through_reflection.name).loaded?
      if source_type = reflection.options[:source_type]
        through_records = through_records.select do |record|
          record[reflection.foreign_type] == source_type
        end
      end
    end
    ...
```

`packages/activerecord/src/associations/preloader/through-association.ts`
`recordsByOwner` adds two things Rails does not have:

1. A **hoisted loop-invariant guard** before the loop
   (`this.owners.length > 0 && this.owners.every((owner) => this.isLoaded(owner))`)
   that returns early for the all-loaded case. Rails takes the per-owner `next`
   inside the loop; the port's comment argues the hoist is needed because its
   own `throughRecordsByOwner()` / `sourceRecordsByOwner()` are forced
   unconditionally _above_ the loop, where Ruby's are lazy hash reads forced on
   first use inside it.
2. A `throughLoadedOnFirst` IIFE with a `try/catch` computed before the loop,
   standing in for Rails' in-loop
   `owners.first.association(through_reflection.name).loaded?`. It also reads
   `?.loaded` as a property where Rails calls `loaded?`, and swallows any
   throw as `false` — Rails has no rescue here.

The root cause of (1) is the eager forcing, not the guard: converge that and
the hoist has nothing to justify it.

## Converged shape

- `throughRecordsByOwner` / `sourceRecordsByOwner` are consulted lazily inside
  the loop, as Ruby's memoized hash reads are, so the all-loaded case issues no
  query without a hoisted pre-check.
- The hoisted guard is deleted; the per-owner `isLoaded(owner)` arm with its
  `continue` is the only loaded check, matching `:13-16`.
- The `owners.first` through-association check moves back inside the loop at
  `:20`, with no `try/catch` arm.

## Acceptance criteria

- `recordsByOwner` has Rails' statement order and branch order, no hoisted
  loop-invariant and no rescue Rails does not have.
- The eager-loaded sub-chain case the hoist was added for stays green — the
  existing coverage is `has-many-through-associations` and `eager` in
  `packages/activerecord/src/associations/`.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green; the
  `records_by_owner` -> `loaded?` row is re-checked and deleted if the
  converged body makes it stale.
