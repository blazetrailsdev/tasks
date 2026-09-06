---
title: "Serve ringo's root fleet dashboard from trailmap"
status: draft
updated: 2026-09-06
rfc: "0136-trailmap"
cluster: null
packages: ["actionpack", "actionview"]
deps: ["build-the-trailmap-app-shell"]
deps-rfc: []
est-loc: 300
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The rollout says "dashboard pages migrate one at a time", and the show pages
and list pages each have a story. The root page — ringo's `/`, the fleet
dashboard everyone actually watches — has none.

It is unlike every other page in this RFC, and the difference is the whole
story. `/rfcs`, `/backlog`, `/rfc/<id>` and `/story/<id>` are views over
`tasks.db`, so porting them moves data access into trailmap's models. The root
page reads **none** of `tasks.db`. `dashboard.ServeDashboard`
(`webhook/dashboard.go:2348`) prints a 2,442-line constant HTML string with one
`%s` — the repo `<option>` list built from `dc.RepoPaths` — and everything on
the page arrives afterwards over SSE: `const es = new EventSource('/events')`
at `dashboard.go:2154`, fed by `Tracker.ServeEvents` (`dashboard.go:2383`),
whose envelope carries PRs, tmux pane state, agent statuses, spawns, CI-fixer
info, main-CI failures and pull failures.

All of that is Go-owned process state — tmux sockets, the spawn loop, webhook
ingest — and this RFC's non-goals keep it there: "Porting `/webhooks/github` or
the SSE streams. They stay on Go."

So this story is **not** "move the dashboard's data to trailmap". It is
"trailmap serves the dashboard's HTML, still consuming ringo's `/events`". The
value is the same as the list-pages story — the page stops being a constant
string with a JS shell and becomes a controller, a view and helpers — plus one
thing the other pages do not get: it puts trailmap on the path of the page the
fleet stares at all day, which is the proving-ground pressure this RFC wants.

The status colour vocabulary and layout this needs already landed in
`build-the-trailmap-app-shell`; the `:root` custom properties at
`dashboard.go:20-34` are the same vocabulary and should not be re-declared.

Two things to decide while porting, both worth naming in the PR rather than
guessing:

- **Where the SSE connection points.** ringo's `/events` is on the Go process;
  trailmap is a separate origin behind the same SSO. Either the browser
  connects straight to ringo's `/events`, or trailmap proxies it. The first is
  simpler and keeps the stream Go-owned; the second gives one origin. Prefer
  the first unless SSO makes it impossible.
- **The initial paint.** Today the page renders empty and fills in on the first
  SSE frame. Server-rendering the first frame from a single read of ringo's
  state would be strictly better, but it needs a JSON read of the same envelope
  — which may itself be a follow-on story rather than part of this one.

Anything trailmap cannot render without a framework gap becomes its own story
against the surface that owns it, per the proving-ground discipline. Expect
this page to find some: it is the most JS-heavy thing in ringo.

ringo keeps serving `/` until the replacement is verified. Nothing is deleted
in this story.

## Acceptance criteria

- trailmap serves the fleet dashboard as a controller and a `.tse` view, not a
  constant HTML string.
- The page reuses the app shell's layout, nav and status colour vocabulary
  rather than re-declaring the `:root` custom properties.
- The repo `<option>` list comes from configuration, not from string
  interpolation into a template literal.
- Live data still comes from ringo's SSE envelope; no Go state moves into
  trailmap and `webhook/dashboard.go`'s stream is untouched.
- The page shows the same sections, ordering and states as ringo's `/` against
  the live fleet: PRs by repo, panes, agents, spawns, CI-fixer cards including
  the paused-on-red-main treatment, main-CI failures and pull failures.
- The SSE target is documented in the PR, with the reason for the choice.
- ringo's `/` still works.
