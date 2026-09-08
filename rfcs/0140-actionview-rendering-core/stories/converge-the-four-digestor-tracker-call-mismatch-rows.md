---
title: "Converge the four call-set rows PR 7628 added to actionview's exclude tree"
status: draft
updated: 2026-09-08
rfc: "0140-actionview-rendering-core"
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

## Context

PR 7628 added four rows to
`scripts/api-compare/call-mismatches-exclude/actionview/`. Each is a real call
the Rails body makes and the TS body does not; each has a converged shape
already settled elsewhere in the repo.

- `digestor.ts` / `to_dep_map` / `any?` — `children.any?`
  (`vendor/rails/actionview/lib/action_view/digestor.rb:110`) is spelled
  `this.children.length > 0`.
- `dependency-tracker/wildcard-resolver.ts` / `resolve` / `empty?` —
  `wildcard_dependencies.empty?`
  (`vendor/rails/actionview/lib/action_view/dependency_tracker/wildcard_resolver.rb:15`)
  is spelled `this.wildcardDependencies.length === 0`.
- `dependency-tracker/tse-tracker.ts` / `add_static_dependency` / `new` —
  `StringScanner.new`
  (`vendor/rails/actionview/lib/action_view/dependency_tracker/erb_tracker.rb:120`)
  is inlined as an index walk over the string.
- `dependency-tracker/tse-tracker.ts` / `explicit_dependencies` / `flatten` —
  `source.scan(EXPLICIT_DEPENDENCY).flatten.uniq`
  (`erb_tracker.rb:152-153`); `String#matchAll` yields one match object per hit,
  so the TS body maps the capture with no flatten step.

## Converged shape

The first two converge onto `isEmpty` from
`packages/ruby-compat/src/ruby-empty.ts`, which exists for exactly this reason:
its header says the obvious `xs.length === 0` spelling "is a property read, so a
faithfully ported body emits no call at all and the call-set gate has nothing to
credit the Ruby `empty?` with". `resolve` becomes
`isEmpty(this.wildcardDependencies)`; `to_dep_map`'s `any?` is its negation,
`!isEmpty(this.children)`. Delete both rows.

The `StringScanner` row converges when
`activesupport-has-two-private-stringscanner-copies` lands the shared Ruby-core
scanner — that story already predicted "a third port would re-derive them
again", and `addStaticDependency` is the third. It needs `scan_until`,
`pre_match`, `matched`, `rest`, `eos?` and `terminate`; note `pre_match` is
whole-string-from-start, which is what produces Rails' own doubling behaviour on
a second interpolation, so the shared scanner must preserve it. Delete the row
when the call site imports the scanner.

The `flatten` row is the weakest of the four — the two spellings are genuinely
equivalent — so either converge it by spelling the scan as Ruby does or keep the
row with its current reason. Decide, do not leave it undecided.

## Acceptance criteria

- [ ] `isEmpty` replaces both length comparisons; the `any?` and `empty?` rows
      are deleted from the exclude tree.
- [ ] `pnpm parity:api:calls` green with a strictly smaller row count.
- [ ] The `StringScanner` row is either retired against the shared scanner or
      recorded as blocked on that story.
- [ ] `pnpm vitest run packages/actionview/src/template/digestor.test.ts` green.
