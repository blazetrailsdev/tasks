---
title: "Operator defs (== and <=>) decline: no TS spelling in the conventions table"
status: closed
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

`reserved-defs-and-forwarding-params` closed two of the four DefNode census
markers (reserved JS names, `def x(...)` forwarding). The two that remain are a
third class: **operator defs**.

Both live in `active_record/core.rb` and surface as
`__PRISM_TODO("DefNode")` in `scripts/prism-codegen/__snapshots__/core.js.snap`:

- `def ==(comparison_object)` — `vendor/rails/activerecord/lib/active_record/core.rb:631`
- `def <=>(other_object)` — `core.rb:665`

`emitDef` / `defAsMember` decline them because `methodName()` produces no JS
identifier: `methodNameCandidates("==")` returns `[""]` and
`methodNameCandidates("<=>")` returns `["<>"]` — neither is a bindable name.
The gap is upstream of the codegen, in `scripts/api-compare/conventions.ts`
(`rubyMethodToTs`), which has no rule for operator method names.

Emitting them requires _deciding_ the TS spelling first — inventing one in the
codegen would put a name in generated ports that no convention table produces.

## Acceptance criteria

- `conventions.ts` gains a rule for Ruby operator method names (at minimum `==`
  and `<=>`), or they are added to `SKIP_GROUPS` with a reason if the decision
  is that they are deliberately not mirrored.
- If a spelling is decided: `emitDef` / `defAsMember` emit both defs, the two
  remaining `__PRISM_TODO("DefNode")` markers in `core.js.snap` disappear, and
  the DefNode census reaches zero.
- `docs/ruby-ts-conventions.md` regenerates to match.
- 0 parse errors invariant holds; a test covers each emitted operator.
