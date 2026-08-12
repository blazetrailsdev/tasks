---
title: "extractor-argument-nesting-call-order"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6404
claim: "2026-08-12T09:46:00Z"
assignee: "extractor-argument-nesting-call-order"
blocked-by: null
closed-reason: null
---

## Context

Split out of `extractor-predicate-and-closure-order-artifacts` (RFC 0084): that
story fixed the predicate half of the order-flag artifacts in the comparator and
left the argument-nesting half, which is a matched change to BOTH extractors and
needs its own whole-artifact re-measure.

Both extractors record a body's call sequence in LEXICAL order — receiver, then
the call, then its arguments:

- `scripts/api-compare/extract-ruby-api.rb#walk_for_calls` (`:call` /
  `:command_call` walk the receiver, push the name, then walk `node.drop(4)`);
- `scripts/api-compare/extract-ts-api.ts#collectCalls` (property-access callee:
  visit the receiver, add the name, then `forEachChild` the arguments).

Each comment pins the two to the other ("the two orders must agree"), so they
are consistent — and both disagree with Ruby's EVALUATION order, in which an
argument runs before the call it is passed to. Rails
`collection_association.rb:121`:

    add_to_target(build_record(attributes, &block), replace: true)

records `add_to_target` before `build_record`. trails
`packages/activerecord/src/associations/collection-association.ts#build` hoists
the nested call into a local — which an `await` forces — and so calls
`buildRecord` first. `reorderedCalls` (compare.ts) reads that as an inversion
and it is baselined as
`associations/collection-association.ts | build | order:buildRecord,addToTarget`.

Recording evaluation order instead (arguments before the enclosing call, on both
sides) makes the comparison invariant to hoisting: the nested spelling and the
hoisted spelling produce the same sequence, which is the point. The class is
documented in one place at `compare.ts#reorderedCalls`; this story is the fix.

## Acceptance criteria

1. `walk_for_calls` (Ruby) and `collectCalls` (TS) emit a call's ARGUMENTS
   before the enclosing call name, keeping the receiver first; the paired
   "the two orders must agree" comments are updated together.
2. `extractSkeleton` / `walk_for_skeleton` and the call-ARGUMENT site streams
   (`walk_for_call_args` / `collectCallSites`) are considered explicitly —
   changed to match or left alone with the reason stated.
3. `API_COMPARE_FORCE=1 pnpm parity:api --calls` re-measured against `main`:
   report rows gone and rows ADDED. Rows added are the risk — a net shrink with
   no additions is the bar; if the change adds rows, state whether each is a
   real divergence before baselining any of it.
4. `associations/collection-association.ts | build | order:buildRecord,addToTarget`
   is deleted from `call-mismatches-exclude/` by hand (only-shrink), along with
   any other row the change retires.
5. No package source file is edited.
