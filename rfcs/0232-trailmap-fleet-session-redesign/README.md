---
rfc: "0232-trailmap-fleet-session-redesign"
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

# RFC 0232 — trailmap: a session-focused Fleet page

## Summary

Rebuild trailmap's Fleet page (`/dashboard`) around agent sessions, following
the concept in trailmap#136 (`concepts/redesign/b-stepper-list.html`). The
page keeps every Fleet control it has today, laid out on one two-column grid.
The PR list becomes a list of sessions, grouped by repo and ordered by stage.
Each session shows a six-stage stepper: Drafting, Self review, Reviewer
convergence, Getting CI green, Ready to merge, Merged. A session links its PR
and every story in its bundle, and it expands to its controls, a session log
and a message box. A ⌘K palette searches sessions, stories and PRs. The visual language is a
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

Tokens on `:root` in `app/assets/stylesheets/application.css`.

| Token                | Light     | Dark      |
| -------------------- | --------- | --------- |
| background           | `#faf5ec` | `#1d1510` |
| surface              | `#fffdf8` | `#271c15` |
| surface 2 (sand)     | `#f4ecde` | `#31241b` |
| line                 | `#e4d6c1` | `#45342a` |
| ink                  | `#2b211a` | `#f3e9da` |
| ink 2                | `#6b5a4c` | `#c7b39c` |
| ink 3 (muted)        | `#7a6756` | `#a08a75` |
| terracotta (action)  | `#c2603f` | `#de7a56` |
| forest               | `#2f5d46` | `#6fa57f` |
| mustard (attention)  | `#d4a72c` | `#e6bd4a` |
| soil                 | `#5a3e2b` | `#5a3e2b` |
| Drafting mark        | `#8f7660` | `#b9a088` |
| Self review mark     | `#a37b10` | `#e6bd4a` |
| Reviewer convergence | `#c2603f` | `#de7a56` |
| Getting CI green     | `#8a6d3b` | `#c99a5b` |
| Ready to merge       | `#5f8f62` | `#93c07f` |
| Merged               | `#2f5d46` | `#6fa57f` |

Text meets 4.5:1 on the background (ink 3 is 4.96:1 light, 5.47:1 dark). The
stage marks are UI that carries meaning, so each meets 3:1 against the
background and the surface. That is why the Drafting and Self review marks
are darker than clay `#b9a088` (2.29:1) and mustard (2.07:1), which stay as
decorative tones. Every pair was measured with the WCAG relative-luminance
formula on 2026-11-10. The type is Fraunces for headings, Inter for UI and
JetBrains Mono for code.

Stage never rests on color alone. Each stage has its own icon (pencil,
magnifier, converging arrows, CI loop, flag, merge), and a step's state is
its shape: a filled disc with a ring is current, a filled disc is done, and a
dashed outline is still to come. The stepper carries `aria-label="Stage:
<name>"`.

### The top section

One header row holds the title, the connection pills (events, tmux, usage
scraper, and one per agent kind with its live count), a search field (a
search button below 700px), and Broadcast and Spawn buttons. Below it is one
two-column grid whose rows share a height: Waiting on you beside Usage, and
CI fixer beside Loop, which takes the Pause control. Every control keeps its
current `data-action` and control request; only the markup and CSS change.
The broadcast and spawn forms stay where they are until
`fleet-palette-actions` moves them into the palette.

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

A card shows the PR link, the lead story and the bundle's other stories as
links, a one-line note (the envelope's `lastAction`), and how long ago it
changed (`lastTime`). Stage is shown by the stepper and the card's colored
edge, not repeated as a chip. Merge sits on Ready to merge cards, beside the
PR link.

A merged PR stays in the envelope only until its worker pane is torn down
(`teardownAt`, `cleanupPending`, `fleet-format.js:913`). While it is there,
it folds into one "Merged" line at the end of its repo's list, which shows
each PR link and lead story with its `lastTime`. Once ringo drops it, it is
gone from the page, as it is today.

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

Below 700px, panels and cards run full-bleed and the panels stack in one
column. The top bar keeps the logo and the search button, and the stage
header is hidden, so each card names its current stage under the stepper. The
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
- **A dark rail-and-panel layout:** concept C in trailmap#136. It shows one
  session at a time, and the Fleet controls have no place in it.
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
5. Mobile: `fleet-mobile-layout`.
6. Stage signal: `tasks-session-stage-verb`, `fleet-session-reported-stage`.
7. Live transcript: `fleet-session-transcript-live`, `draft` until open
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
- Every stage mark meets 3:1 and every text token 4.5:1 on its background, in
  both themes, by a unit test over the token values.
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
