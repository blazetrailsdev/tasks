---
title: "A generated app cannot render its own view: compiled .tse output is invisible to the resolver"
status: draft
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["actionview", "trailties"]
deps: []
deps-rfc: []
est-loc: 250
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A freshly generated app cannot render its own generated view. Reproduced on
trails `9f8a23690` with a full `tsc --build`, Node 24:

```sh
trails new trailmap
# add config/routes.ts -> mapper.root("home#index")
# add app/controllers/home-controller.ts with index()
# add app/views/home/index.html.tse
pnpm exec trails-tsc-views build --views app/views   # "built 2 views"
trails server
curl localhost:3000/
```

With an explicit `this.render({ template: "home/index" })` the response is a
500:

```text
MissingTemplate: Missing template home/index with format "*/*".
Searched in: FileSystemResolver
  at LookupContext.render (actionview/src/lookup-context.ts:582:13)
  at HomeController.renderAsync (actionpack/src/action-controller/base.ts:409:29)
```

Everything upstream is fine. `this.render({ plain: "..." })` returns 200 with a
body, so routing, controller resolution, dispatch and the response path all
work. The compiler works too — the build wrote every artifact:

```text
.trails/views-manifest.ts
.trails/views/home/index.html.tse.js
.trails/views/home/index.html.tse.d.ts
.trails/views/layouts/application.html.tse.js
```

and the source `app/views/home/index.html.tse` is on disk.

This is the AOT/runtime split this RFC's README already names: "there is an AOT
path (`trails-tsc-views build` -> `.trails/views/*.tse.js` + a lazy-thunk
manifest) and a runtime path (LookupContext + resolvers + handlers). Nothing at
runtime consumes the AOT manifest." That gap is now the single thing standing
between a generated app and a rendered page.

Note also the requested format is `*/*` rather than `html`, so whatever detail
negotiation should narrow the lookup is not running either.

## Acceptance criteria

- A generated app with a controller, a `.tse` view and a root route returns the
  rendered HTML, wrapped in `app/views/layouts/application.html.tse`.
- The runtime resolves templates through the AOT manifest that
  `trails-tsc-views build` writes, rather than ignoring it.
- The requested format is `html`, not `*/*`, for an ordinary HTML GET.
- A test boots a generated app end to end and asserts on rendered body content,
  so this cannot regress silently again.
