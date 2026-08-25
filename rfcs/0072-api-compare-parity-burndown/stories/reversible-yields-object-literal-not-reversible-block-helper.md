---
title: "reversible-yields-object-literal-not-reversible-block-helper"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6244
claim: "2026-08-08T16:15:56Z"
assignee: "reversible-yields-object-literal-not-reversible-block-helper"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Migration#reversible` (`vendor/rails/activerecord/lib/active_record/migration.rb:909-912`)
yields a `ReversibleBlockHelper` (`migration.rb:873-880`), a two-method Struct:

```ruby
ReversibleBlockHelper = Struct.new(:reverting) do # :nodoc:
  def up
    yield unless reverting
  end

  def down
    yield if reverting
  end
end
```

trails' `reversible` (`packages/activerecord/src/migration.ts`) yields an
object literal `{ up, down }` built inline instead — the extracted Rails class
is not ported at all, so `new:ReversibleBlockHelper` has no TS counterpart.
CLAUDE.md's decomposition rule ("if Rails extracts a helper, extract it, with
the Rails name") makes the literal a divergence.

Surfaced in review of PR #6182, which routed `reversible` through
`executeBlock` and moved the whole `fn(...)` invocation inside it (so the
recording pass now defers the block as Ruby's `yield helper` does). The helper
class itself was left alone: it is the one piece that does not port
mechanically. Ruby's `up`/`down` run their block inline as Ruby yields; trails'
registered callbacks are async and the registering block is not, so they must
be collected and awaited after `fn` returns. A ported `ReversibleBlockHelper`
therefore needs somewhere to hold the collected callbacks that Rails' Struct
does not have.

Note the `reversible`/`new` row in
`scripts/api-compare/call-mismatches-exclude/activerecord/migration.json` was
deleted in #6182 because the ratchet reported it STALE — a `new:` of an
unported class is outside the call-set population, so it no longer flags. The
divergence it originally described is this story.

## Acceptance criteria

- [ ] `ReversibleBlockHelper` exists at the Rails name with Rails' `reverting`
      field and `up`/`down` methods, and `reversible` constructs it rather than
      an object literal.
- [ ] Whatever holds the deferred callbacks is a JS private field (or otherwise
      not public surface) — `pnpm parity:api:extra --package activerecord` delta
      non-negative, no new `@noRailsEquivalent` public member.
- [ ] `invertible-migration.test.ts` stays green on all three adapter lanes.
- [ ] If the async deferral genuinely cannot be expressed without adding a
      public member Rails lacks, `pnpm tasks block` with that specific blocker
      rather than shipping a wider surface.
