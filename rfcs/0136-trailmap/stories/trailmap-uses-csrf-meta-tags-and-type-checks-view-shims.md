---
title: "trailmap: use csrfMetaTags, drop the csrfToken local, and type-check view shims"
status: draft
updated: 2026-10-06
rfc: "0136-trailmap"
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
closed-reason: null
---

## Context

Follow-up to trails story `port-action-view-csrf-helper`, surfaced by trailmap#40.

`ActionView::Helpers::CsrfHelper` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/csrf_helper.rb:22-32`)
is ported in trails (`packages/actionview/src/helpers/csrf-helper.ts`, landed in trails#8518) and
included into every view (`packages/actionview/src/helpers.ts`). trailmap's vendored trails
(`9e17ddc98d` plus trails#8566) predates it, which is why `csrfMetaTags()` failed the render there.

trailmap still carries the workaround: `app/controllers/dashboard-controller.ts` calls
`this.formAuthenticityToken()` and passes it to `app/views/dashboard/index.html.tse` as a
`csrfToken` local, which writes it into a `data-` attribute for `app/assets/javascripts/dashboard.js`.

Separately, trailmap never type-checks its view shims. Its `tsconfig.json` `include` lists
`.trails/template-registry-augmentation.d.ts` but not `.trails/views`, where a generated app lists
both (`packages/trailties/src/generators/app-generator.ts`, the tsconfig `include`). So a view
calling a helper that does not exist passes `tsc --noEmit`. With the `port-action-view-csrf-helper`
PR, every trailmap view resolves its render sites (a controller `render({ locals })` with no
template name is now read as the action's template), so once the shims are in `include` an unknown
name in a view is a compile error.

## Acceptance criteria

- [ ] trails is re-vendored at a commit containing trails#8518 and the `port-action-view-csrf-helper` PR.
- [ ] `app/views/layouts/application.html.tse` calls `csrfMetaTags()`; `DashboardController` no longer calls `formAuthenticityToken()` and the view takes no `csrfToken` local; `dashboard.js` reads the token from `meta[name="csrf-token"]`.
- [ ] `tsconfig.json` `include` lists `.trails/views`, and `tsc --noEmit` is clean.
- [ ] A view calling a helper that does not exist fails `tsc --noEmit` (verify once by hand, e.g. `<%= noSuchHelper() %>` in the layout).
