---
title: "has_one_through: persisted-owner replace goes immediate; keep new-owner deferral"
status: ready
updated: 2026-07-17
rfc: "0000-awaitable-has-one-setter"
cluster: null
deps: ["retire-has-one-displacement-machinery"]
deps-rfc: []
est-loc: 200
priority: 13
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`HasOneThroughAssociation` carries its own deferral:
`queueWrite` (`packages/activerecord/src/associations/has-one-through-association.ts:104-106`)
queues `_pendingReplace` (:36) which `flushPendingReplaces` / `persistReplace`
drains at the owner's save. Rails' `HasOneThroughAssociation#replace`
(`vendor/rails/activerecord/lib/active_record/associations/has_one_through_association.rb:9-40`)
runs `create_through_record` AT ASSIGNMENT for a persisted owner
(`through_proxy.create(attributes)` / `through_record.update`), and defers
only for a new owner (`owner.new_record? || !save` → `through_proxy.build`,
:33-35) — that new-owner deferral is Rails-faithful and STAYS.

This story removes the through `queueWrite` override (unreachable once the
persisted-owner setter throws) and converges the persisted-owner path onto
the immediate `writer` → `persistReplace` (:115-119), so `_pendingReplace`
survives only in its Rails-faithful new-owner role. The
`detachDisplacedTarget` no-op override (:93) stays — a through's target has
no FK back to the owner.

## Acceptance criteria

- [ ] `queueWrite` override removed; no through code path defers a
      persisted-owner replace to save time.
- [ ] `await owner.set#{Name}(x)` on a persisted owner
      creates/updates/destroys the join row inline, mirroring
      `create_through_record` (:15-40) arm for arm.
- [ ] New-owner assignment still builds the join record and persists it at
      the owner's first save (Rails `:33-35`).
- [ ] has_one_through + autosave suites green;
      `_pendingReplace` remains only on the new-owner path (document the
      remaining role in its JSDoc).

## Verification

`pnpm vitest run packages/activerecord/src/associations/has-one-through-associations.test.ts`
