---
title: "Vendor @blazetrails/turbo and call turboPageRequiresReload"
status: ready
updated: 2026-11-26
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap's layout loads Turbo Drive (`app/assets/javascripts/application.js`), and
nine views opt out with a hand-written
`contentFor("head", tag("meta", { name: "turbo-visit-control", content: "reload" }))`
on their first line. trails already ports that helper:
`packages/turbo/lib/app/helpers/turbo/drive-helper.ts` `turboPageRequiresReload`,
in `@blazetrails/turbo`, present at `vendor/TRAILS_PIN`. trailmap does not vendor
the package: it is not in `scripts/vendor-trails.sh`'s root list, and it pulls in
`@blazetrails/actioncable`. `rails/DEVIATIONS.md` records the gap.

## Acceptance criteria

- `@blazetrails/turbo` added to `scripts/vendor-trails.sh`'s roots and vendored,
  in a PR of its own, like any bump.
- The nine views call `turboPageRequiresReload()`, with its helpers registered the
  way the package documents, and the hand-written meta and its DEVIATIONS entry go.
