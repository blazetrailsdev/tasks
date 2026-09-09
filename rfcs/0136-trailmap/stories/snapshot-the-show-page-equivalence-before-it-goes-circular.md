---
title: "Snapshot the show-page equivalence before the gate goes circular"
status: in-progress
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 1
pr: 21
claim: "2026-09-09T14:31:34Z"
assignee: "snapshot-the-show-page-equivalence-before-it-goes-circular"
blocked-by: null
closed-reason: null
---

## Context

`gate-the-show-pages-against-ringo` (trailmap#17) shipped `pnpm gate:pages`
(`scripts/page-equivalence.ts`): it asks ringo and trailmap for `/rfc/<id>`
and `/story/<id>` for every id in the database and compares the extracted
title, status, ordered story list with each row's status, done count and
ordered dep lists. It found four port defects and is green over the whole
database — 8,809 pages, value for value.

It is not a CI job, and cannot be: ringo serves from a checkout and a database
that exist only on the box.

## What is wrong with it

The gate has a quieter failure mode than "cannot run", and that is the reason
to file this now.

`land-the-ringo-read-model-deletion` moves ringo's `loadIndex` off `tasks.db`
and onto trailmap's own API (`webhook/tasksapi.go`, `GET /index`, defaulting
to `http://127.0.0.1:8080`). The moment that lands, ringo's `HandleRFCPage`
and `HandleStoryPage` render from data trailmap produced. The gate keeps
running and keeps reporting EQUIVALENT — while comparing trailmap against
itself. It goes circular, not red.

That is worse than losing the gate outright: a green check that proves nothing
is indistinguishable from a green check that proves something, and this one
would keep being cited as the evidence that the show pages were verified. The
window in which it is an independent check is open only until that story
lands.

Every one of the four defects it found (story-list order on every RFC, ranking
the authored status instead of the effective one, 259 rows labelled `ready`
that the queue will not offer, deps returned alphabetically) was invisible to
the hand-verification that preceded it. Nothing else would have caught them,
and after the deletion nothing would catch a fifth.

## What to do

Capture ringo's answers as a committed golden snapshot while ringo still has
its own read model, and replay it in CI:

- A `--record` mode on `scripts/page-equivalence.ts` that writes ringo's
  extracted facts (not its HTML — the markup is deliberately different and is
  not what is compared) for every id to a committed fixture.
- A CI job that ingests the content tree into a database the way the existing
  `gate` job already does, boots trailmap against it, and replays the fixture.
- The fixture is regenerated only deliberately, and a diff to it is reviewed
  as a change to what the pages say — the same standing `pnpm gate` has.

Two things the snapshot must carry, because they are the parts a naive capture
loses:

- The ids ringo hides. ringo's story show page is served through `allStories`
  (`webhook/spawnloop.go:1384`), the BACKLOG's query, which drops every story
  under a closed RFC — 4,573 of them today. trailmap serves those pages, which
  is a divergence trailmap chose. The gate counts them rather than failing;
  the fixture has to record that they were exempt, not that they matched.
- The effective status on each row. ringo's index stores it
  (`webhook/tasksdb.go:263`); it is the field that caught the 259 mislabelled
  rows, and it is only obtainable from ringo.

## Acceptance criteria

- The recorded fixture reproduces today's result: every RFC and story
  compared, the closed-RFC exemption counted separately, no differences.
- The replay runs in CI on every PR, with no ringo, against the database rows
  the recording was made from — captured in the same pass as the facts and
  committed beside them.

  **This criterion originally said "against a database built from the content
  tree", and that does not work.** Measured rather than assumed, while
  implementing it: a tree ingested at the recording's own commit reproduced all
  8,806 story pages and got 47 RFC-page facts wrong. Two causes, both
  structural rather than incidental:
  - `status`, `assignee` and `pr` are database-owned. They reach git only when
    `tasks export` runs, so a tree ingested at any commit carries whatever
    state the last export left, not the state ringo answered from.
  - A first ingest closes an RFC whose stories are all done, while the
    incremental ingests that built the live database never did. Four RFCs
    differ in status on that alone.

  The recording is of ringo's answers over the database as it stood, and that
  database does not stand still — a story moved `claimed` to `in-progress`
  between the first recording and the first replay. Replaying against anything
  but those rows diffs the database's movement rather than trailmap's
  rendering, which is the opposite of what this gate is for. Pinning the rows
  keeps what the four defects were actually about: how trailmap ORDERS, RANKS
  and LABELS a fixed set of rows.

- Re-recording is a deliberate, reviewable step, and the README says when it is
  legitimate to do it.
- It is recorded BEFORE `land-the-ringo-read-model-deletion`, and that story
  notes the ordering.
