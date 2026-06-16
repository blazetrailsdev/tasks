---
title: "Bulb create/load raises 'this.readAttribute is not a function'"
status: in-progress
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 3
pr: 3486
claim: "2026-06-16T18:26:55Z"
assignee: "bulb-read-attribute-crash-on-create"
blocked-by: null
---

## Context

Surfaced during the inverse-associations canonical port (PR #3471). The
`AutomaticInverseFindingTests` test "has one and belongs to automatic inverse
shares objects" (Rails uses Car/Bulb) is skipped because creating/loading a
canonical `Bulb` raises `this.readAttribute is not a function`.

`Bulb` (`packages/activerecord/src/test-helpers/models/bulb.ts`) has a custom
`name`/accessor and a `belongsTo("car", { touch, counterCache })`. Something on
the create/load path invokes `readAttribute` on a receiver that does not have it
(likely a custom accessor or the counter-cache/touch path binding `this`
incorrectly). Rails `bulb.rb` works fine.

## Acceptance criteria

- [ ] `Bulb.create({ car_id })` and loading `car.bulb` no longer raise
      `this.readAttribute is not a function`.
- [ ] Un-skip "has one and belongs to automatic inverse shares objects" in
      `inverse-associations.test.ts` (Rails Car/Bulb object-sharing assertions).
