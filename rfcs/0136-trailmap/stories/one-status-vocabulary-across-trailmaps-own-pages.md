---
title: "Settle which status trailmap's pages show — four of them now disagree"
status: draft
updated: 2026-09-07
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

RFC 0136's #7 established one status vocabulary in one place: the database
column, rendered by `shared/_status-badge` and `shared/_status-state`, with the
hue table living only in the stylesheet.

`gate-the-show-pages-against-ringo` (trailmap#17) found that `/rfc/<id>` was
labelling stories with the AUTHORED status while ranking them by the EFFECTIVE
one — a `ready` story under a non-active RFC is a `draft`
(`app/models/concerns/effective-status.ts`), which is what the ready queue
reads and what ringo's index stores. 259 rows advertised work the queue will
not offer. The show page now assembles `RfcStoryRow` with the effective status
and the gate compares it.

## What is wrong with it

That fixed one page and left trailmap saying two different things about one
story.

- `/rfc/<id>` shows the effective status (`app/controllers/rfc-pages-controller.ts`,
  `RfcStoryRow.status`).
- `/backlog` shows the authored one (`app/controllers/story-pages-controller.ts`,
  `BacklogRow.status` is `story.status`).
- `/rfcs` counts the authored one into each RFC's progress bar
  (`storyStatusCounts(own)`, `app/models/concerns/rfc-progress.ts`).
- `/story/<id>` shows the authored one in its state pill.

So a story authored `ready` under a draft RFC reads `draft` on its RFC's page,
`ready` in the backlog list and in the story page's own header, and lands in
the `ready` segment of the RFC bar. One database, one application, four
answers.

Each of those is individually a faithful port — ringo's RFC page reads its
index (effective) while its backlog reads the story rows (authored), and
`matchesBacklogFilter` deliberately keeps a `ready` story under a draft RFC on
the Ready tab as live work, which is ringo's rule and is documented as such in
`app/models/concerns/backlog.ts`. Faithfully porting an inconsistency is still
shipping an inconsistency, and trailmap exists to be the one home for this
domain rather than to inherit the seams of the three implementations it
replaces.

This is a triage question before it is a code change, which is why it is filed
as a draft rather than fixed in passing: the answer might be "effective
everywhere", or "authored everywhere with the override shown as a separate
marker", or "the two are genuinely different questions and each page says
which it is asking". What it should not be is four pages disagreeing by
accident.

## What to do

Decide the rule, then apply it in one place. `effectiveStoryStatus` already
exists and is already the queue's; whatever is decided, the badge a row wears
and the tab that would collect it must not be able to disagree — the same
argument `backlog.ts` already makes for the Icebox label.

Worth settling alongside `gate-the-list-pages-against-ringo`, which is
claimed and will pin `/rfcs` and `/backlog` against ringo's current answers;
a decision to diverge here has to be one that gate knows about rather than one
that turns it red later.

## Acceptance criteria

- One documented rule for which status a page shows, and why, written where
  the next reader of `_status-badge` will find it.
- Every page that shows a story status follows it, or states in the view why
  it deliberately does not.
- A test pins the case that surfaced this: a `ready` story under a non-active
  RFC, asserted across `/rfc/<id>`, `/backlog`, `/story/<id>` and the `/rfcs`
  bar.
- `pnpm gate:pages` and the list-page gate both still pass, or the divergence
  they now expect is stated in them.
