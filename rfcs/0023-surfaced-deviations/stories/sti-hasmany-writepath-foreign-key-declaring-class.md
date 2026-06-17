---
title: "STI hasMany write-path FK derivation uses owner instance class"
status: claimed
updated: 2026-06-17
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 50
pr: null
claim: "2026-06-17T14:01:27Z"
assignee: "sti-hasmany-writepath-foreign-key-declaring-class"
blocked-by: null
---

## Context

Follow-up surfaced by RFC 0030 `b2-sti-hasmany-preload-foreign-key` (PR #3421).
That PR fixed the hasMany **read/scope** FK derivation in `computeHasManyWhere`
(`packages/activerecord/src/associations.ts:1455`) to prefer
`reflection.foreignKey` — derived from the association's _declaring_ class
(`reflection.active_record`), matching Rails `reflection.foreign_key`. For an STI
subclass owner (e.g. a `SpecialPost` row whose `has_many :special_comments` is
declared on `Post`), this yields `comments.post_id` instead of the broken
`comments.special_post_id`.

The sibling **write paths** still derive the FK from the owner _instance's_
class via `underscore(ctor.name)_id` and carry the same latent STI bug:

- `collection-association.ts:599` `foreignKeyColumns()` (used by
  `setOwnerAttributes`, `computeNullifiedOwnerAttributes`)
- `collection-proxy.ts:793` `_buildRaw()` (build)
- `collection-proxy.ts:1518` `push()`
- `collection-proxy.ts:2090` `_buildNullifyUpdates()`

For a `SpecialPost` owner these would write/nullify `special_post_id` rather than
`post_id`. Not exercised by the merged test (which only covers read/scope +
eager/preload), so the regression is latent. Rails derives all of these from
`reflection.foreign_key` (the declaring class), never the owner instance class.

## Acceptance criteria

- [ ] hasMany build / push / `setOwnerAttributes` / nullify on an STI subclass
      owner write the declaring-class FK (`post_id`), not `special_post_id`.
- [ ] Route the four write-path derivations through `reflection.foreignKey`
      (mirroring the `computeHasManyWhere` fix), keeping the `ctor.name` fallback
      only for anonymous inline associations with no registered reflection.
- [ ] Add a faithful test: build/push/nullify a `SpecialComment` through a
      `SpecialPost` owner and assert `post_id` is set.
