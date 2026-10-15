---
title: "trailmap: the class-collision guard reads rendered class lists, not only source literals"
status: done
updated: 2026-10-15
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trailmap#70
claim: "2026-10-15T18:45:11Z"
assignee: "trails-tsc-names-a-model-whose-table-no-schema-has"
blocked-by: null
closed-reason: null
---

## Context

`test/assets/class-collisions.test.ts` (trailmap#64) fails when an element
wears two classes that each lay out their own box. Its header says what green
does NOT mean, and each item there is a way the next `pcell empty` gets
through:

- only double-quoted `class="`, `cls: "` and `className = "` literals are
  read, each up to the quote that ends it, so `classList.add/toggle`,
  single-quoted and template-literal class lists and the run-time half of a
  concatenation (`'class="agent-chip' + (blocked ? " blocked" : "")`) are
  invisible;
- only bare `.name` rules count as box classes, so a compound or descendant
  rule (`.pcell.unassigned`, `.card .btn`) that sets `padding`, `display` or
  `position` is not seen.

The story that asked for the guard named the alternative: render the page
in-process and check the class lists the page actually produces
(`scripts/gate-page-snapshot.ts` already renders through
`ActionController.TestCase`), which closes the first group for server-rendered
markup. `scripts/dashboard-e2e.ts` now has the real DOM for the dashboard.

## Acceptance criteria

- [ ] Class lists are collected from rendered output for the `.tse` pages, not
      only from source literals.
- [ ] The dashboard's run-time class lists are checked from the DOM the e2e
      harness already has, or the story says why not.
- [ ] Compound selectors that set a box property are either covered or the
      header keeps naming them.
