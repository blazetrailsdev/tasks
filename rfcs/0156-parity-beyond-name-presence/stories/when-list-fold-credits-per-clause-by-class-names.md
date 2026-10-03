---
title: "parity: when-list short-circuit fold credits per clause by class names, not by arity multiset"
status: draft
updated: 2026-10-03
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8429 added `when:N` marks: the Ruby extractor emits one after the `if` of a `when` listing N values (`scripts/api-compare/extract-ruby-api.rb#skeleton_when_list?`). The TS extractor emits one for an `||` chain of N type tests on one operand (`scripts/api-compare/extract-ts-api.ts#whenListChain`). `compare.ts#foldSkeletonTokens` credits a TS `when:N` against ANY unclaimed Ruby `when:N` in the pair, as a multiset claim.

So a credit can cross clauses. `activerecord/connection-adapters/abstract/quoting.ts#quote` ports `when String, Symbol, ActiveSupport::Multibyte::Chars` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:75`) as `typeof value === "string" || value instanceof Chars`, which is `when:2`. That mark is claimed by the unrelated `when Date, Time` (`quoting.rb:85`). The verdict happens to be right today, but only by coincidence.

## Acceptance criteria

- [ ] Each mark carries the class names, using the last constant segment. TS `typeof x === "string"` becomes `String`, and an import alias resolves to its imported name (`Attribute as ModelAttribute` becomes `Attribute`).
- [ ] A TS chain is credited only against a Ruby `when` whose class set matches. Normalise Ruby `Symbol` to `String`, and treat a `isRubyStringSubclass` class beside `String` as `String`.
- [ ] `pnpm parity:api:arms:report` shows no repo-wide short-circuit row added versus main, and `quote` keeps its `+or` for the `String, Symbol, Chars` arity mismatch only where the class sets differ.
- [ ] Unit tests in `scripts/api-compare/fold-skeleton-tokens.test.ts` cover the cross-clause case.
