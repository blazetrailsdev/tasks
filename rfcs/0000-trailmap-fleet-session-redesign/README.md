---
rfc: "0000-trailmap-fleet-session-redesign"
title: "trailmap: a session-focused Fleet page"
status: draft
created: 2026-11-10
updated: 2026-11-10
owner: "@deanmarano"
packages:
  - actionpack
  - actionview
  - activerecord
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
- **The transcript is already reachable, from a different page.** trailmap
  serves the session archive (`sessions/:owner/:repo/:pr`,
  `sessions/transcript`, `config/routes.ts:84-92`, shipped by
  `serve-session-transcripts-and-files` in trailmap#82), but nothing on the
  Fleet page links a row to it.

## Design

### Relation to RFC 0136

RFC 0136 moves the Fleet page's PR rows from browser rendering to server
rendering. `server-render-the-dashboards-pr-rows` turns `prRow` and its
`fleet-format.js` tests into a `.tse` partial driven by `pr_states`, and
`render-the-reviewer-line-on-the-dashboard` replaces the browser's reviewer
fetch with models. Both wait on `move-tracker-state-into-the-database`, which
is blocked on ringo's dual write.

This RFC does not wait for them, and it does not compete with them:

- Every new piece of row logic (`sessionStage`, the card, the stepper, the
  repo ordering) is a pure function in `fleet-format.js` with unit tests, the
  shape that 0136's story already plans to move. When
  `server-render-the-dashboards-pr-rows` lands, its specification is the
  session card's tests rather than `prRow`'s, and the stage function becomes
  a helper over `PrState`.
- The one new read, bundle stories, comes from trailmap's own tasks database,
  not ringo. It is fetched on the reviewer list's cadence and moves into the
  server render with the reviewer line. It is the only browser fetch this RFC
  adds, and it has a named place to go.
- Nothing here touches `pr_states`, ringo's envelope or the 0136 phase gates.
  `soak-trailmap-as-the-fleet-dashboard` soaks whatever the page is at the
  time.

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
`fleet-format.js`. Its inputs are the envelope's PR state (`PRState`,
`webhook/tracker.go:22`): `draft`, `merged`, `ciStatus`, `reviewCycles`,
`openFindings`, plus the reviewer list keyed `owner/repo#pr`. Rules are
checked top to bottom, and the first match wins:

| Stage                | Rule                                                                          |
| -------------------- | ----------------------------------------------------------------------------- |
| Merged               | `merged`                                                                      |
| Drafting             | a spawn with no PR                                                            |
| Self review          | a draft PR with no reviewer assigned and `reviewCycles` 0                     |
| Reviewer convergence | a draft PR with a reviewer assigned, or `openFindings` above 0                |
| Ready to merge       | not draft, `ciStatus` passing, `openFindings` 0                               |
| Getting CI green     | everything else: review done (or out of draft), `ciStatus` pending or failing |

The derived stage is a stopgap. A session that reviews its own work before
opening a PR shows as Drafting until the PR exists, and review state is
inferred from counters. The
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
the tasks database trailmap already opens (`config/database.ts:37-54`). A
`fleet/stories` read serves them, and the page fetches it on the reviewer
poll's cadence (`pollReviewers`, `app/assets/javascripts/dashboard.js:308`).
They are not added to ringo's envelope, which trailmap does not own. A session
with no PR has no stories until it opens one.

### Expanding a session

A card expands in place. On the left is the session log; on the right are the
RFC, branch, a diff bar against the LOC ceiling, reviewer or CI progress, and
an "Open pane" link. Reviewer progress is `reviewCycles` and `openFindings`
from the PR state, and CI progress is `ciStatus`; nothing is invented. The
first log is built from what trailmap sees: stage changes and PR events
(opened, reviewed, CI failed, merged) recorded as frames arrive.
`fleet-session-transcript-log` merges the session's transcript in from the
archive routes trailmap already serves. Under the log, a message box posts to
`fleet/pane/:id/send`.

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

- **Changing ringo's event envelope in this RFC:** trailmap relays it and does
  not own it. New data comes from trailmap's own sources. The one exception is
  a reported stage, and if open question 1 puts it in the envelope, that
  change is filed in ringo and `fleet-session-reported-stage` only reads it.
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
   `fleet-session-transcript-log`. Each stays `draft` until its open question
   (1 and 2) is decided; phases 1–5 do not wait on them.

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

<!-- Every question here must be resolved or explicitly deferred (to a named
     follow-up RFC/story) before this RFC moves to `status: active`. -->

1. **Who reports a session's stage.** The options are (a) ringo infers it
   from events it already handles (PR opened, reviewer spawned, CI result);
   (b) the agent runs a `tasks stage <id> <stage>` verb at each transition;
   (c) ringo reads a status line the agent prints in its pane.
   **Recommendation:** (a). Ringo already sees every transition except
   Drafting → Self review, and that one gap is acceptable. (b) and (c) change
   every agent's instructions to produce data ringo can already see.
   Deferred to `fleet-session-reported-stage`, which is `draft` until this is
   decided. Nothing else depends on it, because `sessionStage` is written to
   prefer a reported stage.
2. **Whether the archive holds a live session's transcript.** The routes exist
   (trailmap#82), but the archive may only be written when a session ends.
   **Recommendation:** check ringo's archive writer before
   `fleet-session-transcript-log` is promoted. If it is end-of-session only,
   that story shows the archived transcript for merged sessions and the
   event log for live ones, and files the live-write change against ringo.
3. **Merge from the list.** Today every PR row has a merge button
   (`prRow`, `fleet-format.js:928`). **Recommendation:** keep it, on Ready
   to merge cards only, beside the PR link. It is the one action taken from
   the list without reading the detail, and removing it would make merging
   slower than it is today. `fleet-session-list` is written this way.

## Changelog

- 2026-11-10: initial RFC
- 2026-11-10: self-review. Aligned with RFC 0136's server-render plan; the
  stage rules now use real `PRState` fields; the transcript uses the
  existing archive routes; the open questions have recommendations
