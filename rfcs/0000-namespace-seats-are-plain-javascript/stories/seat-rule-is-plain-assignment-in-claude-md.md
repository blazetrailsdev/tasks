---
title: "The seat rule is a plain assignment: amend CLAUDE.md and the three package guides"
status: draft
updated: 2026-10-22
rfc: "0000-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 0
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Four ratified texts tell an agent to seat a class with
`rbModConstSet(Owner, "Name", Klass)`, and they are why the call grew from 15
sites to 790 in four weeks:

- root `CLAUDE.md` § "Call-time constant resolution": "each autoloaded constant
  is seated by its defining module with `rbModConstSet(Namespace, "Name",
Klass)` — the constant binding is what paths it, as Ruby's `const_set` does".
- `packages/arel/CLAUDE.md` § "Call-time constant resolution (arel)", whose
  last sentence is "This is the shape every package's plain
  `Owner.Name = klass` assignment and any remaining slot converge onto".
- the same section in `packages/activesupport/CLAUDE.md` and
  `packages/activerecord/CLAUDE.md`.

Rails calls `const_set` in 18 places in the vendored tree (the table in this
RFC's README lists every one). A trails call site is legitimate exactly when it
mirrors one of them; every other seat is a plain assignment, which is also
type-checked against the namespace object's declared property where the
three-argument helper is not.

This story is docs only and lands first, so no sweep is written against the old
rule. It is LOC-exempt.

## Acceptance criteria

- [ ] Root `CLAUDE.md` § "Call-time constant resolution" states the seat is
      `Owner.Name = Klass`, that a class's Ruby path is derived from the
      registered namespace objects on first read, and that `rbModConstSet` is
      written only where the Rails body calls `const_set` — with the 18-site
      table or a pointer to it.
- [ ] The "converge onto" sentence in `packages/arel/CLAUDE.md` is replaced by
      the plain-assignment rule, and the arel section no longer presents the
      helper as the settled seat spelling.
- [ ] `packages/activesupport/CLAUDE.md` and
      `packages/activerecord/CLAUDE.md` § "Call-time constant resolution"
      match.
- [ ] A grep for `rbModConstSet` across all `CLAUDE.md` files returns only the
      Rails-`const_set` rule.
- [ ] `docs/claude-md-decision-history.md` records the reversal, the measured
      counts (790 trails sites against 18 Rails sites; 39 namespace objects),
      and the repo-owner ruling of 2026-10-22.
