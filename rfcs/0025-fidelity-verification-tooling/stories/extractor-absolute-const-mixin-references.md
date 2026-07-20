---
title: "api-compare: honour leading :: as an absolute mixin/superclass reference"
status: done
updated: 2026-07-20
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 20
pr: 4965
claim: "2026-07-19T20:31:10Z"
assignee: "extractor-absolute-const-mixin-references"
blocked-by: null
closed-reason: null
---

## Context

PR #4959 taught the Ruby extractor's `resolve_aliases!` to resolve alias
targets through included modules and superclasses, resolving unqualified
mixin constants lexically (innermost enclosing scope outwards, top level
last) in `lookup_ancestor` — `scripts/api-compare/extract-ruby-api.rb`.

Ruby's rule is that a leading `::` forces an ABSOLUTE lookup, bypassing
lexical scope. The extractor cannot honour that today: `const_name`
normalizes `::Foo` to `Foo` before the name reaches `target[:includes]`, so
absoluteness is not observable at `lookup_ancestor` at all. Verified by
driving the extractor on `include ::Delegation`, which records
`["Delegation"]`. A branch for it was written during #4959, found to be
unreachable dead code, and removed; the limitation is documented at the
call site in `lookup_ancestor`.

Not urgent: `git grep -E "^[[:space:]]*(include|extend) ::" -- 'vendor/rails/*/lib/*'`
matches ZERO occurrences across all vendored gems, so nothing is misresolved
today. This is latent correctness for future vendored source.

The cost is why it was deferred rather than folded in: preserving `::`
changes emitted manifest values for every `include`/`extend` across all
packages, so it touches the extractor schema and any consumer that matches
on those strings (e.g. `flattenIncludedMethodInfos` in `compare.ts`).

## Acceptance criteria

- The extractor records whether a mixin/superclass constant reference was
  written absolutely (`::Foo`), without regressing existing consumers of
  `info[:includes]` / `info[:extends]`.
- `lookup_ancestor` resolves an absolute reference against the top level
  only, skipping lexical scopes; unqualified references keep today's
  lexical-first order.
- Unit coverage in `extract-ruby-api.test.ts` pins `include ::Foo` binding
  to top-level `Foo` when a nested `Foo` also exists (the case removed as
  dead code in #4959).
- `api:compare` arity totals unchanged (regression check, not a target).
