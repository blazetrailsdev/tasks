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

## Verdicts (0154 refine, 2026-10-22)

The nine of the twelve that live in RFC 0154 are triaged below, plus
`rb-f-send-no-method-error-names-ts-spelling`, which turns on the same
machinery. The other three
(`thor-arguments-parse-name-rule-is-an-inline-regex`,
`thor-encoded-instruction-sends-snake-case-name-verbatim`,
`rb-f-send-dispatches-operators-for-codegen`) live in other RFCs and are left
to their own refines.

Name guessing:

- `send-camelizer-does-not-collapse-underscore-runs` — closed `FALSIFIED`: the
  forbidden widening, and no Rails-derived name reaches it.
- `rb-f-send-predicate-name-misses-is-spelled-methods` — rewritten as a
  call-site convergence: `numericality.ts:89-91` dispatches `NUMBER_CHECKS`
  through a module-private registry, and `sendInternal`'s `isOdd` / `isEven`
  arm (`object.ts:1224-1229`) is deleted.
- `rb-f-send-finds-a-predicate-under-either-spelling` — closed as a duplicate
  of the previous one.

Call-site convergence (the motivating name is a literal):

- `rbfsend-does-not-dispatch-string-operators-by-ruby-name` — rewritten:
  `inject-into-file.ts:69-70` calls ruby-compat's `String#+` port directly.
- `ruby-compat-generic-include-for-thor-enum-check` — rewritten: one direct
  `include?` port called at `arguments.ts:213-218`; no `sendInternal` change.

MRI-fidelity fixes to `Kernel#send` / `respond_to?` (kept, each now depends on
0194 `delete-send-name-guessing-arms`, which decides which core-receiver arms
survive as the computed-name floor):

- `rbfsend-does-not-dispatch-kernel-dup-or-clone` — `Kernel#dup` /
  `Kernel#clone` answer for every object (`rb_obj_dup`,
  `vendor/ruby/v3.3.11/object.c:591`). Kept with no 0194 dependency: this is
  method lookup reaching `Kernel`, not name guessing.
- `rb-f-send-dispatches-the-names-respond-to-binds-for-core-receivers` and
  `core-method-tables-answer-respond-to-and-send-alike` — `respond_to?` and
  `send` must agree (`basic_obj_respond_to`, `vm_method.c:2864`;
  `rb_f_send`, `vm_eval.c:1330`).
- `rb-f-send-string-receiver-reads-js-length-not-rb-str-length` — its
  motivating site (`thor/shell/wrapped-printer.ts:13`) already calls `strlen`
  directly; what remains is a computed-name String send reaching the JS
  `length` before `rb_str_length` (`string.c:2211`).
- `rb-f-send-no-method-error-names-ts-spelling` — the message names the TS
  spelling where MRI names the Ruby method (`rb_builtin_class_name`,
  `error.c:1216`).
