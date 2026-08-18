---
title: "Drop or block the chain-receiver core call in XmlMini_Nokogiri#parse"
status: blocked
updated: 2026-08-18
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
blocked-by: "No verdict exists that is both principled and narrow enough. The site is `raise doc.errors.first` (activesupport/lib/active_support/xml_mini/nokogiri.rb:28): the receiver of `first` is the CHAIN `doc.errors`, whose root is an inert local. Three candidate verdicts, all rejected:\n\n(1) Chain-rooted (\"a core method name whose receiver chain roots at an inert local is weak\") — the story rules this out and it is right to: it silences `relation.where(...).first`, `record.association(...).count`, `scope.merge(...).size` across activerecord, i.e. exactly the ported-collaborator calls the wide gate exists to see. It would drop far more than one row.\n\n(2) File-scoped (chain-rooted, but only inside `xml_mini/*.rb`, where the objects are third-party parser documents — Nokogiri/LibXML/REXML). This is not a verdict, it is the existing baseline row rewritten as a hard-coded path in extract-ruby-api.rb, and it silences MORE than the row does (`element.texts.join`, `doc.to_s.inspect`, `text_children.join.empty?` in rexml.rb/jdom.rb all stop being recorded). Moving a deviation from one register to another is not convergence.\n\n(3) Provenance-based (\"the chain root is a local assigned from a constant no scanned Rails file defines, so it is a gem object\"). This is the only principled shape, but the extractor has no global Rails-constant index (it carries only the per-file `@file_collection_constants` pre-pass), so it needs a whole-corpus constant-definition pass plus intra-body assignment tracking — a large, high-blast-radius change to the extractor to retire one baseline row, and it still mis-fires the moment a ported object is assigned from a foreign factory.\n\nThe row in scripts/api-compare/call-mismatches-exclude/activesupport/xml-mini/nokogiri.json already carries an accurate reviewed reason (\"Ruby core Enumerable#first on the parsed document, not a ported trails method\"), and the port (packages/activesupport/src/xml-mini/nokogiri.ts:118) spells it `doc.errors[0].message`, which is the faithful TS for it. Unblock if RFC 0108 ever grows a global constant-provenance index for other reasons — verdict (3) becomes cheap then."
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

_Moved from RFC 0108 on 2026-08-18. 0108 is closing: it delivered its four named
done-conditions (exclude tree 1,637 -> 1,266 rows) and is finishing only the
stories already in flight. This one had not started, so it returns to 0025, the
parent tooling backlog, where the remaining call-gate false-positive classes
live. It is unchanged otherwise — the finding and its citations stand._
