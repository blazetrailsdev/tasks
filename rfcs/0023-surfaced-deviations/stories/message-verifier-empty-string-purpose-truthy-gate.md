---
title: "activesupport: MessageVerifier purpose gate uses JS truthiness — empty-string purpose treated as absent"
status: draft
updated: 2026-07-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while widening purpose to `string | null` (PR #5136). Trails
MessageVerifier (packages/activesupport/src/message-verifier.ts:80,123) gates
purpose metadata with JS truthiness: `if (options.purpose)` on generate and
`if (options.purpose && payload._purpose !== options.purpose)` on verify. An
empty-string purpose ("") is falsy in JS but truthy in Ruby: Rails
Messages::Metadata embeds and checks a "" purpose
(vendor/rails/activesupport/lib/active_support/messages/metadata.rb — wrap/
verify compare `purpose.to_s`), so a token generated with purpose "" must not
verify against purpose "login" and vice versa. Trails treats "" like an absent
purpose on both sides, skipping the embed and the check. Classic
Ruby-truthiness-vs-JS divergence (see memory ruby-vs-js-truthiness). null
purpose is fine on both sides (nil is falsy in Ruby too).

## Acceptance criteria

- generate/verified gate purpose on key-present/non-nullish (`!= null`), not
  truthiness, so "" is embedded and checked like any other purpose string.
- Regression test failing on baseline: token generated with purpose ""
  does not verify with purpose "login" (and a "" verify requires a "" token).
