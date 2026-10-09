---
title: "A CSS class collision breaks a page with every gate green; nothing but a screenshot can see it"
status: draft
updated: 2026-10-09
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

## What

Nothing in `pnpm test`, `pnpm build` or CI can see a CSS class collision, so a
page can be visibly broken with every gate green.

In trailmap#47 the reviewer row's unassigned cell was given `class="pcell
empty"`. `.empty` was already taken — `app/assets/stylesheets/application.css`
has `.empty { padding: 32px 16px; text-align: center; ... }` for the list
pages' empty-state block — so every reviewer line inherited 32px of vertical
padding and was torn ~60px away from the worker's line it is supposed to sit
under. Measured in the browser: the cell was 82px tall where its content is
18px.

All seven checks were green on that commit. The markup was correct, the unit
tests asserted the right strings, and the page was wrong. A screenshot caught
it, which is exactly why this repo requires one in every PR.

## Why it matters

The screenshot rule depends on a person looking at the right part of the
picture. It caught this one; it will not catch the next collision in a row
nobody shot, and the failure mode is silent — a selector that already exists
simply wins.

## Shape expected

Smallest useful thing first, in the existing in-process page harness
(`scripts/gate-page-snapshot.ts` renders pages through
`ActionController.TestCase` with no browser):

1. A **class-collision guard**: collect every class name used in `app/views`
   and `app/assets/javascripts`, collect every selector in
   `application.css`, and fail when a multi-class element wears two classes
   that each carry their own `padding`/`display`/`position` rule. Cheap, no
   browser, catches this exact bug.
2. If that proves too blunt, the alternative is a real geometry assertion:
   render `/dashboard` with a fixed envelope, measure the `.panes` cells, and
   assert the reviewer line sits directly under the worker's.

Option 1 is the one to try first — a browser in CI is a cost this repo has so
far avoided, and the bug was a name collision, not a layout subtlety.

## Evidence

- `app/assets/stylesheets/application.css:398` — `.empty`, the list pages'
  empty-state block.
- `app/assets/stylesheets/application.css` — `.pcell.unassigned`, renamed in
  trailmap#47, with the collision named in a comment so the next reader does
  not re-use `.empty`.
- `test/assets/fleet-format.test.js` — asserts the markup does NOT say
  `pcell empty`, which is a test of the symptom and not of the class space.
