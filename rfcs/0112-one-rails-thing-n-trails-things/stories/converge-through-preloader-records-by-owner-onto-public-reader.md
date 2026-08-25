---
title: "Read the public recordsByOwner in the through-preloader merge helpers and retire the undefined-tolerant merge"
status: done
updated: 2026-08-20
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6778
claim: "2026-08-20T17:30:03Z"
assignee: "converge-includes-preload-colon-sweep-scoping-and-adapters"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while landing PR #6771 (`converge-preloader-preloaded-records-onto-load-records`),
which made every preloader reader awaitable.

Rails' `Preloader::ThroughAssociation` reads the **public**, forcing
`records_by_owner` reader from both of its merge helpers
(`vendor/rails/activerecord/lib/active_record/associations/preloader/through_association.rb:83-89`):

```ruby
def through_records_by_owner
  @through_records_by_owner ||= through_preloaders.map(&:records_by_owner).reduce(:merge)
end

def source_records_by_owner
  @source_records_by_owner ||= source_preloaders.map(&:records_by_owner).reduce(:merge)
end
```

trails reaches into the child loader's **private backing field** instead
(`packages/activerecord/src/associations/preloader/through-association.ts`,
`sourceRecordsByOwner` / `throughRecordsByOwner`):

```ts
this._sourceRecordsByOwner ??= (await this.sourcePreloaders())
  .map((l) => (l as any)._recordsByOwner as Map<Base, Base[]> | undefined)
  .reduce(merge, new Map<Base, Base[]>());
```

That is why the file carries a `merge` helper with no Rails counterpart, whose
whole job is to propagate `undefined` when a child loader has not loaded yet —
a state Rails cannot observe, because `records_by_owner` forces `load_records`
before answering. It also forces `recordsByOwner` to pre-force its children in
a separate `Promise.all` pass, and leaves the `?? new Map()` fallbacks that
paper over the `undefined` arm.

The `(l as any)` cast was unavoidable while the readers were synchronous. It is
not any more: PR #6771 made `Association#recordsByOwner()` awaitable and
`sourcePreloaders()` / `throughPreloaders()` awaitable along with it, so both
helpers can now await the public reader exactly as Rails does.

## Converged shape

Both helpers `await` each child loader's public `recordsByOwner()` and reduce
with a plain `merge`, matching `through_association.rb:83-89`. The
`undefined`-propagating `merge` free function, the `?? new Map()` fallbacks,
and the pre-forcing `Promise.all` pass in `recordsByOwner` all go away — the
forcing is the reader's own contract again, as it is in Ruby.

## Acceptance criteria

- [ ] `sourceRecordsByOwner` / `throughRecordsByOwner` read the public
      `recordsByOwner()` on each child loader; no `(l as any)._recordsByOwner`
      remains.
- [ ] The `undefined`-tolerant `merge` free function is deleted (or reduced to
      Rails' plain `reduce(:merge)` shape) along with the `?? new Map()` arms.
- [ ] The `Promise.all` pre-forcing pass at the top of
      `ThroughAssociation#recordsByOwner` is removed — the merge helpers force
      their own children.
- [ ] `pnpm parity:api:calls` / `:args` green; `pnpm parity:api:extra --package
activerecord` does not grow; the through/preloader suites pass with no
      test renames.
