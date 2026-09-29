---
title: "generated-application-layout-is-not-a-port-of-the-rails-template"
status: claimed
updated: 2026-09-29
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: "2026-09-29T15:39:32Z"
assignee: "generated-application-layout-is-not-a-port-of-the-rails-template"
blocked-by: null
closed-reason: null
---

## Context

`trails new` writes `app/views/layouts/application.html.tse` from a
hand-written string (`packages/trailties/src/generators/app-generator.ts:1075-1090`):

```html
<title>${name}</title>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<%= stylesheetLinkTag("application") %> ... <%= yield %>
```

Rails' template is
`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/app/views/layouts/application.html.erb.tt`.
It emits `<title><%= content_for(:title) || "Blog" %></title>` (`:4`), the
`apple-mobile-web-app-capable` / `mobile-web-app-capable` metas (`:6-7`),
`csrf_meta_tags` (`:8`), `csp_meta_tag` (`:9`), `yield :head` (`:11`), the icon
links, and the stylesheet / javascript tags, with `<body>` wrapping `yield`.

Visible effect: the scaffold's views call `contentFor("title", "Posts")`
(ported from Rails' scaffold templates, #8219), but every page's title is the
literal app name, because the layout never reads `content_for(:title)`.

`port-action-view-csrf-helper-and-generated-layout-meta-tags` (0141) already
covers the `csrf_meta_tags` line and its helper. This story is the rest of the template.

Found re-running the root README quickstart (PR #8195) on `main` at `45a00eb2aa`.

## Acceptance criteria

- [ ] The generated layout is a line-for-line port of `application.html.erb.tt`,
      in TSE and trails helper spellings, keeping Rails' conditionals.
      `csrfMetaTags()` lands with its own story.
- [ ] `GET /posts` on a scaffolded app renders `<title>Posts</title>`.
