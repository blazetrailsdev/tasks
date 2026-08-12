---
title: "Converge the autosave save-body locals to the Rails identifiers"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6385
claim: "2026-08-11T23:26:01Z"
assignee: "converge-autosave-belongs-to-and-insert-helpers"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while folding the autosave save helpers into their Rails-named methods
(PR #6382, story `converge-autosave-association-instance-get`). The fold was
kept mechanical to stay inside the LOC ceiling, so the locals inside the three
save bodies still carry trails names rather than the Rails ones. CLAUDE.md:
"A local or parameter keeps the Rails identifier, camelCased."

`vendor/rails/activerecord/lib/active_record/autosave_association.rb:474-503`
(`save_has_one_association`) names the association `association` and the CHILD
record `record`; the owner is `self`. trails'
`packages/activerecord/src/autosave-association.ts` `saveHasOneAssociation`
inverts this: `record` is the OWNER, `childRecord` is the child, `inst` is the
association. A Rails dev reading `record._readAttribute(pk)` in the trails body
will read it as the child; it is the owner.

Same divergence in the two siblings:

- `saveBelongsToAssociation` (`autosave_association.rb:531-573`): Rails
  `association` / `record` (the child); trails `inst` / `assocRecord`, with
  `record` again bound to the owner.
- `saveCollectionAssociation` (`autosave_association.rb:419-462`): Rails
  `association` / `records` / `record`; trails `inst` / `children` / `child`.

## Converged shape

In all three bodies: `inst` -> `association`; the owner local drops out in
favour of `this` (or is named `owner` where a local is genuinely needed);
`childRecord` / `assocRecord` / `child` -> `record`; `children` -> `records`.
`saveHasOneAssociation` also still binds `ctor`, which Rails spells
`record.class` at each use.

Mechanical rename, no behavior change — the risk is only that the owner/child
flip must be applied consistently, since both currently answer to `record` in
different bodies.

## Acceptance criteria

1. The three save bodies use the Rails locals above.
2. No behavior change; `autosave-association.test.ts` (201) and
   `.trails.test.ts` (9) stay green.
3. `pnpm parity:api:calls` / `pnpm parity:api:calls:args` non-regressive.
