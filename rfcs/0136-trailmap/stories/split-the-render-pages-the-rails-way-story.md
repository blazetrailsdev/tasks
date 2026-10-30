---
title: "Split render-trailmap-pages-through-helpers-assigns-and-route-helpers: it measures about 700 lines, not 280"
status: claimed
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-10-30T09:56:35Z"
assignee: "split-the-render-pages-the-rails-way-story"
blocked-by: null
closed-reason: null
---

## Context

`render-trailmap-pages-through-helpers-assigns-and-route-helpers` was claimed
in a bundle (trailmap#68) and released. Its estimate is 280 LOC; a
measured outline came to roughly 700 diff lines, because moving `RfcRow`,
`BacklogRow` and `RfcStoryRow` out of two controllers of 240 and 370 lines
counts twice, and "no view builds an app URL by string concatenation" reaches
every view under `app/views`, not only the three controllers the story names
(`repo-issues`, `repo-projects`, `repo-pulls`, `repo-actions`,
`shared/_repo-header`, `home`, `panes` all hard-code `/rfc/...`, `/story/...`
or `/<owner>/...`). It does not fit a bundle under the 800-line ceiling.

What was learned while prototyping it:

- Named routes work: `as:` on the page routes plus `<%= rfcsPath() %>` in the
  layout rendered correctly.
- Under test the views need route helpers included; see the trails story
  `controller-tests-lack-route-helpers-and-rescue-responses-without-booting`.
- `stylesheetLinkTag("application")` rendered `/stylesheets/application.css`
  in a controller test, and trailmap serves `/assets/stylesheets/application.css`.
  `test/controllers/home-controller.test.ts` asserts the current hand-written
  tag exactly, so that bullet conflicts with "no assertion changes" until the
  helper's output under boot is known.
- `MarkdownHelper` has to be added to the helper stand-in in
  `test/support/controller-test-case.ts` once views call `renderMarkdown`.

## Acceptance criteria

- The story is split into pieces that each fit one PR, for example: named
  routes and path helpers in every view; instance assigns and row derivations
  for `rfc-pages`; the same for `story-pages` and `dashboard`; markdown,
  `pluralize` and the partial shorthand.
- Each piece carries a measured estimate.
- The `stylesheetLinkTag` bullet is either dropped, or made conditional on the
  helper emitting a path trailmap serves.
