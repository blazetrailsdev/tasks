---
title: "parity:test counts Rails' test/**/behaviors/ mixin cases in the denominator"
status: done
updated: 2026-08-13
rfc: "0103-parity-api-scoring-correctness"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6444
claim: "2026-08-12T23:36:53Z"
assignee: "test-compare-scans-rails-behavior-mixin-files"
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare/extract-ruby-tests.rb:1547-1549` collects the Ruby
denominator from three globs:

```ruby
test_files = Dir.glob(File.join(pkg_dir, "**", "*_test.rb")) +
             Dir.glob(File.join(pkg_dir, "**", "test_*.rb")) +
             Dir.glob(File.join(pkg_dir, "**", "spec_*.rb"))
```

Rails' shared test-behavior mixins do not match any of them: they live at
`activesupport/test/cache/behaviors/*.rb` (and the equivalent trees in other
gems), named `cache_store_compression_behavior.rb`,
`cache_store_coder_behavior.rb`, `cache_store_serializer_behavior.rb`, etc. The
extractor DOES already know how to handle a mixin module — `process_module`
(`:279-300`) stashes a module's `test` blocks and `flush_collected_modules`
(`:315-326`) materializes them at the including class's gate — but only when the
module is defined INSIDE a scanned `*_test.rb` file.

Consequence: a Rails behavior module's cases are absent from the denominator, so
porting them scores as "extra (TS only)" rather than crediting the Rails tests.
PR #6439 enrolled six cases of `CacheStoreCompressionBehavior` for two stores —
twelve green tests — and `parity:test --package activesupport` did not move off
2393/2758.

Blast radius is the reason this was not done inline: adding `**/behaviors/*.rb`
to the glob widens the denominator for every package at once (activerecord has
its own behavior trees), so the totals move on files nobody ported. That is a
measurement correction, but it needs to land deliberately and be read against
the resulting one-time drop, not smuggled into a feature PR.

## RFC fit

Filed under 0103 as the `parity:test` sibling of its two `parity:api` scoring
bugs: the same "the tool scores something other than what it reports" class. RFC
0092, which owned the test-compare extractor, is closed.

## Converged shape

The Ruby extractor also scans `**/behaviors/**/*.rb` (or the narrower
`**/behaviors/*_behavior.rb`), the modules they define flow through the existing
`process_module` / `flush_collected_modules` path, and the TS side maps
`packages/<pkg>/src/**/behaviors/<name>-behavior.ts` onto them so an enrolled
behavior helper credits its cases. `packages/activesupport/src/cache/behaviors/
cache-store-compression-behavior.ts` is the file to verify against — its six
`it` names match Rails verbatim today.

## Acceptance criteria

- [ ] `parity:test` counts the Rails behavior-module cases in the denominator.
- [ ] The six enrolled `CacheStoreCompressionBehavior` names credit against
      them rather than counting as TS-only extras.
- [ ] The one-time denominator movement is recorded in the PR body.
