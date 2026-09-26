---
title: "InfoController's properties/routes/notes and matching_routes are stubs"
status: draft
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::InfoController` is at `vendor/rails/v8.0.2/railties/lib/rails/info_controller.rb:12-83`. In trails (`packages/trailties/src/info-controller.ts`) every action except the class body is a stub:

| Action       | Rails                                                                                                                                                                                                   | trails                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `index`      | `redirect_to action: :routes`                                                                                                                                                                           | hardcodes `"/rails/info/routes"` |
| `properties` | sets `@info = Rails::Info.to_html` and `@page_title`, renders the `rails/info/properties` template                                                                                                      | `render html: Info.toHtml()`     |
| `routes`     | with `params[:query]`: escapes it with `URI::RFC2396_PARSER.escape`, renders JSON of `matching_routes`. Without: builds `@routes_inspector = RoutesInspector.new(_routes.routes)`, renders the template | always renders JSON              |
| `notes`      | runs `Rails::SourceAnnotationExtractor`                                                                                                                                                                 | renders `[]`                     |

The private `matching_routes(query:, exact_match:)` (`:52-83`) is `matchingRoutes`, which returns `[]` for every query.

The ported tests in `info-controller.test.ts` assert empty results where Rails' `rails_info_controller_test.rb` asserts real matches. Examples: "info controller search returns exact matches for route names" and "info controller returns fuzzy matches for route names".

## Acceptance criteria

- `index`, `properties`, `routes` and `notes` mirror `info_controller.rb:12-44`, rendering their templates as Rails does.
- `matchingRoutes` ports `info_controller.rb:52-83` (RouteWrapper, exact/fuzzy arms, verb and controller#action matching).
- The remaining `rails_info_controller_test.rb` cases are ported with their Rails assertions.
