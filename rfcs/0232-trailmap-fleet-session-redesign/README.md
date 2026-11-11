---
rfc: "0232-trailmap-fleet-session-redesign"
title: "trailmap: a session-focused dashboard"
status: draft
created: 2026-11-10
updated: 2026-11-11
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

# RFC 0232 — trailmap: a session-focused dashboard

## Summary

Rebuild trailmap's Fleet page (`/dashboard`) around agent sessions, following
the concept in trailmap#136 (`concepts/redesign/b-stepper-list.html`), and
rename it Dashboard. The page has no title; its top is the connection dots,
Broadcast and Spawn, and two panels, Usage and Loop. The PR list becomes a
list of sessions, grouped by repo and ordered by stage, each with a six-stage
stepper: Drafting, Self review, Reviewer convergence, Getting CI green, Ready
to merge, Merged. What used to live in panels lives in the rows: an agent's
question is answered in its session's row, the CI fixer is a marked session
row, and a session that has stalled short of its next stage offers one button
that messages its agent. At Reviewer convergence the stepper branches into a
loop showing the agent and the reviewer. A Needs you filter keeps only the
rows that want something from the operator. A session links its PR and every
story in its bundle, and expands to its controls, a session log and a message
box. A ⌘K palette searches sessions, stories and PRs. The palette gives each
stage its own saturated hue over warm neutrals.

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
- The RFC adds three reads, all served by trailmap from its own data and none
  by ringo:

  | Read                         | Caller                         | After 0136's server render                                 |
  | ---------------------------- | ------------------------------ | ---------------------------------------------------------- |
  | `GET fleet/stories?pr=…`     | the list, on the reviewer poll | moves into the render with the reviewer line               |
  | `GET fleet/stories?q=…`      | the ⌘K palette, per keystroke  | stays a fetch: the palette is interactive                  |
  | `GET fleet/transcript?pane=` | an expanded card, on expand    | stays a fetch: on demand, too large to render with the row |

- Nothing here touches `pr_states`, ringo's envelope or the 0136 phase gates.
  `soak-trailmap-as-the-fleet-dashboard` soaks whatever the page is at the
  time.

### Palette and type

Tokens on `:root` in `app/assets/stylesheets/application.css`, light theme.
The dark set is not designed yet (open question 4).

| Token                | Light     |
| -------------------- | --------- |
| background           | `#fbf8f3` |
| surface              | `#ffffff` |
| surface 2            | `#f3eee6` |
| line                 | `#e6ddd0` |
| ink                  | `#1c1512` |
| ink 2                | `#5c4f45` |
| ink 3 (muted)        | `#74665a` |
| action (button fill) | `#c7391f` |
| green (links, ok)    | `#166534` |
| yellow (attention)   | `#f2b705` |
| soil                 | `#2a1f1a` |
| Drafting             | `#64748b` |
| Self review          | `#c2710c` |
| Reviewer convergence | `#e0452a` |
| Getting CI green     | `#2563eb` |
| Ready to merge       | `#15963f` |
| Merged               | `#7c3aed` |

Text meets 4.5:1 on the background (ink 3 is 5.23:1, and 4.80:1 on surface
2), and white on the action fill is 5.21:1. The stage marks are UI that
carries meaning, so each meets 3:1 on the background (3.50–5.38:1), and white
icons on them meet 3:1 (3.71–5.70:1). Yellow is decorative only: text on it
is ink. Every pair was measured with the WCAG relative-luminance formula on
2026-11-11. The type is Fraunces for the brand, Inter for UI and JetBrains
Mono for code.

Stage never rests on color alone. Each stage has its own icon (pencil,
magnifier, converging arrows, CI loop, flag, merge), and a step's state is
its shape: a filled disc with a ring is current, a filled disc is done, and a
small dot is still to come, so the current stage is the loudest mark in the
row. The stepper carries `aria-label="Stage:
<name>"`.

### The top section

