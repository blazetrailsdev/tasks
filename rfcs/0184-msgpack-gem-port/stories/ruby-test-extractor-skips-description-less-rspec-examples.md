---
title: "test-compare: the Ruby extractor drops description-less RSpec examples (it { is_expected })"
status: done
updated: 2026-10-15
rfc: "0184-msgpack-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8922
claim: "2026-10-14T23:49:36Z"
assignee: "activesupport-message-pack-constants-seated-on-their-namespace"
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare/extract-ruby-tests.rb` records an `it` only when it carries a description string. RSpec's one-liner `it { is_expected.to eq ... }` has none, so the case is absent from `rails-tests.json`: `vendor/msgpack/v1.8.0/spec/packer_spec.rb:440-490` has four such contexts (`when it has no ext type but a super class has`, `... an included module has`, `... it was extended by a module which has one`, and the inherited-value one at `:451`) and the manifest holds no row between `:440` and `:496`. A trails port of any of them is counted as extra instead of matched (found on trails#8798, where the `packer_spec.rb:473-490` port could not credit).

RSpec names such an example from its matcher (`is expected to eq "..."`).

## Acceptance criteria

- The Ruby extractor records a description-less `it { ... }` / `it do ... end` under its enclosing `context`, with the description RSpec generates or a documented stand-in the TS side can spell.
- `pnpm parity:test --package msgpack` total rises by the number of one-liner examples in `spec/`; no other package's matched count drops.
- A fixture test in `scripts/test-compare/rspec-context.test.ts` covers a one-liner under a `context`.
