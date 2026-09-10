---
title: "Classify+resolve update→save/update delegation call-set flags"
status: done
updated: 2026-06-29
rfc: "0044-call-set-parity-fidelity-burndown"
cluster: equivalent-restructure
deps: ["call-mismatches-ratcheting-baseline"]
deps-rfc: []
est-loc: 150
priority: 2
pr: trails#4289
claim: "2026-06-29T19:38:40Z"
assignee: "update-delegates-to-save-cluster"
blocked-by: null
---

## Context

Eight flagged pairs in the "update delegates to save / update" family:
`base.ts` `update`→`save`, `base.ts` `update!`→`save!`,
`persistence.ts` `update_attribute!`→`save!`,
`relation.ts` `update_all`→`update`,
`internal-metadata.ts` `update_entry`→`update`,
`nested-attributes.ts` `accepts_nested_attributes_for`→`update`,
`secure-token.ts` `has_secure_token`→`update!`,
`connection-adapters/abstract-mysql-adapter.ts` `mismatched_foreign_key`→`update`.

Rails `persistence.rb` `update`/`update!` assign then `save`/`save!`. Several
of these are expected false positives: `accepts_nested_attributes_for` is a
class macro that defines a writer calling `update` indirectly;
`mismatched_foreign_key` builds an error message string; `update_all` is a
bulk SQL path, not record `update`. Each needs a quick read to classify.

## Acceptance criteria

- Classify each of the 8: real omission (TS genuinely skips the
  save/update behavior) vs equivalent restructure (call reached indirectly,
  macro-generated, or semantically unrelated same-named symbol).
- Real omissions converge to Rails with tests (match Rails test names).
- Equivalents get baseline entries with one-line justifications.
- All 8 entries resolved in `call-mismatches.json`. If fixes push the PR over
  the 500 LOC ceiling, ship the classified+baselined portion and register the
  remaining fix(es) as a new story under this RFC.