The page has no visible title; the nav tab reads Dashboard, and an `h1` is
kept for screen readers only. One header row holds the connection dots
(events, tmux, usage scraper, and one per agent kind with its live count) and
Broadcast and Spawn buttons. Below it, Usage and Loop sit side by side; Loop
takes the Pause control and says when spawning is paused. There is no Waiting
on you panel and no CI fixer panel: both move into the session list. The top
bar keeps a search field (a search button below 700px). Every control keeps
its current `data-action` and control request; only the markup and CSS
change. The broadcast and spawn forms stay where they are until
`fleet-palette-actions` moves them into the palette. ⌘K, which opens search,
is the page's only keyboard shortcut.

### A session and its stage

A session is a PR row or a spawn row from the existing envelope, keyed by its
pane. Its stage is computed by one pure function, `sessionStage`, in
`fleet-format.js`. Its inputs are the envelope's PR state (`PRState`,
`webhook/tracker.go:22`): `draft`, `merged`, `ciStatus`, `reviewCycles` and
`openFindings`, plus the reviewer list keyed `owner/repo#pr`. A spawn carries
its story id (`s.story`, read by `spawnRow`, `fleet-format.js:864`).

The rules are a decision list, checked top to bottom. The first match wins,
and the last row matches everything, so every input has exactly one stage:

| #   | Input                                                    | Stage                |
| --- | -------------------------------------------------------- | -------------------- |
| 1   | `merged`                                                 | Merged               |
| 2   | a spawn with no PR                                       | Drafting             |
| 3   | a PR with a reviewer assigned, or `openFindings` above 0 | Reviewer convergence |
| 4   | a draft PR, `reviewCycles` 0                             | Self review          |
| 5   | not draft, `ciStatus` passing                            | Ready to merge       |
| 6   | anything else                                            | Getting CI green     |

Row 6 covers a draft PR whose review has finished (`reviewCycles` above 0,
no reviewer, no open findings) and any PR whose CI is pending or failing
after review. Before review, CI is not the session's blocker, so a draft PR
with red CI and no review yet is Self review (row 4). An agent's reported
stage (`fleet-stage-signal`) refines row 2 only: a spawn whose story reports
`self` is Self review. A reported stage never overrides rows 1 and 3–6,
which rest on PR facts.

### The session list

Sessions are grouped by repo, in the order ringo reports repos, and ordered
by stage within a repo, Drafting first. One stage header sits above the
list, pinned while scrolling. It names the six stages with their icons, in
columns aligned with the card steppers, so the cards carry icons only.

Each repo is one surface, and its sessions are rows on it divided by a
hairline, each with a 3px edge in its stage's color. A row shows the PR link,
the lead story and the bundle's other stories as links, a one-line note (the
envelope's `lastAction`), and how long ago it changed (`lastTime`). Stage is
shown by the stepper and the edge, not repeated as a chip. The right column
shows one progress figure for the current stage above the age: LOC against
the ceiling while drafting and in self review, findings converged
(`openFindings` against the review's total) at Reviewer convergence, and
checks passed while getting CI green. Merge sits on Ready to merge rows, in
place of the figure. A failed check adds an "N check failed" flag beside the
PR link.

The top bar and the stage header are sticky, and the list scrolls under
them. Beside the stage header, two chips filter the list: All, and Needs you,
which keeps the rows with an open question, a failed check, a stall or a
merge waiting, and hides repos with none. `?filter=needs` opens the page
filtered. The CI fixer row is not in Needs you (open question 5).

A merged PR stays in the envelope only until its worker pane is torn down
(`teardownAt`, `cleanupPending`, `fleet-format.js:913`). While it is there,
it folds into one "Merged" line at the end of its repo's list, which shows
each PR link and lead story with its `lastTime`. Once ringo drops it, it is
gone from the page, as it is today.

### Questions in the row

An agent's AskUserQuestion, which the Waiting on you panel shows today
(`askCards`, `fleet-format.js:1082`), renders as a strip inside its session's
row instead, matched by pane. The strip carries a "Waiting on you" flag, the
question, a button per option and a free answer with Send, the same controls
and `answer-ask` requests `askCards` builds. A question whose pane matches no
session renders as a row of its own at the top of the list, so no question
is lost. Every string is escaped, as `askCards` does today: it is the one
part of the page a model wrote.

### The CI fixer as a session

The CI fixer is an agent session like any other, so it is a row in its
repo's list, with its stepper, log and message box, instead of a panel. It
is marked three ways: a tinted row, a solid "CI fixer" label beside a "main
is red" flag, and first place in its repo whatever its stage. Its note is the
fixer's phase and red checks (`fixerCards`, `fleet-format.js:272`). The row
is the envelope's fixer entry joined to its worker's spawn or PR row by
`story_id` or `pr`; a fixer with neither yet renders as a Drafting row with
no PR.

### Stalls

A session whose agent is idle short of its next stage is stalled. Idle is
the worker pane's status (`pane_status` not `working`, `waiting` or `error`;
`paneDot`, `fleet-format.js:64`), held for the stall threshold (open question
6). A stalled row carries a strip with "Stalled · idle 22m", the evidence
(conditions met, ticked; the unmet one plain) and one button that sends a
message to the agent through `fleet/pane/:id/send`. It never acts on the PR
itself. A session with an open question is never also stalled.

