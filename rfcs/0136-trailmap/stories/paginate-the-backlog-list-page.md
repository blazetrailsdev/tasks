---
title: "Bound /backlog's response — the done tab renders 6,597 rows and 8.8 MB"
status: draft
updated: 2026-09-07
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`/backlog?filter=done` renders every done story in one response. Measured
against the live database while building #15:

```text
/backlog                 200  791 rows   926 KB  2.1s
/backlog?filter=icebox   200 1222 rows   1.6 MB  1.9s
/backlog?filter=done     200 6597 rows   8.8 MB  2.2s
```text

This was accepted knowingly in #15 rather than missed: ringo ships the whole
story set to the browser as JSON on every load and renders the same 6,597
rows client-side, so the port is not a regression, and paginating changes what
the page shows — a decision that belongs in its own story rather than smuggled
into a port. That reasoning does not survive `retire-the-go-read-model`: once
trailmap is the only thing serving this page, 8.8 MB is simply what the page
costs, and it grows with every story that lands.

The done tab is the acute case but the shape is general — `Story.rankingIndex()`
loads all six tables for every request, which is right for the queue and
wasteful for a list showing 25 rows.

Worth deciding, not assuming: pagination changes what the page IS. The Open
tab at 791 rows is a scannable backlog; the done tab at 6,597 is an archive
and probably wants a page size and a search rather than a longer scroll.

## Acceptance criteria

- `/backlog` serves a bounded page of rows, with a way to reach the rest.
- The ready queue's pick order survives paging — `next up` and `#N` still mean
  position in the whole queue, not position on the page.
- Tab counts stay counts of the whole set, not of the page.
- The done tab responds in a fraction of its current size and time.
