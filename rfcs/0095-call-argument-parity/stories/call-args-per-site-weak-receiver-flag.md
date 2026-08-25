---
title: "Mark weak receivers per call SITE, not per call name, in the call-argument population"
status: done
updated: 2026-08-10
rfc: "0095-call-argument-parity"
cluster: api-compare
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6334
claim: "2026-08-10T12:55:18Z"
assignee: "call-args-naming-dimension-disposition"
blocked-by: null
closed-reason: null
---

## Context

`checkCallArgs` (scripts/api-compare/compare.ts, PR #6318) filters the Ruby
call-argument population by weak call NAME, because that is all the data there
is: `dropWeakCalls` works off `MethodInfo.weakCalls`, a per-method set of NAMES
whose EVERY occurrence had an inert receiver (extract-ruby-api.rb#walk_for_calls,
`inert_receiver?` at extract-ruby-api.rb:2280-2288), while the call-argument
stream `walk_for_call_args` emits (extract-ruby-api.rb:2342) carries no per-site
weak marking at all.

For the call-SET gate the two are equivalent — a set has no per-site identity.
For the call-ARGUMENT dimension they are not: a name that is weak at one site
and a real ported-collaborator call at another loses BOTH. Measured on arel at
the time of #6318: filtering by name dropped 14 rows where only ~6 sites were
actually weak-receiver ones. `new` in `select_manager.rb#union` is the concrete
case — `Nodes::Union.new(o.ast, other.ast)` has a constant receiver and is a
genuine site, but `new` is marked weak for that method because it also appears
on a local receiver elsewhere in the body, so the real site is dropped too.

The converged shape is a per-site weak flag: have `walk_for_call_args` record
the same `inert_receiver?` verdict it already computes per occurrence in
`walk_for_calls`, as a site `flags` entry (`weak`), and have `checkCallArgs`
filter sites on that flag instead of on the method's weak name set. Both
extractors already carry a per-site `flags` array (scripts/parity/types.ts
`CallSite`), so no new field is needed on the wire.

## Acceptance criteria

1. `extract-ruby-api.rb#walk_for_call_args` marks a site `weak` when its
   receiver is inert, reusing `inert_receiver?` — no second implementation.
2. `checkCallArgs` filters on the per-site flag; the weak-NAME filter is
   removed, not kept as a second net.
3. `EXTRACTOR_OUTPUT_FIELDS` / cache token updated so stale ts-api cache
   entries missing the flag are evicted.
4. The arel population regains the genuine sites the name filter dropped
   (`select_manager.rb#union`'s `new` among them) and gains no weak-receiver
   ones; report the before/after counts in the PR body.
