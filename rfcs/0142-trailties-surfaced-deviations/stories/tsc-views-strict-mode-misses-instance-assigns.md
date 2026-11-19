---
title: "trails-tsc-views types instance assigns as never once every render site resolves"
status: in-progress
updated: 2026-11-19
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: [trailties]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10337
claim: "2026-11-19T02:51:40Z"
assignee: "stimulus-controller-generator"
blocked-by: null
closed-reason: null
---

## Context

`build-views` emits `Scope`'s fallback as `any` while any `render` site in the
application is unresolved, and as `never` once all of them resolve
(`plugins/tse.js`, `localsKnown`). A template fed by controller fields has no
locals, so in the second case every field it reads is `never`. Resolving the
last site in trailmap (`action: "show"` in `StoryPagesController#renderPage`)
produced 136 errors across views that were not touched.

## Acceptance criteria

- A template reading an instance assign typechecks when every render site resolves.
- trailmap's non-literal `action` in `renderPage` is removed.