| Stage                | Idle and…                                     | Message                |
| -------------------- | --------------------------------------------- | ---------------------- |
| Self review          | no reviewer assigned                          | Request review?        |
| Reviewer convergence | `openFindings` 0                              | Move on to CI?         |
| Getting CI green     | `ciStatus` failing                            | Fix the failing check? |
| Getting CI green     | `ciStatus` passing, `openFindings` 0, `draft` | Mark it ready?         |

Today's "poke stalled agents" control (`/poke-stalled`, `fleet-format.js:523`)
stays as the bulk action; the strip is the per-session one, with a message
that names the next step.

### The review loop

At Reviewer convergence the stepper's line branches into a ring in place of
the stage icon. The agent sits on top and the reviewer below; the one whose
turn it is is filled, and an arc runs round the ring while either side is
working (it stops under `prefers-reduced-motion`). The round, `reviewCycles`,
is in the middle. A line above and below says what each side is doing: the
worker's `lastAction`, and the reviewer's pane status from the reviewer
entry (`pane_status`, `review_owed`). Whose turn it is follows from the two
pane statuses: the side that is working, else the reviewer while
`review_owed`, else the agent. The ring carries one `aria-label` with the
round and both lines.

### Bundle stories

A session's stories are every story whose `pr` is the session's PR, of any
status, so a merged session still lists its now-`done` stories. They are
read from the tasks database trailmap already opens
(`config/database.ts:37-54`).

- **Request:** `GET fleet/stories?pr=trails%239958&pr=…`, one `pr` per open or
  merged PR in the current envelope, at most 100 refs per request. The page
  fetches it on the reviewer poll's cadence (`pollReviewers`,
  `app/assets/javascripts/dashboard.js:308`).
- **Answer:** `{ "trails#9958": [{ id, title, status, rfc }] }`, with an empty
  list for a ref that matches nothing.
- **Lead story:** the one whose id is the PR's branch with the spawn suffix
  removed (loop workers branch as `<story-id>-<4 hex>`), else the first by
  id.
- **Late attribution:** a story's `pr` is set by `tasks in-progress` after
  the PR opens. Until a poll returns it, the card shows the PR title, and it
  changes on the next poll.

### Expanding a session

A card expands in place. The expanded card takes over the controls the
collapsed card carried through `fleet-session-card`: the worker and reviewer
pane lines, cleanup, and queued notifications (`queuedUnder`). It also shows
the RFC, branch, a diff bar against the LOC ceiling, review progress
(`reviewCycles`, `openFindings`), CI (`ciStatus`), and an Open pane link.
Nothing is shown that the envelope or the tasks database does not carry.

