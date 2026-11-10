---
rfc: "0000-trailmap-fleet-session-redesign"
title: "trailmap: a session-focused Fleet page"
status: draft
created: 2026-11-10
updated: 2026-11-10
owner: "@deanmarano"
packages: []
clusters:
  - fleet-shell
  - fleet-sessions
  - fleet-session-detail
  - fleet-search
  - fleet-stage-signal
related-rfcs:
  - "0136-trailmap"
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. Never use a `draft-` prefix —
     `draft` is a lifecycle status, not a dir prefix (see top-level README). -->

# RFC — trailmap: a session-focused Fleet page

## Summary

Rebuild trailmap's Fleet page (`/dashboard`) around agent sessions, following
the concept in trailmap#136 (`concepts/redesign/b-stepper-list.html`). The
page keeps every Fleet control it has today, laid out on one two-column grid.
The PR list becomes a list of sessions, grouped by repo and ordered by stage.
Each session shows a six-stage stepper: Drafting, Self review, Reviewer
convergence, Getting CI green, Ready to merge, Merged. A session links its PR
and every story in its bundle, and it expands to a session log and a message
box. A ⌘K palette searches sessions, stories and PRs. The visual language is a
new natural palette: terracotta, forest green, mustard, soil brown and warm
neutrals.

## Motivation

The Fleet page today (trailmap `43d9979`) answers "which PRs are open" and
does not answer "where is each agent in its work".

- **The list is PR-shaped.** `repoSections`
  (`app/assets/javascripts/fleet-format.js:1393`) groups PR rows and spawn rows
  per repo, and `prRow` (`fleet-format.js:928`) renders one PR: title, CI
  icon, labels, `nextAction`, a merge button and the worker and reviewer pane
  lines. A spawn that has not opened a PR is a separate row shape
  (`spawnRow`, `fleet-format.js:864`). There is no notion of a session's stage,
  so reading where a session is takes the draft flag, the CI icon, the
  reviewer line and `nextAction` together.
- **A bundle's stories are invisible.** A PR row links the PR only. The stories
  it closes are in the tasks database, where `Story` carries `pr` as `repo#N`
  (`app/models/story.ts:61-63`), but the page never reads them.
- **Talking to a session takes a page change.** The send route exists
  (`fleet/pane/:id/send`, `config/routes.ts:76`), but only the pane page
  (`/panes/:id`) calls it.
- **The top of the page is a column of cards** in
  `app/views/dashboard/index.html.tse`, each a different width and height.

## Design

### Palette and type

Tokens on `:root` in `app/assets/stylesheets/application.css`, with a dark set:
terracotta `#c2603f`, forest `#2f5d46`, mustard `#d4a72c`, soil `#5a3e2b`,
clay `#b9a088`, cream `#faf5ec`, a sand surface `#f4ecde`, and ink
`#2b211a` / `#6b5a4c` / `#7a6756`. Each stage has one color: Drafting clay,
Self review mustard, Reviewer convergence terracotta, Getting CI green
`#8a6d3b`, Ready to merge `#5f8f62`, Merged forest. The type is Fraunces for
headings, Inter for UI and JetBrains Mono for code.

### The top section

One header row: the title, the connection pills (events, tmux, usage scraper,
one per agent kind with its live count), and Broadcast and Spawn buttons. Below
it, one two-column grid whose rows share a height: Waiting on you beside Usage,
CI fixer beside Loop (which takes the Pause control). The broadcast and spawn
forms move into the ⌘K palette. Every control keeps its current
`data-action` and control request; only the markup and CSS change.

### A session and its stage

A session is a PR row or a spawn row from the existing envelope, keyed by its
pane. Its stage is computed by one pure function, `sessionStage`, in
`fleet-format.js`:

| Stage                | Derived from the envelope                                            |
| -------------------- | -------------------------------------------------------------------- |
| Drafting             | a spawn with no PR                                                   |
| Self review          | a draft PR with no reviewer assigned and no review cycle             |
| Reviewer convergence | a draft PR with a reviewer assigned, or a review cycle under way     |
| Getting CI green     | a PR whose review is done and whose `ciStatus` is pending or failing |
| Ready to merge       | a PR out of draft with `ciStatus` passing                            |
| Merged               | `merged`                                                             |

The derived stage is a stopgap. Drafting and Self review cannot be told apart
for a session that opens its PR late, and review state is inferred. The
`fleet-stage-signal` cluster has the session report its own stage, and
`sessionStage` prefers a reported stage whenever one is present.

