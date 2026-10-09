---
title: "activerecord: ReversibleBlockHelper#up / #down yield in line; no queued block list"
status: done
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8700
claim: "2026-10-09T01:00:23Z"
assignee: "relation-layer-with-connection-receipts-are-not-the-tosql-sites"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-root-a-m` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`ReversibleBlockHelper` (`vendor/rails/v8.0.2/activerecord/lib/active_record/migration.rb:873-881`) is a one-member Struct whose two methods yield
at once:

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

and `reversible` (`migration.rb:909-912`) is `execute_block { yield helper }`.

`packages/activerecord/src/migration.ts` instead has `up(fn)` / `down(fn)` push the block onto a
symbol-keyed `[toRun]` list (`@noRailsEquivalent`), which `reversible` drains after the caller's
block returns. That reorders a migration: in Rails, statements written between `dir.up { … }` and
the end of the `reversible` block run after the `up` block; in trails they run before it.

## Converged shape

`up(fn)` returns `fn()` when not reverting and `down(fn)` when reverting, so the caller writes
`await dir.up(async () => { … })` and the block runs where Rails runs it. `[toRun]` and the drain
loop are deleted, and `ReversibleBlockHelper` is `Struct.new("reverting")` through ruby-compat's
`Struct`. The generated-migration templates and the guides that show `dir.up(...)` gain the `await`.

## Acceptance criteria

- [ ] `ReversibleBlockHelper` has no `[toRun]` member and no receipt; `reversible` is `executeBlock(() => fn(helper))`.
- [ ] A test pins the order: a statement after `dir.up` inside the `reversible` block runs after the `up` block.
- [ ] Every in-repo `dir.up(` / `dir.down(` caller awaits the call.
- [ ] `pnpm parity:api:extra:gate` and `pnpm parity:api:receipts:gate` stay green.
