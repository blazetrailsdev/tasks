---
title: "Gate rbModConstSet to the Rails const_set sites so the seat protocol cannot come back"
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
est-loc: 180
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
the reverse. That blind spot is how this call reached 790 sites from 15 in four
weeks with every ratchet green, and the docs amendment in
`seat-rule-is-plain-assignment-in-claude-md` is a rule with nothing enforcing
it.

`pnpm parity:api:sends` is the precedent: a per-file count, only-shrink, with
no mark file, on trails#9129's reasoning that the base tree IS the mark. The
same shape fits here, and after the sweeps the counts are near zero, so the
gate starts at a floor worth holding.

## Acceptance criteria

- [ ] A gate counts `rbModConstSet` call sites per non-test file and fails on
      any file above its count at the merge-base with `origin/main`. No mark
      file to seed or tighten.
- [ ] A call site is exempt when it carries a citation of the Rails
      `const_set` it mirrors, resolvable in `rails-api.json` — not a free-text
      reason, and not a new baseline register (CLAUDE.md § "A documented
      deviation is debt, not permission": this is the ordinary fidelity rule,
      so there is nothing to baseline).
- [ ] The gate runs in the `rails-comparison` CI job and is listed in
      CLAUDE.md § "Before you open the PR" under the signature step.
- [ ] A test fixture covers: a bare seat (red), a cited Rails `const_set`
      (green), a citation naming a Ruby site with no `const_set` (red), and a
      plain `Owner.Name = Klass` assignment (green, uncounted).
- [ ] The committed counts after the sweeps are recorded in the story's PR
      body, so a later regression is legible as a number.
