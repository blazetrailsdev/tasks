---
title: "Converge remaining association tests to canonical (one-schema)"
status: draft
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

> **SUPERSEDED (RFC 0048 re-spec, 2026-06-30).** Folded into `redo-associations-faithful-port`.
> Do not work this story — it overlapped a parent cluster story and used the
> shallow-rename framing. Kept as draft for history.

## Context

Follow-up to `converge-associations-one-schema` (RFC 0048). PR #4312 converged
only the first of that story's four files
(`packages/activerecord/src/associations/inner-join-association.test.ts`).
The remaining three still declare bespoke tables/columns the canonical
`TEST_SCHEMA` and Rails `schema.rb` lack, so they remain on
`eslint/one-schema-exclude.json` (which lives on the spike branch #4246).

Remaining files:

- `packages/activerecord/src/associations/eager-singularization.test.ts` (~279 LOC).
  Special case: deliberately irregular-plural tables (viri/octopi/messes/crises/…)
  that have NO canonical analog — they exist to exercise singularization edge
  cases. Rails' `eager_singularization_test.rb` creates them dynamically in
  setup/teardown. Convergence here means replacing `defineSchema` (which trips the
  one-schema guard) with direct `createTable` calls (which do not), keeping the
  irregular table names. The currently-renamed join table `es_crises_messes` can
  revert to Rails' `crises_messes` once it rides createTable.
- `packages/activerecord/src/associations/has-and-belongs-to-many-associations.test.ts` (~1190 LOC).
  Bespoke `projects`/`developers` declarations + others; large, expect multiple PRs.
- `packages/activerecord/src/associations/has-one-through-associations.test.ts` (~1639 LOC).
  Many bespoke prefixed tables (adt*\*, mv*\_, pk\_\_, ds*\*, cpk*\*); largest file,
  expect several PRs.

Pattern established by #4312: drop the local bespoke `const TEST_SCHEMA` /
`defineSchema`, ride canonical tables already laid on the worker DB, add any
NOT-NULL canonical columns (e.g. `posts.body`) to creates, and rewrite
bespoke-table sub-tests onto the real Rails tables/associations (e.g.
`posts -> taggings -> tags`, `posts <-> categories` via `categories_posts`).
Use Rails association names as the contract.

## Acceptance criteria

- Convert each remaining file to canonical `TEST_SCHEMA` tables/columns +
  official fixtures/models; no bespoke tables, no invented columns. Match Rails
  table/column/association names exactly. eager-singularization rides direct
  `createTable` for its irregular-plural tables (no canonical analog).
- Each file passes under `AR_ONE_SCHEMA=1` on sqlite, postgres, and maria.
- Remove each converged file from `eslint/one-schema-exclude.json` as it lands
  (and any grandfathered `eslint/require-canonical-schema-exclude.json` entry).
- Split across PRs under the 500-LOC ceiling; one file or sub-cluster per PR.
- Test names match Rails verbatim.
