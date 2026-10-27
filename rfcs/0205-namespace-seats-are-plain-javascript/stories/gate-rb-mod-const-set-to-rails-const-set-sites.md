---
title: "Gate both rbModConstSet and module-eval namespace reads so the mechanism cannot spread again"
status: ready
updated: 2026-10-23
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps:
  - sweep-arel-seats-to-plain-assignment
  - sweep-activerecord-core-seats-to-plain-assignment
  - sweep-activerecord-adapter-and-association-seats
  - sweep-actionpack-seats-to-plain-assignment
  - sweep-actionview-seats-to-plain-assignment
  - sweep-activejob-seats-to-plain-assignment
  - sweep-actioncable-seats-to-plain-assignment
  - sweep-activemodel-and-activesupport-seats
  - sweep-msgpack-and-small-package-seats
  - sweep-ruby-compat-and-test-file-seats
deps-rfc: []
est-loc: 240
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

An added call is invisible to both call gates — CLAUDE.md § "Before you open
the PR" says so explicitly: they flag what Rails does and the port omits, never
the reverse. That blind spot is how this reached 790 sites from 15 in four
weeks with every ratchet green, so the docs correction in
`seat-rule-is-plain-assignment-in-claude-md` is a rule with nothing behind it.

Two populations need holding, and the second is the one that actually matters:

- **Seats.** `rbModConstSet` call sites, which after the conversions should be
  only the ~18 mirroring a Rails `const_set`.
- **Module-eval namespace reads.** The real escape hatch. A read at module-eval
  time is legitimate but rare (fewer than ten framework sites, plus ~35
  migration fixtures), and it is where the mechanism would quietly regrow,
  because "it's a cycle" is always available as a reason. This set is
  **enumerated and frozen**: the RFC's "What survives" list plus whatever each
  conversion's PR body added.

`pnpm parity:api:sends` is the precedent for the shape: a per-file count,
only-shrink, with no mark file, on trails#9129's reasoning that the base tree
IS the mark.

Lookup is gated too (repo-owner ruling, 2026-10-27: lookup goes, not only
definition). A deferred namespace read, a string-literal name passed to a
lookup helper, and a `registerConstant` call each regrow the mechanism with
every other ratchet green, so each is counted. None of them is a deviation to
receipt: a deferred read or a literal-name lookup is a plain ES import waiting
to be written.

## Acceptance criteria

- [ ] A gate counts `rbModConstSet` call sites per non-test file and fails on
      any file above its count at the merge-base with `origin/main`. No mark
      file to seed or tighten.
- [ ] The same per-file, merge-base, only-shrink count covers: deferred
      namespace property reads; calls to `rbModConstGet`, `rbConstGet`,
      `rbModConstDefined`, `rbModConstants`, `isRegisteredConstant`,
      `registeredConstant` and `rbPathToClass` whose name argument is a string
      literal; and calls to `registerConstant`, `registerModel`,
      `registerController`, `registerJob`, `registerChannel` and
      `registerConnection`, test files included.
- [ ] A seat is exempt when it carries a citation of the Rails `const_set` it
      mirrors, resolvable in `rails-api.json` — not free text, and not a new
      baseline register (CLAUDE.md § "A documented deviation is debt, not
      permission": this is the ordinary fidelity rule, so there is nothing to
      baseline).
- [ ] A second gate holds the frozen module-eval read set: a namespace property
      read reachable at module-eval time (top-level statement, `extends`
      clause, top-level `new`) in a file not on the list fails, and the failure
      names the file and tells the author to write a plain ES import. A type
      position does not count.
- [ ] The frozen list is a checked-in file with one line per site and its
      reason, seeded from the conversions' PR bodies, and is **only-shrink**:
      adding a line is a reviewed decision with a named load-order cause, never
      a mechanical step to turn a red run green.
- [ ] Both gates run in the `rails-comparison` CI job and are listed in
      CLAUDE.md § "Before you open the PR".
- [ ] Fixtures cover: a bare seat (red); a cited Rails `const_set` (green); a
      citation naming a Ruby site with no `const_set` (red); a deferred
      namespace read (red, with the ES-import message); a module-eval read on
      the list (green); the same read in an unlisted file (red); a
      `T extends Nodes.X` type position (green).
- [ ] The committed counts and the frozen list's size after the conversions are
      recorded in the PR body, so a later regression is legible as a number.
