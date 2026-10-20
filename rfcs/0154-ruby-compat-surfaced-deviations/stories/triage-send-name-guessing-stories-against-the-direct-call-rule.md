---
title: "ruby-compat: triage the twelve stories that propose widening sendInternal's name guessing"
status: draft
updated: 2026-10-20
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Twelve ruby-compat stories propose widening `sendInternal`'s name guessing
(`packages/ruby-compat/src/object.ts`) so one more call site resolves: `camelized` for a
snake_case name, an `is…`-spelled predicate, a writer spelling, a Ruby operator name.

CLAUDE.md § "A dispatch by name is spelled directly (`send`, `public_send`)" (merged
trails#9143) rules the opposite way: "**Do not widen the send machinery's name guessing** to
make one new call site work. … each is a reason to spell that call site directly, not to teach
`sendInternal` another heuristic for every receiver in the repo."

The stories, by the criterion each states:

- Name guessing: `send-camelizer-does-not-collapse-underscore-runs`,
  `rb-f-send-predicate-name-misses-is-spelled-methods`,
  `rb-f-send-finds-a-predicate-under-either-spelling`,
  `thor-arguments-parse-name-rule-is-an-inline-regex`,
  `thor-encoded-instruction-sends-snake-case-name-verbatim`.
- Core-receiver dispatch: `rbfsend-does-not-dispatch-string-operators-by-ruby-name`,
  `rbfsend-does-not-dispatch-kernel-dup-or-clone`,
  `rb-f-send-dispatches-the-names-respond-to-binds-for-core-receivers`,
  `rb-f-send-string-receiver-reads-js-length-not-rb-str-length`,
  `core-method-tables-answer-respond-to-and-send-alike`,
  `ruby-compat-generic-include-for-thor-enum-check`, `rb-f-send-dispatches-operators-for-codegen`.

The two groups do not get the same answer, which is why this needs triage rather than a sweep.
A core-receiver story is often a genuine MRI-fidelity bug in `Kernel#send` itself — `value.send(:dup)`
always dispatches in Ruby (`rb_obj_dup`, `vendor/ruby/v3.3.11/object.c:591`) and must in trails —
and those stay. A name-guessing story is usually the forbidden shape: the call site that
prompted it should spell the member call instead, and `sendInternal` should not learn the
heuristic. `0194-ruby-compat-native-first` is already pointed the right way
(`native-respond-to-and-send-literal-name-sites`, `collapse-visibility-variants-of-send-and-respond-to`,
`ruby-compat-table-drops-kernel-send`) and several of these may fold into it.

Surfaced while sweeping the backlog for trails#9143.

## Converged shape

Each of the twelve is triaged into one of: an MRI-fidelity fix to `Kernel#send`'s own dispatch
(keep, with its MRI citation); a call-site convergence under the new rule (rewrite the criteria
to name the direct call, drop the `sendInternal` change); or a duplicate of an 0194 story
(closed as such). No story is left prescribing a new `sendInternal` heuristic.

## Acceptance criteria

- [ ] All twelve carry a triage verdict, each naming which of the three outcomes applies and why.
- [ ] Every story kept as an MRI-fidelity fix cites the MRI function and
      `vendor/ruby/v3.3.11/<file>:<line>` for the behaviour it restores.
- [ ] Every story rewritten to a call-site convergence names the trails `file:line` of the call
      site and the direct spelling.
- [ ] Markdown-only PRs in the tasks repo; no DB-owned field hand-edited.
