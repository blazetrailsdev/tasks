---
title: "batches :order message hand-rolls Symbol#inspect because ActiveSupport's Object#inspect is unreachable"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
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
closed-reason: "merged into retire-remaining-ruby-inspect-copies-onto-the-activesupport-port — this is one of the private partial Object#inspect copies that story retires onto core-ext/object/inspect.ts; retiring the copy IS the fix"
---

## Context

`vendor/rails/activerecord/lib/active_record/relation/batches.rb:324`
interpolates `order.inspect`, and `:order` takes Symbols, so Rails prints
`:invalid` and `[:asc, :sideways]`. trails spells a Ruby Symbol as a bare
string (CLAUDE.md, "A Ruby Symbol is a JS string"), so PR #6646 restored the
colon and hand-rolled the `Symbol#inspect` / `Array#inspect` rendering inline
at `packages/activerecord/src/relation/batches.ts` (in
`ensureValidOptionsForBatchingBang`):

```ts
const inspected = Array.isArray(order) ? `[${order.map((o) => `:${o}`).join(", ")}]` : `:${order}`;
```

ActiveSupport already carries the ported `Object#inspect` with exactly the
Symbol arm this needs — `packages/activesupport/src/core-ext/object/inspect.ts`,
whose `SYMBOL_RE` emits a colon-prefixed string bare rather than quoted — but
it is not exported from `packages/activesupport/src/index.ts`, so ActiveRecord
cannot reach it. #6646 tried exporting it and backed the export out:
`pnpm parity:api:extra --package activesupport` then reports
`core-ext/object/inspect.ts — 1 novel [no Rails counterpart]`, because
`Object#inspect` is Ruby core rather than Rails and has no Ruby counterpart in
the vendored ActiveSupport tree.

AR's own `packages/activerecord/src/relation/ruby-inspect.ts` (`rubyInspect`)
is the third copy of this, and implements only the `String#inspect` arm — it
renders a trails Symbol as `"invalid"`, which is what #6646's first revision
shipped and a reviewer caught.

## Acceptance criteria

- [ ] One reachable `Object#inspect` — decide whether ActiveSupport's port is
      exported (and how `parity:api:extra` should classify a Ruby-core method
      with no Rails counterpart, e.g. a `@noRailsEquivalent` receipt) or
      whether `rubyInspect` grows the Symbol arm and the ActiveSupport copy
      routes through it.
- [ ] The inline rendering in `ensureValidOptionsForBatchingBang` is deleted
      and calls that one inspector.
- [ ] The message output is unchanged: `got :invalid` and
      `got [:asc, :sideways]`, per batches.rb:324 (covered by the two tests in
      `packages/activerecord/src/batches.trails.test.ts`).
- [ ] `pnpm parity:api:extra` reports no new novel surface.
