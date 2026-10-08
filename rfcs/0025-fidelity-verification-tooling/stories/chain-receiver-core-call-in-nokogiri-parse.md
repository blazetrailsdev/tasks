---
title: "Drop or block the chain-receiver core call in XmlMini_Nokogiri#parse"
status: closed
updated: 2026-10-08
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-08-18T13:06:46Z"
assignee: "converge-request-session-initialize-and-options-readers"
blocked-by: null
closed-reason: "FALSIFIED: no call-gate verdict can retire the `doc.errors.first` row in xml_mini/nokogiri.rb without also silencing ported-collaborator chains across activerecord; the row's reviewed reason (Ruby core Enumerable#first on a third-party parser document) is the accurate end state. Reopen only if the extractor gains a whole-corpus constant-provenance index."
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

_Moved from RFC 0108 on 2026-08-18. 0108 is closing: it delivered its four named
done-conditions (exclude tree 1,637 -> 1,266 rows) and is finishing only the
stories already in flight. This one had not started, so it returns to 0025, the
parent tooling backlog, where the remaining call-gate false-positive classes
live. It is unchanged otherwise — the finding and its citations stand._
