---
title: "Repository.checkoutsOrNone catches ConnectionNotEstablished, as Rails does"
status: done
updated: 2026-11-17
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: trailmap#153
claim: "2026-11-17T18:21:25Z"
assignee: "box-mobile-full-bleed-rule-is-dead"
blocked-by: null
closed-reason: null
---

## Context

trailmap#150 made `Repository.missingCheckout` catch both `ConnectionNotDefined`
and `ConnectionNotEstablished`, matching Rails' `missing_checkout` and
`checkouts_or_none` (`rails/app/models/repository.rb`, `rescue
ActiveRecord::ConnectionNotEstablished, ActiveRecord::ConnectionNotDefined`).
Its neighbour `Repository.checkoutsOrNone` (`app/models/repository.ts`) still
catches only `ConnectionNotDefined`, so the twins differ on a hub that is
configured but unreachable: Rails offers the environment's repos, and trails
raises.

## Acceptance criteria

- `checkoutsOrNone` catches `ConnectionNotEstablished` as well, and its
  docblock says why.
- A test on each side covers an unreachable hub giving the environment's entries.
