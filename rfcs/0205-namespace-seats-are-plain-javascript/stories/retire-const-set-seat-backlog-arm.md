---
title: "Retire the const_set seat backlog arm: close the inverse stories and hold the class-to-string enrollment"
status: draft
updated: 2026-10-22
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: null
packages: []
deps:
  - seat-rule-is-plain-assignment-in-claude-md
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

The backlog still schedules the work this RFC reverses. Left alone, a sibling
agent claims one of these and re-seats a package the sweeps just cleared. This
story is tasks-repo prose and verbs only, LOC-exempt, and lands with the docs
amendment so the queue and the rule change together.

`0154-ruby-compat-surfaced-deviations` holds the direct inverse,
`namespace-seats-bind-through-rb-mod-const-set` (draft, est 500): "Every
namespace seat in activerecord, activesupport, actionview, actionpack and
trailties that binds a class or module is `rbModConstSet(Owner, "Name",
value)`". Its premise — that a plain assignment "binds the constant and leaves
the class unpathed" — is what the derivation falsifies.

Two neighbours are written against the recorded table and need re-pointing, not
closing: `seated-classes-answer-module-name-with-their-constant-path` and
`rb-path-to-class-reads-seated-path-whole-over-flat-constant-table`.

The fifteen `class-to-string-seat-enroll-<package>` stories are the same
registration-protocol mistake one layer down: `blazetrails/class-to-string-seat`
writes a `static toString()` string literal per class from a manifest, so each
class carries a hand-seeded copy of a path its owner already knows. activejob
and activesupport are enrolled; thirteen packages are not. Enrollment is
only-grow by its own rule, so this story does not un-enroll anything — it holds
the unenrolled thirteen pending a decision on whether `rbModToS` reading the
derivation makes the literal unnecessary.

Also check `0141-actionpack-surfaced-deviations`
(`seat-remaining-qualified-error-classes`,
`exception-constructors-drop-hand-set-name`,
`helpers-anonymous-and-default-helper-read-js-name`,
`action-dispatch-testing-autoload-block-seats-only-assertions`),
`0133-rack-session-gem-port`'s three `ruby class path` stories,
`0156`'s `seat-actioncontroller-exceptions-for-exception-inspect`, and
`0189`'s `register-model-alias-does-not-rename-a-defined-class`: several are
satisfied outright by the derivation.

## Acceptance criteria

- [ ] `namespace-seats-bind-through-rb-mod-const-set` is closed
      `FALSIFIED:` with a reason naming this RFC and the derivation.
- [ ] `seated-classes-answer-module-name-with-their-constant-path` and
      `rb-path-to-class-reads-seated-path-whole-over-flat-constant-table` are
      rewritten against the derivation, or closed if it satisfies them.
- [ ] Each `0141`, `0133`, `0156` and `0189` story listed above is read and
      either closed as satisfied, or has a line added pointing at the
      derivation so its claimant does not add a seat.
- [ ] The thirteen unenrolled `class-to-string-seat-enroll-<package>` stories
      are blocked on an explicit decision story, with the reason naming the
      duplication; the two enrolled packages are left as they are.
- [ ] No open story's acceptance criteria ask for a new `rbModConstSet` seat
      (`grep -rl 'rbModConstSet' rfcs/*/stories/` returns only this RFC's and
      closed stories).
- [ ] Every state change is a `tasks` verb, not a markdown edit of `status:`
      (CLAUDE.md § "Task state vs. task prose").
