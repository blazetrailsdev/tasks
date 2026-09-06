---
title: "Build the trailmap app shell: layout, nav and the status colour vocabulary"
status: in-progress
updated: 2026-09-06
rfc: "0136-trailmap"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 200
priority: 1
pr: 7
claim: "2026-09-06T11:50:16Z"
assignee: "build-the-trailmap-app-shell"
blocked-by: null
closed-reason: null
---

## Context

trailmap serves an API and no pages. Its whole UI today is
`app/views/layouts/application.html.tse` (a bare `<!DOCTYPE>`, a title, one
stylesheet link, `<%= yield %>`), `app/views/home/index.html.tse` (an `<h1>`
and a `<p>`), and a 7-line `app/assets/stylesheets/application.css`. There is
no nav, no colour vocabulary and no page chrome, so the first page story would
have to invent all three inside its own diff — two unrelated jobs under one
LOC ceiling.

ringo already has the vocabulary, and having it in one place is the point:
today it is pasted per handler. `webhook/story.go:439-446` defines
`.badge` plus `.badge.s-ready` / `s-in-progress` / `s-claimed` / `s-blocked` /
`s-done` / `s-active` / `s-closed` over `--green-bg`, `--yellow-bg`,
`--surface`, `--purple`, `--muted`, `--border`; `webhook/rfcs.go:649` repeats
the same block verbatim for the RFC pages. A status badge is rendered as
`<span class="badge s-{{.Story.Status}}">` (`story.go:656`), with an
`s-unknown` arm for a dep whose RFC is missing (`story.go:551,684`).

The status set the badges cover is the one the models already know: story
statuses (`draft`, `ready`, `claimed`, `in-progress`, `blocked`, `done`,
`closed`) and RFC statuses (`draft`, `active`, `closed`) — see
`app/models/concerns/effective-status.ts`.

This is app-shell work, not framework work: layout, partials, helpers and
CSS in trailmap. Where a view cannot be written the way Rails writes it —
a missing helper, a `.tse` gap, an asset-pipeline gap — that is a framework
gap and gets its own story against the RFC that owns the surface, per the
RFC's proving-ground discipline. Do not hand-roll around it silently.

## Acceptance criteria

- The application layout carries real chrome: a header linking the
  task-domain pages (`/rfcs`, `/backlog`), a content region, and a footer.
- One stylesheet defines the colour tokens and `.badge` / `.badge.s-<status>`
  rules once, matching ringo's rendering closely enough that a page ported
  next reads as the same product. No per-page copy of the block.
- A status-badge helper (or partial) renders a story or RFC status, with the
  unknown arm ringo's `s-unknown` covers, so the show and list page stories
  both call it rather than each writing the markup.
- Every status in `effective-status.ts` has a defined appearance.
- `/` renders through the new layout and is not left as the placeholder
  `<h1>trailmap</h1>`.
- Any framework gap hit while writing the views is filed as a story, with the
  reproduction, and cited at the workaround if one was needed to keep going.
