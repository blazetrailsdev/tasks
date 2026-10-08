---
title: "Implied layout name follows the kebab-case view directory rule"
status: in-progress
updated: 2026-10-08
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8678
claim: "2026-10-08T13:47:59Z"
assignee: "implied-layout-name-is-underscored-while-view-directories-are-kebab-case"
blocked-by: null
closed-reason: null
---

## Context

trails#8670 made a controller's view directory its path in kebab-case
(`ViewPaths::ClassMethods#localPrefixes`, `packages/actionview/src/view-paths.ts`,
`@inventedArm dasherize — PERMANENT`; rule in `CLAUDE.md`, "An action's name is
its method's name"). The implied layout name was left out of that PR:
`_impliedLayoutName` (`packages/actionview/src/layouts.ts:139-141`) still
returns `this.controllerPath()`, so `Admin::StoryPagesController` renders its
templates from `admin/story-pages/` but looks for its own layout at
`layouts/admin/story_pages`.

Rails: `actionview/lib/action_view/layouts.rb:345-347`
(`def _implied_layout_name; controller_path; end`), consumed at
`layouts.rb:286-287`.

The ratified rule is that a file-backed name the framework derives from a
controller is kebab-case, so the layout file should sit beside the view
directory under the same spelling: `layouts/admin/story-pages.html.tse`.

## Acceptance criteria

- `_impliedLayoutName` returns the dasherized controller path, namespaces kept;
  `controllerPath()` is unchanged. The deviation from `layouts.rb:345-347` is
  recorded in `CLAUDE.md`. (Amended 2026-10-08: this criterion first required
  an `@inventedArm dasherize — PERMANENT` tag. The arm-throw gate fails that
  tag as stale because the comparison omits this declaration; the receipt is
  tracked by `invented-arm-receipt-is-rejected-on-declarations-the-comparison-omits`.)
- A multi-word controller with a layout at `layouts/<kebab-path>` renders
  inside it; a test covers a namespaced multi-word controller.
- Fixture layouts with multi-word names are renamed with their references.
- `trails-tsc`'s view compiler resolves the same file, if it resolves implied
  layouts at all.
- The `CLAUDE.md` section lists the site.
