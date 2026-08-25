---
title: "finder-methods-take-offsets-memoization"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6586
claim: "2026-08-15T23:45:05Z"
assignee: "finder-methods-take-offsets-memoization"
blocked-by: null
closed-reason: null
---

## Context

`FinderMethods#find_take` and `#find_nth` memoize in Rails
(`vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:601-607`
and `:613-616`):

```ruby
def find_take
  if loaded?
    records.first
  else
    @take ||= limit(1).records.first
  end
end

def find_nth(index)
  @offsets ||= {}
  @offsets[index] ||= find_nth_with_limit(index, 1).first
end
```

trails' `packages/activerecord/src/relation/finder-methods.ts` ports both
bodies without the memo slot: `findTake` re-issues `limit(1)` on every call and
`findNth` re-issues `findNthWithLimit` on every call. `relation.ts` carries
neither `_take` nor `_offsets` (grepped 2026-08-15) and `Relation#reset` does
not clear them, which is the other half of the port: Rails resets both in
`relation.rb`'s `reset` (`@take = @offsets = nil`).

Surfaced while converging the RFC 0106 wave-2 `finder-methods.ts` call rows
(PR for `wave-2-relation-family`); left out of that PR because it touches
`relation.ts` state and `reset`, not just the finder bodies.

## Acceptance criteria

- [ ] `Relation` carries `@take` / `@offsets` equivalents with the Rails names,
      cleared by `reset` exactly where Rails clears them.
- [ ] `findTake` and `findNth` mirror the Ruby bodies including the `||=` memo.
- [ ] A test proves the second call issues no query.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