The first log is built from what trailmap sees: stage changes and PR events
(opened, reviewed, CI failed, merged), recorded as frames arrive. The
transcript stories add the session's own steps, read by
`GET fleet/transcript?pane=`, which looks up the PR's archives
(`SessionArchive.forPr`, `app/controllers/sessions-controller.ts:75-91`),
takes the newest worker archive, parses it with `parseTranscript`
(`lib/ringo-core.ts`, capped at `TRANSCRIPT_MAX_STEPS`) and returns steps as
JSON, `?before=<step>&limit=200` at a time. A spawn with no PR has no archive
and shows the event log only. A PR with older archives links them to
`sessions/:owner/:repo/:pr`. Under the log, a message box posts to
`fleet/pane/:id/send`.

### Search

⌘K, the header search field, and the search button below 700px open a
palette over the page. It searches the page's sessions and PRs in the
browser, and stories through `GET fleet/stories?q=`. Results are grouped by
kind, with scope chips by kind and repo. `fleet-palette-actions` then adds
message, spawn and broadcast actions, and moves the broadcast and spawn forms
into them.

### Mobile

Below 700px, panels and rows run full-bleed in one column. Usage and Loop
fold to a one-line summary each and open on tap; on a wide page the summary
is out of the tab order, and the panels follow the viewport across 700px.
The top bar keeps the logo and the search button. The stage header keeps only
the filter chips, so each row names its current stage and progress figure
under its stepper. Question and stall strips stack their controls. The
palette opens as a full-screen sheet.

## Non-goals

- **Changing ringo's event envelope:** trailmap relays it and does not own it.
  Every read this RFC adds is served from trailmap's own data, and the
  reported stage goes through the tasks database, not ringo.
- **Retiring ringo's own dashboard:** `/dashboard` still sits beside ringo's
  `/` until it is verified against the live fleet (`config/routes.ts:50-53`).
- **Redesigning the other trailmap pages:** they pick up the palette tokens and
  nothing else.
- **A live transcript before ringo writes one:** see open question 2.

## Alternatives considered

- **A kanban board with a column per stage:** concept A in trailmap#136. It
  loses the repo grouping and is unusable at phone width.
- **A dark rail-and-panel layout:** concept C, dropped from trailmap#136. It
  shows one session at a time, and the Fleet controls have no place in it.
- **Keeping Waiting on you and CI fixer as panels:** both are about one
  session, and a panel puts them a screen away from the session they concern.
- **Single-key shortcuts for Broadcast and Spawn:** rejected; ⌘K is the only
  shortcut, and both actions are palette rows.
- **Adding stage and stories to ringo's envelope:** it puts trailmap's view
  model into ringo and couples two deploys. Bundle stories are already in the
  tasks database.
- **Ringo infers the reported stage:** ringo cannot see the one transition
  the derived stage misses, Drafting to Self review, so it would only repeat
  what `sessionStage` already computes.

## Rollout

1. Shell: `fleet-palette-tokens`, `fleet-top-panels-grid`.
2. Sessions: `fleet-session-stage`, `fleet-session-card`,
   `fleet-session-grouping`, `fleet-session-bundle-stories`.
3. Detail: `fleet-session-detail`, `fleet-session-composer`,
   `fleet-session-transcript-archived`.
4. Search: `fleet-palette-search`, `fleet-palette-actions`.
5. In the rows: `fleet-session-question`, `fleet-ci-fixer-row`,
   `fleet-session-stall`, `fleet-session-review-loop`, `fleet-needs-you-filter`.
6. Mobile: `fleet-mobile-layout`.
7. Stage signal: `tasks-session-stage-verb`, `fleet-session-reported-stage`.
8. Live transcript: `fleet-session-transcript-live`, `draft` until open
   question 2 is decided.

Every control stays reachable at every step. `fleet-session-card` keeps the
row controls on the collapsed card, and `fleet-session-detail` moves them
into the expanded one.

## Verification

