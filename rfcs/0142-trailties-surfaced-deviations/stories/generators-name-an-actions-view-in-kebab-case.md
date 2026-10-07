---
title: "trailties: check the generators write an action's view and locale key in kebab-case"
status: draft
updated: 2026-10-07
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8654 (owner-ratified, CLAUDE.md "An action's name is its method's name") made a template's
file name and a lazy-lookup locale key the action's name in kebab-case: the action `nextBundle`
renders `next-bundle.html.tse`. It changed the lookups. It did not check what WRITES those files.

The generators that emit a view or a locale entry per action are the other half:
`packages/trailties/src/generators` (the controller, scaffold and mailer generators and their
templates), ported from `railties/lib/rails/generators/erb/controller/controller_generator.rb`
and its siblings, which name each view file after the action as given on the command line
(`rails g controller posts recent_posts` writes `recent_posts.html.erb`).

Not verified which spelling trails' generators emit for a multi-word action today. If it is
anything but kebab-case, `trails g controller posts recentPosts` produces a view the framework
will not find.

## Expected shape

A generated view file for the action `recentPosts` is `recent-posts.html.tse`, the generated
controller method is `recentPosts`, and the generated route targets `posts#recentPosts`. A
generated locale scaffold, where one exists, keys by `recent-posts`.

## Acceptance criteria

- [ ] A generator test: `trails g controller posts recentPosts` writes `app/views/posts/recent-posts.html.tse`, a `recentPosts()` method, and a route to `posts#recentPosts`; the generated app renders that action.
- [ ] The same for the scaffold and mailer generators' multi-word names, or a note that they have none.
