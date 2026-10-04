---
title: "activesupport: Cache.lookup_store passes **options through keywordSplat"
status: draft
updated: 2026-10-04
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails PR 8484 added `keywordSplat` to ruby-compat (`packages/ruby-compat/src/keyword-splat.ts`), the
argument list a `**keyword_hash` splat contributes to a call (`vendor/ruby/v3.3.11/vm_args.c:435`
`ignore_keyword_hash_p`): nothing for an empty hash, the hash otherwise.

`ActiveSupport::Cache.lookup_store` is `retrieve_store_class(store).new(*parameters, **options)`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/cache.rb:88-89`). trails open-codes the splat
as a ternary, which is an invented `if` arm on the pair:

- `packages/activesupport/src/cache.ts:20-23` —
  `...(Object.keys(options as object).length === 0 ? [] : [options])`

Converged shape: `new (retrieveStoreClass(store))(...parameters, ...keywordSplat(options))`.

Sweep for other open-coded spellings of the same rule while here
(`git grep -nE "length (===|>) 0 \? \[" -- packages`).
`migration/command-recorder.ts#invertDropTable`'s `if (Object.keys(options).length > 0)` is NOT one:
Rails writes that guard itself (`migration/command_recorder.rb:216`, `args << options unless options.empty?`).

## Acceptance criteria

- [ ] `lookupStore` passes its options through `keywordSplat`, with no ternary.
- [ ] Any other open-coded empty-keyword-splat found by the sweep is converged or listed in the PR body with its Rails line.
