---
title: "Bump trails past #8670 and delete the localPrefixes override"
status: draft
updated: 2026-10-08
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8670 (merged) makes `ViewPaths.localPrefixes` return the controller path
in kebab-case, which is what trailmap has been doing for itself in
`app/controllers/application-controller.ts:20-22`:

    static localPrefixes(): string[] {
      return [this.controllerPath().replace(/_/g, "-")];
    }

Once the pin includes #8670 that override repeats the framework and should go.

The same PR changes two things an application can feel:

- A record rendered by itself (`render(story)`) is looked up in the kebab-case
  directory of its partial path (`line_items/line_item` -> `line-items/_line_item`).
  trailmap's views appear to render only named partials
  (`render({ partial: "shared/status-badge", ... })`); confirm none renders a record.
- The scaffold and controller generators write kebab-case view directories.

Not included: the implied layout name is still underscored in trails
(trails story `implied-layout-name-is-underscored-while-view-directories-are-kebab-case`);
trailmap has only `layouts/application`, so it is unaffected.

## Acceptance criteria

- `vendor/TRAILS_PIN` is at or past the merge of trails#8670, bumped by
  `scripts/vendor-trails.sh` in its own PR (clean the pack checkout's build
  output first).
- `ApplicationController.localPrefixes` is deleted and every page still renders;
  `pnpm gate`, `gate:lists`, `gate:markdown`, `gate:snapshot` and
  `scripts/smoke-boot.sh` pass.
- The PR body carries the usual screenshots.
