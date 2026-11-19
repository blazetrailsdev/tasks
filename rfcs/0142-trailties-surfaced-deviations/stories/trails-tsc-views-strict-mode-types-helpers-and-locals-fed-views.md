---
title: "trails-tsc-views-strict-mode-types-helpers-and-locals-fed-views"
status: draft
updated: 2026-11-19
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`story-pages-and-dashboard-render-through-instance-assigns` was implemented on trailmap branch
`trailmap-story-pages-instance-assigns` (commit a5ee806): `StoryPagesController` and
`DashboardController` set instance fields and call `render()` / `render({ action: "show", status })`,
`BacklogRow` moved to `app/helpers/story-pages-helper.ts` as `backlogRow`, and the dashboard script
uses `javascriptIncludeTag(await viteAssetPath("dashboard.js"), { type: "module" })`.

It cannot land: `NODE_ENV=test pnpm build --noEmit` reports ~70 `never` errors in other views, both
at trailmap's current pin (f2538399f) and with trails main vendored (438f85548, which includes
trails#10337's `tsc-views-strict-mode-misses-instance-assigns`).

Cause, in `packages/trails-tsc` `build-views` (`renderSite`): a render with no `locals` key returns
`undefined` and is skipped, so it neither resolves nor un-resolves a template. Today the only render
site keeping `unknownTemplate` true is story-pages' `{ action, locals }` with a non-literal `action`.
Once that site drops `locals`, every non-partial view goes strict, whatever `action` is. Strict mode
then types these as `never`:

- Views still fed by `render({ locals })` or by assigns the scan does not credit: `audits/index`
  (`audits-controller.ts:66-71`, `_renderPage(audits, selected, action?)`), `repo-actions`,
  `repo-code`, `repo-insights`, `repo-issues`, `repo-projects`, `repo-pulls`, `repo-settings`,
  `repo-wiki`, and the partial `shared/_repo-header` (`owner`, `repo`).
- View helpers: `javascriptIncludeTag` (dashboard), `selectTag` / `optionsForSelect`
  (`rfc-pages/index.html.tse:14`), `f.select` on a `formWith` builder (`rfc-pages/show.html.tse:121`),
  and one call in `layouts/application.html.tse:14`.

## Acceptance criteria

- With trailmap's story-pages and dashboard converted (branch above), `NODE_ENV=test pnpm exec
trails-tsc-views build --views app/views && NODE_ENV=test pnpm build --noEmit` passes in trailmap.
- Strict mode types the asset tag helpers, `selectTag` / `optionsForSelect` and `FormBuilder#select`
  rather than `never`; a build-views test pins each.
- A view whose controller renders it with locals that the scan cannot read stays unresolved
  instead of typing its locals `never`; a build-views test fails on main for this.
