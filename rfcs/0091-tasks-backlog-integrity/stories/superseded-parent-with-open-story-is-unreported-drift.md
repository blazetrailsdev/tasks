---
title: "A superseded RFC's open stories are silently unclaimable and never flagged"
status: ready
updated: 2026-08-07
rfc: "0091-tasks-backlog-integrity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A `superseded` RFC holding a non-terminal story is drift that nothing reports,
and it is how three live stories sat unclaimable for weeks (see the RFC's
Motivation for the full incident).

Two rules in `scripts/validate-lib.mjs` are each correct alone and leave a gap
between them:

1. `effectiveStoryStatus` (`validate-lib.mjs:56-57`) downgrades a `ready` story
   to `draft` whenever its parent RFC is not `active`:

   ```js
   if (storyStatus === "ready" && rfcStatus !== "active") return "draft";
   ```

   `superseded` is a non-`active` status, so the downgrade fires.

2. The drift check (`validate-lib.mjs:310-330`) only inspects `closed` parents:

   ```js
   for (const r of rfcs) {
     if (r.frontmatter?.status !== "closed") continue;
     const open = (storiesByRfc.get(r.dir) ?? []).filter((s) => !isTerminal(s.frontmatter?.status));
     ...
   }
   ```

So a story under a `superseded` parent is silently made unclaimable and never
flagged. `pnpm tasks new` has the same blind spot: `port-command-recorder-test-cases`
was filed into `0016-ar-test-compare-100` on 2026-07-30, six weeks after that
RFC was superseded on 2026-06-15, and the CLI accepted it without comment.

`scripts/auto-close.mjs:53` is deliberately not in scope — it skips non-`active`
RFCs by design (`auto-close.mjs:8-9`, "closing those is a human decision").

## Converged shape

One shared predicate for "this RFC asserts its work is over" — `closed` or
`superseded` — used in both places:

- the drift check errors on a non-terminal story under such a parent, with the
  existing message shape extended to name the parent's actual status (so
  `superseded` reads differently from `closed` in the output);
- `pnpm tasks new` refuses to file into such a parent, pointing at
  `superseded-by` when one is set.

`draft` and `postponed` parents must stay exempt in both: they legitimately
hold not-yet-schedulable work, and erroring there would fire on hundreds of
existing stories (`0023-surfaced-deviations` alone holds ~513).

## Acceptance criteria

- [ ] `pnpm tasks validate` errors on a non-terminal story whose parent RFC is
      `superseded`, in the same shape as the existing `closed` error, and the
      message names the parent status.
- [ ] `draft` and `postponed` parents produce no new errors — verified against
      the current backlog, which must stay green after the change.
- [ ] `pnpm tasks new <rfc> <slug>` refuses a `closed` or `superseded` parent
      and names `superseded-by` when the RFC has one.
- [ ] A test covers all four parent statuses (`closed`, `superseded`, `draft`,
      `postponed`) against a non-terminal child, asserting error / error /
      no-error / no-error.
- [ ] A regression test asserts the 2026-07-30 filing that started this — a new
      story into a `superseded` RFC — is now rejected. Verify it FAILS on the
      pre-fix code.
