---
title: "activemodel: parity:api and parity:api:extra disagree about ModelName vs Rails' Name"
status: ready
updated: 2026-09-01
rfc: "0134-activemodel-surfaced-deviations"
cluster: invented-arm
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' class is `ActiveModel::Name`
(`vendor/rails/activemodel/lib/active_model/naming.rb:9`); trails spells it
`ModelName` (`packages/activemodel/src/naming.ts:107`).

The two parity tools disagree about that rename, which is the actual finding:

- `pnpm parity:api --package activemodel` MATCHES the pair — `naming.rb` scores
  100%, so the extractor considers `ModelName` the counterpart of `Name`.
- `pnpm parity:api:extra --package activemodel` scores `ModelName` **novel**
  (`naming.ts — 1 novel, 1 moved`), i.e. a name with no Ruby counterpart.

Both cannot be right. Either the rename is sanctioned — in which case
`scripts/parity/conventions.ts` should produce it and the extra-surface scorer
should honour the same mapping — or it is not, in which case the class should
carry Rails' name and `parity:api`'s match is too loose.

Decide by reading the conventions source (`scripts/parity/conventions.ts`, from
which `docs/ruby-ts-conventions.md` is generated — change the rule there, never
the generated doc) and checking whether `Name` is unusable in TS at that
position (a collision with a global or an existing export would be the only
real reason).

## Non-goals

The **namespace-detection** half of naming.ts's divergence — `model_name`'s
`module_parents.detect { … use_relative_model_naming? }` walk
(naming.rb:271-276) — is owned by the sibling story
`model-name-use-relative-model-naming-detection`, carried into this RFC from 0023. That story already identifies both trails call sites
(`model.ts:1531-1537`, `serializers/json.ts:144-150`) and the PR #6572 history.
Do not re-derive it here.

Two further `ModelName` stories also live in 0023 and are NOT in scope:
`model-name-derives-from-segments-not-inflected-name` and
`model-name-initialize-invented-argument-errors`. They join this bucket with
the rest of the custody transfer (see the RFC's Rollout, Phase 0).

## Acceptance criteria

- One tool changes, not both left disagreeing: either `ModelName` is renamed
  to the conventions-table output, or the rename is encoded in
  `scripts/parity/conventions.ts` so `parity:api:extra` stops scoring it
  novel.
- If the name stays `ModelName` and the mapping cannot be encoded, the class
  carries a legal `@noRailsEquivalent` receipt instead — but a receipt is the
  fallback, not the first answer.
- `conventions.test.ts` stays green (grep `SCOPED_SKIP_GROUPS` before adding
  any global SKIP entry — an overlap reds that test with a bare
  `expected true to be false`).
- naming tests stay green.
