---
title: "Smoke tier 2 requests no hub page and no pane page"
status: draft
updated: 2026-10-11
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/smoke-prod.sh` tier 2 (trailmap#55) requests eight read verbs and
seven pages. It does not request any page under the GitHub-shaped hierarchy
drawn last in `config/routes.ts` — `/:owner`, `/:owner/:repo`, and the tabs
`issues`, `pulls`, `projects`, `actions`, `wiki`, `pulse`, `settings` — nor
`/panes/:id`. Those need an input the suite had no way to discover: a known
owner and repository in the hub (Postgres) database, or a live tmux pane id.

These are the only pages served from the hub database, so tier 2 is currently
green with Postgres down. `docs/deploy.md` records that an unmigrated hub 500s
with `relation "repositories" does not exist` on `/dashboard` and every page
under `/:owner`; only `/dashboard` is in the tier today.

The show pages in the tier are recognised by `<span class="id">…</span>`
(`page` in `scripts/smoke-prod.sh`); the hub pages need their own marker.

## Acceptance criteria

- [ ] Tier 2 requests `/:owner`, `/:owner/:repo` and each of the seven tabs for
      an owner and repository it discovers (or that are named by environment
      variables with a documented default), one stable `tier2.page-*` name each
- [ ] Each asserts a shape — content type, layout, and a marker specific to the
      page — not merely a 200
- [ ] `/panes/:id` is requested for a pane id read from the fleet, or the story
      records why it stays out of the tier
- [ ] `--self-test` gains a canned response per new assertion and one
      regression that fails by name
- [ ] With the hub database stopped, tier 2 goes red naming a hub page
