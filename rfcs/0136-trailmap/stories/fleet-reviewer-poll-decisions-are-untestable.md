---
title: "The fleet page's reviewer-poll decisions live in dashboard.js, where no test can reach them"
status: draft
updated: 2026-10-09
rfc: "0136-trailmap"
cluster: null
packages: []
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

## What

`pollReviewers` in `app/assets/javascripts/dashboard.js` now carries real
decisions, and none of them are covered by `pnpm test`:

- the unanswered state — `reviewers` is `null` until a poll succeeds, and only
  an answered-but-empty map may render the "nobody is reviewing this" dash;
- the one-request-at-a-time guard (`reviewersInFlight`) and the client-side
  `AbortSignal.timeout(REVIEWERS_POLL_MS)`;
- `reviewersPollFailed`, which warns once per transition rather than per poll.

That file's own header says what it is for: "Everything that decides what the
page SAYS lives in `./fleet-format.js`, where it is tested. What is left here
is the part that cannot be." These three are decisions, not wiring, so they are
on the wrong side of that line.

## Why it matters

They were verified by hand, with a throwaway Playwright script, against the
live fleet — which is not a thing the next person to touch `pollReviewers`
inherits. PR trailmap#47's review found the unanswered-state bug by reading the
code, not by a failing test, and the test that would have caught it still does
not exist.

## Shape expected

Move the decisions into `fleet-format.js` as pure functions and leave the fetch
in `dashboard.js`. Roughly:

- `reviewersPollOutcome(response-ish)` → `{ reviewers, warn }`, deciding from a
  status, a body and the previous `reviewersPollOk` what the new state and the
  one-shot warning are. It is the same shape as `controlOutcome`, which already
  exists in that module for exactly this reason and is tested there.
- The in-flight guard and the abort signal stay in `dashboard.js`; what moves
  is the decision, not the plumbing.

Then assert in `test/assets/fleet-format.test.js`: a 503 leaves the state
unknown and warns once; a second failure does not warn again; a recovery
re-arms the warning; a non-array body is refused by type; an empty list is the
only thing that produces the dash.

## Evidence

- `app/assets/javascripts/dashboard.js` — `pollReviewers`, the
  `reviewersInFlight` guard and `reviewersPollFailed`.
- `app/assets/javascripts/fleet-format.js` — `controlOutcome` is the pattern to
  copy.
- Hand-verification that stands in for the missing tests today, from
  trailmap#47: every poll failing →
  `{"rows":9,"reviewerCells":0,"workerCells":7}` with one warning;
  hung relay over 95s → `started=3 aborted=2`.
