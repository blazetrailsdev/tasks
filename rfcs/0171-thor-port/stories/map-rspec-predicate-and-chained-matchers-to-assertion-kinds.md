---
title: "Map RSpec predicate and chained matchers onto assertion kinds for the Thor specs"
status: done
updated: 2026-10-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8541
claim: "2026-10-05T16:39:40Z"
assignee: "lazy-attribute-hash-ivar-types-admit-a-marshal-loaded-hash"
blocked-by: null
closed-reason: null
---

## Context

trails#8311 taught `scripts/test-compare/extract-ruby-tests.rb` (`rspec_expectation`) to name an
RSpec expectation chain by its matcher (`expect_to_eq`, `expect_not_to_raise_error`), and
`RSPEC_MAP` in `scripts/test-compare/assertion-kinds.ts` maps those onto canonical kinds. Three
families present in `vendor/thor/v1.3.2/spec` were left unmapped, so a port of a spec that uses
one reads as an assertion-kind mismatch against the hand-added `0/0/0` `thor` row in
`assertion-mismatch-mark.json`:

- **Predicate matchers** — `be_required`, `be_available`, `be_entered`, `be_string`,
  `be_boolean`, `be_numeric`, `be_identical` and their `not_to` forms (about 25 uses). RSpec's
  `be_<pred>` is `<pred>?` truthy, the same check minitest's `assert_predicate` makes, which
  `RAILS_MAP` already maps to `truthy` / `falsy`.
- **Chained matchers** — `expect(x).to receive(:y).and_return(z)` and
  `expect { }.to output(...).to_stdout`. The matcher is a `:call` node, which `rspec_expectation`
  does not unwrap, so about 133 chains are still recorded as a bare `expect`, while an unchained
  `receive` is recorded as `expect_to_receive`. Both are unmapped, but the two spellings of one
  matcher should be one token.
- **`be > 3` operator forms** — a `:binary` matcher, recorded as bare `expect`.

## Acceptance criteria

- [ ] `expect_to_be_<pred>` / `expect_not_to_be_<pred>` normalize to `truthy` / `falsy`, behind
      the explicit `RSPEC_MAP` entries (`be_empty`, `be_nil`, `be_a`, `be_kind_of`,
      `be_falsey`), so an explicit entry still wins.
- [ ] A chained matcher is named by the first call of the chain (`receive`, `output`), so
      `receive(:y).and_return(z)` and `receive(:y)` produce the same token.
- [ ] `receive` and `output` are either mapped to the kind their trails port asserts, or stay
      unmapped with the port idiom written down in the thor spec-port stories.
- [ ] `extract-ruby-assertions.test.ts` and `assertion-kinds.test.ts` cover each new arm.
- [ ] `pnpm parity:test:assertions` stays green with the `thor` row at `0/0/0`, and the Ruby
      manifest of every package other than thor is unchanged.