- Every open PR and live spawn in ringo's envelope renders as exactly one
  session card, under its repo, at the stage `sessionStage` gives it. A
  `fleet-format.test.js` case covers each of the six rules and the boundary
  inputs listed in `fleet-session-stage`.
- Every control on today's page (pause, loop caps, bundle, broadcast, spawn,
  drain, poke, reply, merge, cleanup, worker and reviewer panes, queued
  notifications) is reachable after each story merges. The dashboard e2e
  suite (`scripts/dashboard-e2e.sh`) asserts each one by selector.
- Every stage mark meets 3:1 and every text token 4.5:1 on its background,
  by a unit test over the token values.
- Every pending question renders in exactly one place: its session's row, or
  its own row when no session matches its pane. A fixture test covers both.
- Each stall rule fires on its fixture and not on its neighbours, and no row
  with an open question is stalled.
- At 390px wide the page has no horizontal scroll
  (`documentElement.scrollWidth === 390`) collapsed, with a card expanded and
  with the palette open, checked in the e2e suite.
- After `fleet-session-reported-stage`, a spawn whose story reports `self`
  renders Self review, and a merged PR whose story still reports `self`
  renders Merged. Both are fixture tests.

## Open questions

<!-- Every question here must be resolved or explicitly deferred (to a named
     follow-up RFC/story) before this RFC moves to `status: active`. -->

1. **How the agent reports Self review.** The derived stage misses one
   transition, Drafting to Self review, and only the agent knows it. The
   options are (a) a `tasks stage <id> self` verb writing a DB-owned `stage`
   field that trailmap reads with the story, or (b) a status line the agent
   prints in its pane and ringo parses. **Recommendation:** (a). It goes
   through the tasks database trailmap already reads, needs no ringo change,
   and costs one line in the worker prompt. `tasks-session-stage-verb` is
   written this way.
2. **Whether ringo archives a live session's transcript.** If the archive is
   written only when a session ends, a live transcript needs ringo to write
   it as the session runs. **Recommendation:** ship
   `fleet-session-transcript-archived` (merged sessions) now, and decide this
   before promoting `fleet-session-transcript-live`, which is `draft` until
   then.
3. **Merge from the list.** Today every PR row has a merge button
   (`prRow`, `fleet-format.js:928`). **Decided:** keep it, on Ready to merge
   cards only, beside the PR link. `fleet-session-card` is written that way.

4. **The dark theme.** The bolder palette replaced the earthy one, and its
   dark values are not designed. **Recommendation:** ship light first, with
   the old dark set removed, and design dark in a follow-up story before the
   RFC goes `active`.
5. **Whether a red main counts under Needs you.** The CI fixer row is left
   out: a red main is not waiting on an answer. **Recommendation:** keep it
   out; the row is already first and tinted.
6. **How long idle counts as stalled.** The envelope gives `pane_status`, not
   how long it has held. **Recommendation:** trailmap records the time each
   pane's status last changed as frames arrive (it already records stage
   changes for the log), and the threshold starts at 15 minutes, a constant
   to tune against the live fleet.

## Changelog

- 2026-11-10: initial RFC
- 2026-11-10: self-review. Aligned with RFC 0136's server-render plan; the
  stage rules now use real `PRState` fields; the transcript uses the
  existing archive routes; the open questions have recommendations
- 2026-11-10: review. Total stage decision list; controls stay on the card
  until the detail story moves them; "Merged" bounded by `teardownAt`; the
  three reads tabled; bundle request, lead and late-attribution rules; dark
  tokens and 3:1 stage marks; the list, palette and transcript stories split;
  reported stage through a tasks verb
- 2026-11-11: revised to the concept as it stands in trailmap#136. Renamed to
  Dashboard with no page title; bolder palette, light only; Waiting on you
  and CI fixer move into the session list; stalls with a message prod; the
  review loop; the Needs you filter and per-stage progress; rows on one
  surface per repo; Usage and Loop fold on mobile. Five new stories; open
  questions 4–6
