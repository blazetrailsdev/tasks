---
title: "chain-receiver-core-call-in-nokogiri-parse"
status: ready
updated: 2026-08-18
rfc: "0108-call-gate-false-positives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`constant-and-module-eval-receivers-are-not-ported-methods` (this PR) converged
two of the three false positives it named, by teaching
`scripts/api-compare/extract-ruby-api.rb` that a collection-literal CONSTANT
receiver and `self` inside a `module_eval` block are inert.

The third does not fit either verdict and still carries a reviewed reason in
`scripts/api-compare/call-mismatches-exclude/activesupport/xml-mini/nokogiri.json`:

    parse / first — `raise doc.errors.first if doc.errors.length > 0`
    (activesupport/lib/active_support/xml_mini/nokogiri.rb:28)

The receiver of `first` is `doc.errors`, a method CHAIN, not a constant, a
literal, a local variable, or a core class — so `inert_receiver?`,
`core_class_receiver?` and `collection_constant_receiver?` are all false, and
`Enumerable#first` collides by name with the ported `Relation#first` /
`Querying.first`. The port spells it `doc.errors[0].message`
(packages/activesupport/src/xml-mini/nokogiri.ts:118).

A chain-rooted verdict ("core method name whose receiver chain roots at a
local") is deliberately NOT what this story asks for: it would silence real
calls like `relation.where(...).first` across activerecord.

## Acceptance criteria

- Either a verdict narrow enough to drop this site without silencing a genuine
  ported-collaborator call (with a unit test pinning both halves), or a
  `pnpm tasks block` with the specific reason why no such verdict exists.
- `pnpm parity:api:calls` / `pnpm parity:api:calls:args` stay green; no new
  baseline row.
