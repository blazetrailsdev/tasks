---
title: "retire-load-belongs-to-and-load-has-one"
status: draft
updated: 2026-09-05
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: ["activerecord"]
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

`packages/activerecord/src/associations/instance-methods.ts:106-120` defines two
trails-only instance methods, `loadBelongsTo(name)` and `loadHasOne(name)`, both
exported on `InstanceMethods` (`:122-126`). Each asserts the macro
(`assertSingularAssociation`, `:54-76`), bumps
`_strictLoadingBypassCount` (`bypassStrictLoading`, `:78-84`) and awaits
`association(name).loadTarget()`.

Rails has neither. A singular association is read through its generated reader
(`associations.rb:1-...`, `builder/singular_association.rb:17-32`), and strict
loading is bypassed with `Base#strict_loading!`/the `strict_loading` scope
(`core.rb:...`, `relation/query_methods.rb`). The file itself has no Rails
counterpart, so every public name in it scores novel.

Roughly 60 call sites exist, essentially all in tests — see
`associations/belongs-to-associations.test.ts` (a PORTED file, which spells
`client.loadBelongsTo("firm")` where Rails writes `client.firm`) and the
`has-one-associations` suites. Converging is therefore mostly test motion onto
the dotted accessor, which is the house style
(`ship.parts`, not `association(ship, "parts")`).

RFC 0130's receipt pass tagged both `CONVERGEABLE <this story>`.

## Acceptance criteria

- Call sites read the association through the generated dotted accessor
  (`await client.firm`), with `strictLoading` handled the Rails way where the
  bypass was load-bearing.
- `loadBelongsTo`, `loadHasOne`, `assertSingularAssociation` and
  `bypassStrictLoading` are deleted from `instance-methods.ts`, along with their
  `declare loadBelongsTo:` / `declare loadHasOne:` declarations in the test
  models.
- Ported test names are unchanged (only bodies move).
- `instance-methods.ts` reports 0 novel; the extra-surface mark is tightened.
