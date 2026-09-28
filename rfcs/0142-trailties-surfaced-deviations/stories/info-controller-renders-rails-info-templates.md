---
title: "info-controller-renders-rails-info-templates"
status: ready
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`info-controller-actions-are-stubs` ported `Rails::InfoController#routes`' query
arm and the private `matching_routes`
(`vendor/rails/v8.0.2/railties/lib/rails/info_controller.rb:21-28,44-70`). The
template-rendering actions are still stubs in
`packages/trailties/src/info-controller.ts`:

- `index` (`info_controller.rb:12-14`) is `redirect_to action: :routes`; trails
  hardcodes `this.redirectTo("/rails/info/routes")`, because
  `ActionController.Base#redirectTo` (`packages/actionpack/src/action-controller/base.ts:475`)
  takes only a string and never reaches `_computeRedirectToLocation`
  (`action-controller/metal/redirecting.ts:45`). In the test case,
  `this.urlFor({ action: "routes" })` raises "No route matches {:action=>"routes"}",
  so the recall of the current controller is missing too. Related:
  `split-redirect-to-into-redirecting-and-flash`.
- `properties` (`:16-19`) sets `@info = Rails::Info.to_html`, `@page_title = "Properties"`
  and renders `rails/info/properties.html.erb`; trails renders `html: Info.toHtml()`.
- `routes` without a query (`:29-32`) builds
  `ActionDispatch::Routing::RoutesInspector.new(_routes.routes)` and renders
  `routes.html.erb`, which calls
  `@routes_inspector.format(ActionDispatch::Routing::HtmlTableFormatter.new(self))`.
  `HtmlTableFormatter` (`actionpack/lib/action_dispatch/routing/inspector.rb`) is not
  ported in `packages/actionpack/src/action-dispatch/routing/inspector.ts`; trails
  renders `json: { exact: [], fuzzy: [] }`.
- `notes` (`:35-41`) runs `Rails::SourceAnnotationExtractor.new(Annotation.tags.join("|")).find(Annotation.directories)`
  and renders `notes.html.erb`; trails renders `json: []`.
- `packages/trailties/src/templates/rails/info/{properties,routes}.ejs` exist but
  nothing renders them; `notes` has no template.

## Acceptance criteria

- `index` passes `{ action: "routes" }` to `redirectTo`, and the redirect resolves
  through `urlFor`.
- `properties`, `routes` (no query) and `notes` set Rails' ivars and render the
  `rails/info/*` templates, ported as `.tse`.
- `HtmlTableFormatter` is ported for the routes template.
- `rails_info_controller_test.rb`'s "info controller renders a table with properties"
  asserts `table` via the template, and "info controller routes shows source location"
  is ported.
