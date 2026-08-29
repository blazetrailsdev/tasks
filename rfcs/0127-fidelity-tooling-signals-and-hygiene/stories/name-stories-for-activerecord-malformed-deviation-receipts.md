---
title: "Give activerecord's 92 malformed deviation receipts a legal shape"
status: draft
updated: 2026-08-29
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Deviation receipts have exactly two legal shapes (CLAUDE.md, and
`receipt-gates-require-permanent-bare-or-convergeable-story` in this RFC):
`PERMANENT`, where the token is the whole receipt, and
`CONVERGEABLE <story-id>`, where the story IS the receipt. activerecord has
**92 receipts that satisfy neither**, spread over 72 files, and they are the
reason the repo-wide `no-freeform-comments` sweep of activerecord (PR #7195,
story `strip-freeform-comments-ar-remaining-dirs`) could not finish the job:
the autofix reduces a receipt to its machine input, and reducing one of these
yields a bare `CONVERGEABLE`, which `lint-missing-rails-call-reasons`'
`lintBareConvergeable` rejects. PR #7195 therefore taught the rule to leave
such a comment untouched (`renderTag`, `eslint/no-freeform-comments.mjs`), so
these 92 sites are the only activerecord comments still carrying freeform
English prose. They convert automatically the moment the receipt is well
formed.

Two sub-shapes, both malformed:

- **`CONVERGEABLE` with prose and no story id** — 92 sites. Examples with the
  Rails file the prose already cites:
  - `packages/activerecord/src/model-schema.ts:144` —
    `CONVERGEABLE the primary-key predicate Ruby builds through
    predicate_builder in _update_record`, Rails
    `activerecord/lib/active_record/persistence.rb:263`.
  - `packages/activerecord/src/model-schema.ts:346` — connection-free read of
    `ModelSchema#columns_hash`, Rails
    `activerecord/lib/active_record/model_schema.rb:427-441`; the prose says
    it "retires with RFC 0073", which is the story id it should be naming.
  - `packages/activerecord/src/store.ts:45` —
    `Store::ClassMethods#store_accessor`'s accessor lookup, Rails
    `activerecord/lib/active_record/store.rb:112`.
  - `packages/activerecord/src/migration/command-recorder.ts` — 18 sites, the
    heaviest single file.
- **`@noRailsEquivalent` with no permanence token at all** — 4 sites, which
  `classifyReason` scores `unclassified`:
  `packages/activerecord/src/errors.ts:688`,
  `packages/activerecord/src/model-schema.ts:586` and `:738`,
  `packages/activerecord/src/connection-adapters/abstract/connection-pool/queue.ts:25`.

Enumerate the full set with:

```sh
grep -rn 'CONVERGEABLE' --include=*.ts packages/activerecord/src \
  | grep -vE 'CONVERGEABLE [a-z0-9]+(-[a-z0-9]+){2,}'
grep -rn '@noRailsEquivalent' --include=*.ts packages/activerecord/src \
  | grep -v 'PERMANENT\|CONVERGEABLE'
```

Each receipt is a claim that the port diverges from Rails, so each one either
names the convergence story that retires it or is re-classified `PERMANENT`
because a TypeScript shortcoming earns it. Many of the 92 are already covered
by an existing story or RFC named in their own prose (RFC 0073 recurs); those
just need the id written down. The rest need a story filed — a convergence
story, per CLAUDE.md, existing to be converged toward Rails, not to ratify the
deviation.

## Acceptance criteria

- [ ] Every `@noRailsEquivalent` / `@missingRailsCall` / `@missingRailsArgs`
      receipt under `packages/activerecord/src/**` reads either `PERMANENT`
      alone or `CONVERGEABLE <story-id>` naming a story that exists in the
      tasks DB and is not done/closed. Both greps above return nothing.
- [ ] No receipt is made `PERMANENT` to avoid filing a story: `PERMANENT` is
      claimed only where a genuine TypeScript language shortcoming earns it,
      and the claim is checkable from the Rails source the prose cites.
- [ ] Convergence stories are filed for the receipts that need one, with the
      Rails `gem/path.rb:LINE` the deleted prose already carried.
- [ ] `pnpm eslint --fix` over `packages/activerecord/**` then reduces each of
      these comments to its receipt with no prose left, and the package still
      reports zero `blazetrails/no-freeform-comments` violations.
- [ ] `npx tsx scripts/api-compare/lint-missing-rails-call-reasons.ts` stays
      clean, and `parity:api:extra` / `parity:api:calls` deltas are
      non-negative.
