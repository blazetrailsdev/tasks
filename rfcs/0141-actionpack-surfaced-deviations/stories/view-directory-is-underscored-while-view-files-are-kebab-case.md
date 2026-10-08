---
title: "actionview: a controller's view directory is underscored while its view files are kebab-case"
status: done
updated: 2026-10-08
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionview", "actionpack"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8670
claim: "2026-10-08T01:09:44Z"
assignee: "view-directory-is-underscored-while-view-files-are-kebab-case"
blocked-by: null
closed-reason: null
---

## Context

The owner's rule in trails#8654 is that what lives in a file is kebab-case, and it was applied to
the template's FILE name. The directory a controller's templates are looked up in is still the
underscored controller path: `AbstractController::ViewPaths#localPrefixes`
(`packages/actionview/src/view-paths.ts`; Rails `actionview/lib/action_view/view_paths.rb`,
`local_prefixes` returns `[controller_path]`) gives `story_pages` for `StoryPagesController`, so
its views live in `app/views/story_pages/`.

trailmap overrides it: `ApplicationController.localPrefixes` returns the kebab-case form, so its
views are in `app/views/story-pages/` beside `story-pages-controller.ts`. That override is an
application doing what the framework's default would do under the owner's rule, and every trails
application that wants its directories to match its file names has to repeat it.

`controller_path` itself has to stay underscored: it names the controller in routes and URL
generation, where a hyphen is not legal.

## Expected shape

The default `localPrefixes` is the kebab-case form of `controllerPath`, receipted as the same
ratified rule, so `StoryPagesController` renders from `app/views/story-pages/` with no override.
Whether the underscored directory is also searched, for an application that has one, is a decision
to make here.

## Acceptance criteria

- [ ] A controller with a multi-word name renders from its kebab-case view directory by default; tested.
- [ ] `controllerPath` is unchanged, and routes and `url_for` still use it.
- [ ] `trails g controller` writes the kebab-case directory.
- [ ] trailmap deletes its `localPrefixes` override and `test/views/view-directory-names.test.ts` still passes.
