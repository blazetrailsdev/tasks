---
title: "Render trailmap's pages the Rails way: helpers in views, instance assigns, named-route helpers, asset tags"
status: draft
updated: 2026-09-23
rfc: "0136-trailmap"
cluster: null
packages: ["actionview", "actionpack"]
deps: ["re-vendor-trails-for-app-helpers"]
deps-rfc: []
est-loc: 280
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

From the trailmap Rails-idiom audit. The page controllers build view-model
rows and pass them as `locals`, and the views hard-code every URL. Rails does
neither. Most of this was forced by `app/helpers` being inert in the vendored
pin. `re-vendor-trails-for-app-helpers` lifts that, and this story is the
follow-through that the re-vendor story's acceptance criteria stop short of.
Its scope there is the status-badge normalisation only.

1. **Markdown is rendered in the controller.** `renderMarkdown(doc.markdown)`
   is called at `app/controllers/rfc-pages-controller.ts:182` and
   `story-pages-controller.ts:251`, and the view receives a finished
   `SafeBuffer` (`app/views/shared/_document.html.tse:4-9` says why: helpers
   were inert). In Rails the view calls the helper,
   `<%= render_markdown(@document) %>`. `MarkdownHelper`
   (`app/helpers/markdown-helper.ts:304-306`) already exports it.
2. **`render({ locals })` instead of instance assigns.** Every page action
   assembles a locals hash (`rfc-pages-controller.ts:123-151,190-195`,
   `story-pages-controller.ts:148-189,259-264`, `dashboard-controller.ts:19-21`).
   The comment "assembled here because a `.tse` cannot compute"
   (`rfc-pages-controller.ts:26-27,46`, `story-pages-controller.ts:27`) isn't
   true of trails: templates run under `with (this)`
   (`packages/actionview/src/template.ts:310`), and controller fields reach the
   view through `viewAssigns` (`packages/actionpack/src/abstract-controller/rendering.ts:59-67`),
   which `ActionView::Base#assign` copies onto the view
   (`packages/actionview/src/base.ts:196-200`). The Rails shape is instance
   fields set in the action (`this.rfc = ...`), implicit render, and
   per-row derivations (`RfcRow`, `BacklogRow`, `RfcStoryRow`) in helpers or
   model methods. The not-found path `renderPage(..., 404)` becomes
   `this.render({ status: 404 })` / `"not_found"` against the same template.
3. **Hard-coded URLs.** `href="/rfc/<%= row.id %>"`, `"/story/..."`,
   `"/rfcs"`, `"/backlog"`, `"/dashboard"`, `"/"` in
   `app/views/layouts/application.html.tse:11,15-17`,
   `home/index.html.tse:7-9`, `rfc-pages/index.html.tse:19`,
   `rfc-pages/show.html.tse:36,57`, `story-pages/index.html.tse:26,34,37`,
   `story-pages/show.html.tse:11,32,40,56`. Tab hrefs are built as strings in
   the controllers (`rfc-pages-controller.ts:131`,
   `story-pages-controller.ts:139`). In Rails, routes carry `as:` names and
   views call `rfc_path(row.id)`. trails generates named-route helpers into
   views (`packages/trailties/src/__fixtures__/boot-app/app/views/posts/show.html.tse:3`,
   `postsPath()` from `as: "posts"`). `config/routes.ts` names none.
   (`link_to` itself is unported: `port-url-helper-and-include-routing-url-for`,
   RFC 0140. Use `<a href="<%= rfcPath(id) %>">` until it lands.)
4. **Asset tags written by hand.** The layout writes
   `<link rel="stylesheet" href="/assets/stylesheets/application.css">`
   (`layouts/application.html.tse:7`), where the generator and Rails use
   `stylesheetLinkTag("application")`
   (`packages/trailties/src/generators/app-generator.ts:694`;
   `railties/lib/rails/generators/rails/app/templates/app/views/layouts/application.html.erb.tt:23`).
   `app/views/dashboard/index.html.tse:50` hand-writes its `<script>` tag the
   same way.
5. **Pluralization by ternary.** `total === 1 ? "RFC" : "RFCs"`
   (`rfc-pages/index.html.tse:4`, `:30`; `rfc-pages/show.html.tse:10`). Rails
   uses `pluralize(count, "RFC")` (`actionview/lib/action_view/helpers/text_helper.rb:290`),
   ported at `packages/actionview/src/helpers/text-helper.ts:62`.
6. **Partial calls.** `render({ partial: "shared/status-badge", locals: { status } })`
   appears about 15 times. The view `render` takes the Rails shorthand,
   `render("shared/status-badge", { status })`
   (`packages/actionview/src/base.ts:251-270`).

## Acceptance criteria

- The show pages render markdown in the view through `MarkdownHelper`. No
  controller imports `renderMarkdown`.
- Page actions set instance fields and render implicitly. No `render({ locals })`
  remains in `rfc-pages`, `story-pages` or `dashboard`. Row derivations live in
  `app/helpers/*` or on the models.
- Every page route in `config/routes.ts` has an `as:` name, and no view or
  controller builds an app URL by string concatenation.
- The layout uses `stylesheetLinkTag("application")`. The dashboard script
  uses the asset tag helper if trails ports `javascript_include_tag`;
  otherwise the gap is noted against
  `port-the-rest-of-asset-tag-helper-and-asset-url-helper`.
- Count phrases use `pluralize`, and partials use the `render(name, locals)`
  shorthand.
- `pnpm gate:snapshot` and the page tests pass with no assertion changes.