### The session list

Sessions are grouped by repo in the order ringo reports repos. Within a repo
they are ordered by stage, Drafting first, and merged sessions fold into one
"Merged today" line. One stage header sits above the list, pinned while
scrolling. It names the six stages with their icons in columns aligned with the
card steppers, so the cards carry icons only. A card shows the PR link, the
lead story and the bundle's other stories as links, a one-line note (the
existing `lastAction`), and how long ago it changed. Stage is shown by the
stepper and the card's colored edge, not repeated as a chip.

### Bundle stories

A session's stories are the open stories whose `pr` matches its PR, read from
the tasks database trailmap already opens (`config/database.ts:37-54`). They
are served with the reviewer list rather than added to ringo's envelope, which
trailmap does not own. A session with no PR has no stories until it opens one.

### Expanding a session

A card expands in place. On the left is the session log; on the right are the
RFC, branch, a diff bar against the LOC ceiling, reviewer or CI progress, and
an "Open pane" link. The first log is built from what trailmap sees: stage
changes and PR events (opened, reviewed, CI failed, merged) recorded as frames
arrive. A transcript of tool calls is a later story. Under the log, a message
box posts to `fleet/pane/:id/send`.

### Search

⌘K (and a search button on narrow screens) opens a palette over the page. It
searches sessions, stories and PRs together, filters by kind or repo, and
offers actions: message a session, spawn, broadcast. It reads data the page
already holds, plus a story lookup in the tasks database.

### Mobile

Below 700px, panels and cards run full-bleed, the panels stack in one column,
the stage header is hidden, and each card labels only its current stage under
the stepper. The palette opens as a full-screen sheet.

## Non-goals

- **Changing ringo's event envelope:** trailmap relays it and does not own it.
  New data comes from trailmap's own sources, except the stage report in
  `fleet-stage-signal`, which is negotiated there.
- **Retiring ringo's own dashboard:** `/dashboard` still sits beside ringo's
  `/` until it is verified against the live fleet (`config/routes.ts:50-53`).
- **Redesigning the other trailmap pages:** they pick up the palette tokens and
  nothing else.

## Alternatives considered

- **A kanban board with a column per stage:** concept A in trailmap#136. It
  loses the repo grouping and is unusable at phone width.
- **A dark rail-and-panel layout:** concept C in trailmap#136. It shows one
  session at a time, and the Fleet controls have no place in it.
- **Adding stage and stories to ringo's envelope:** it puts trailmap's view
  model into ringo and couples two deploys. Bundle stories are already in the
  tasks database.

## Rollout

1. Shell: `fleet-palette-tokens`, `fleet-top-panels-grid`.
2. Sessions: `fleet-session-stage`, `fleet-session-list`,
   `fleet-session-bundle-stories`.
3. Detail: `fleet-session-detail`, `fleet-session-composer`.
4. Search: `fleet-command-palette`.
5. Mobile: `fleet-mobile-layout`.
6. Stage signal and transcript: `fleet-session-reported-stage`,
   `fleet-session-transcript-log`.

## Verification

- Every open PR and live spawn in ringo's envelope renders as exactly one
  session card, under its repo, at the stage `sessionStage` gives it. A
  `fleet-format.test.js` case covers each of the six stages and each
  ambiguous input.
- Every control on today's page (pause, loop caps, bundle, broadcast, spawn,
  drain, poke, reply, merge, cleanup) is reachable on the new page. The
  dashboard e2e suite passes unchanged, apart from selector updates.
- At 390px wide the page has no horizontal scroll
  (`documentElement.scrollWidth === 390`), checked in the e2e suite.
- After `fleet-session-reported-stage`, a session's reported and derived
  stages agree, or the reported one wins, on every session in a day's
  envelope sample.

## Open questions

1. **Where a session reports its stage.** Ringo could infer it from what it
   already watches, or the agent could report it, for example a
   `tasks stage <id> <stage>` verb or a status line ringo reads from the pane.
   The second is exact but touches every agent's instructions. Owner decision
   before `fleet-session-reported-stage` is ready.
2. **What the transcript source is.** The session's Claude Code transcript is
   on the host ringo runs on. Should ringo serve it, and how much of it (tool
   calls only, or messages too)? Owner decision before
   `fleet-session-transcript-log`.
3. **Merge from the list.** Today each PR row has a merge button. The concept
   moves merge into the expanded card. Keep a list-level merge for Ready
   sessions?
