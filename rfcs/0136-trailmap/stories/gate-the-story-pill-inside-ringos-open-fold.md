---
title: "The snapshot gate cannot see a story pill move inside ringo's Open fold"
status: draft
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## The blind spot

`pnpm gate:snapshot` replays ringo's recorded facts over 4,206 pages and reports
EQUIVALENT. For the STORY show page's status pill, that verdict is weaker than
it reads.

`scripts/page-extract.ts` compares in ringo's vocabulary, and ringo's story pill
folds four statuses onto one word (`storyStateLabel`):

```ts
export function storyStateLabel(status: string): string {
  switch (status) {
    case "done":
      return "Merged";
    case "closed":
      return "Closed";
    case "blocked":
      return "Blocked";
    default:
      return "Open";
  }
}
```

`ready`, `draft`, `claimed` and `in-progress` are all "Open". So a change that
moves a story page's pill between any two of those is invisible to the gate.

This is not hypothetical. trailmap#22 ("show one status everywhere — the
effective one") changed exactly what the story page displays, and
`pnpm gate:snapshot` stayed green across all 4,206 pages, because the authored
and effective statuses both fell inside the fold.

The fold is deliberate and correct for the RECORDING: ringo's page never
printed the raw status, so there was nothing finer to capture. The gap is that
the gate's green is read as "the show pages are verified" when the story page's
status is verified only to a quarter of its resolution.

## Why it is not simply "compare the raw status"

ringo's read model is gone after `land-the-ringo-read-model-deletion`, and the
fixture cannot be re-recorded — README, "The recorded show-page snapshot, and
when to re-record it". Whatever is compared has to come from what was already
captured, or from a source that is not ringo.

The RFC page's row badges ARE fine-grained: ringo prints the bare status into
`<span class="badge s-...">`, and `badgeStatuses` captures it, so
`storyStatuses` in the RFC fixture already holds the effective status for every
story. That is the source to use.

## Converged shape

Cross-check the story page against the RFC fixture rather than widening the
story fixture: for each story, the status its own page shows must be consistent
with the badge its parent RFC's row shows for it. `ready` on the row and
`Merged` on the page is a contradiction the current gate cannot see, and the
data to catch it is already committed in
`test/fixtures/ringo-show-pages.ndjson`.

Failing that, record trailmap's own raw pill alongside ringo's folded one and
assert only that the fold is consistent — weaker, but it pins the page against
drift in trailmap's own rendering.

## Acceptance criteria

- A story page whose pill changes between `ready`, `draft`, `claimed` and
  `in-progress` fails `pnpm gate:snapshot`, proven by a deliberate perturbation
  in `--self-test`.
- The check uses data already in the committed fixtures; the recording is not
  regenerated, since it cannot be.
- README's snapshot section states what the story pill is and is not verified
  against, so the green is not over-read again.
