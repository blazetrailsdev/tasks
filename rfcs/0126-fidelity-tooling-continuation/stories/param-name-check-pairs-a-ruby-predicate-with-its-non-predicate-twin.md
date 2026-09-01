---
title: "param-name check pairs a Ruby predicate with its non-predicate twin"
status: in-progress
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 3
pr: 7352
claim: "2026-09-01T18:29:06Z"
assignee: "ts-methods-by-file-pools-deps-under-shared-relative-path"
blocked-by: null
closed-reason: null
---

## Context

RFC 0128's charter sends tooling false positives here ("Tooling defects in the
check itself — a false positive … are RFC 0126 stories"), and PR #7251 surfaced a
class the check has no answer for: a Ruby **predicate** whose normalised name is
already owned by a different Ruby method.

`docs/ruby-ts-conventions.md` drops a trailing `?`, so `foo?` and `foo` produce
the same TS name. When Ruby has both, the comparer scores the predicate's
signature against the TS declaration that ports the OTHER method, and reports its
parameter as a rename. Two live instances, both left in a mark by #7251:

1. `Rack::Headers` aliases `key?` to `has_key?(key)`
   (`vendor/rack/lib/rack/headers.rb:144-148`). `packages/rack/src/headers.ts:221`
   spells `key(value)` — the port of the inherited `Hash#key(value)`, which
   returns the key FOR a value and is not redefined in headers.rb. `has_key?`
   itself is ported as `hasKey` (`headers.ts:77`). Reported as
   `headers.rb#key? @0 ruby key → ts value`.
2. `Parameters#deep_merge?(other_hash)`
   (`vendor/rails/actionpack/lib/action_controller/metal/strong_parameters.rb:1027`,
   `:nodoc:`) is the DeepMergeable hook asking whether a value merges
   recursively. `strong-parameters.ts:294` spells `deepMerge(other)` — the port
   of `ActiveSupport::DeepMergeable#deep_merge(other, &block)`
   (`vendor/rails/activesupport/lib/active_support/deep_mergeable.rb:29`).
   Reported as `strong_parameters.rb#deep_merge? @0 ruby otherHash → ts other`.

Neither closes by renaming, and #7251 demonstrated the cost of trying: it briefly
spelled the parameter `otherHash`, which cleared the row by adopting the
identifier of a method the body does not implement, and had to be reverted in
review. The predicate is simply unported in both cases — `key?` is covered by
`hasKey`, and trails has no `deepMergeQ`.

## Converged shape

The comparer must not pair a Ruby `foo?` with a TS `foo` when a distinct Ruby
`foo` exists in the same host and already has that TS declaration — the
non-predicate owns the normalised name, and the predicate is either unported
(no row) or scored against its own declaration. `scripts/parity/conventions.ts`
already has `ruby-method-to-ts-key-predicate-candidate` (RFC 0126) adjacent to
this; check whether the two want one fix.

## Acceptance criteria

- `output/param-name-mismatches.json` contains neither the `headers.rb#key?` nor
  the `strong_parameters.rb#deep_merge?` row.
- No parameter renamed in `packages/**` to close either.
- The rack and actioncontroller marks in
  `scripts/api-compare/param-name-mark.json` are narrowed with
  `pnpm parity:api:params:tighten` (never rewritten upward).
- `pnpm parity:api` methods and arity figures unmoved; `pnpm parity:api:params`
  still OK.
