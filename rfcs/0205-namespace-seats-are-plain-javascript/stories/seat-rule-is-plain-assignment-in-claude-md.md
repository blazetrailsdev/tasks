---
title: "Lean on ES imports: correct the call-time-constant-resolution rule in CLAUDE.md and the three package guides"
status: done
updated: 2026-10-23
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 0
priority: null
pr: trails#9270
claim: "2026-10-23T01:00:51Z"
assignee: "seat-rule-is-plain-assignment-in-claude-md"
blocked-by: null
closed-reason: null
---

## Context

Root `CLAUDE.md` § "Call-time constant resolution" rests on a claim that is
half wrong:

> ESM has no equivalent. Every `import` is eager and evaluated before the
> importing module's body, so naming a constant in a method body still costs a
> module-eval edge.

The edge is eager; the _read_ is not. An ESM import binding is live and is read
when the expression runs, so a binding named inside a method body is resolved
at call time — which is what Ruby's autoload bought Rails — and is safe even
when the two modules sit in a cycle. The TDZ failure the section describes
happens only for a read evaluated while the module body runs: an `extends`
clause, a top-level call, a top-level `new`.

Measured repo-wide: 631 namespace reads are inside a function or method body,
55 are at module-eval time, and of those 55, 8 are erased type positions and
~35 are `extends Migration.Current` in migration fixtures. Fewer than ten
genuine framework cases remain.

Three other texts carry the same rule and the seat spelling that follows from
it: `packages/arel/CLAUDE.md` § "Call-time constant resolution (arel)", whose
last sentence is "This is the shape every package's plain `Owner.Name = klass`
assignment and any remaining slot converge onto", and the same section in
`packages/activesupport/CLAUDE.md` and `packages/activerecord/CLAUDE.md`.

This story is docs only and lands first, so no conversion is written against
the old rule. It is LOC-exempt.

## Acceptance criteria

- [ ] Root `CLAUDE.md` § "Call-time constant resolution" states that a read
      inside a function or method body is a plain ES import, correct inside a
      cycle, and that the namespace read is for a module-eval-time read only —
      with the three shapes named (`extends` clause, top-level call, top-level
      `new`).
- [ ] The section states that `rbModConstSet` is written only where the Rails
      body calls `const_set`, with the 18-site table or a pointer to it, and
      that a surviving module-eval seat is a plain `Owner.Name = Klass`
      assignment.
- [ ] The section points at the Ruby-path table generated out of
      `rails-api.json` (story `derive-class-path-from-registered-namespaces`,
      whose id predates that design and is not a namespace walk) rather than
      describing the seat as what paths a class.
- [ ] The "converge onto" sentence in `packages/arel/CLAUDE.md` is replaced,
      and the arel section records that arel's cycle is real (65 of 92 modules)
      while 278 of its 287 reads are still deferred.
- [ ] `packages/activesupport/CLAUDE.md` and
      `packages/activerecord/CLAUDE.md` § "Call-time constant resolution"
      match, the latter keeping its `Base` module-eval exception explicitly.
- [ ] A grep for `rbModConstSet` across all `CLAUDE.md` files returns only the
      Rails-`const_set` rule.
- [ ] `docs/claude-md-decision-history.md` records the correction, the measured
      counts (790 seats, 631 deferred vs 55 module-eval reads, 18 Rails
      `const_set` sites), and the repo-owner ruling of 2026-10-22.
