---
title: "Converge has-many-associations.test.ts residual bespoke schemas → drop exclude entry"
status: done
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 400
priority: 57
pr: 4200
claim: "2026-06-26T14:43:35Z"
assignee: "assoc-has-many-residual-schemas"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

`assoc-has-many` (PR 3467) plus waves 2–9 (`assoc-has-many-describes-wave3..9`,
`assoc-has-many-remaining-describes`) and `associations-collection-cluster` are
all **done**, yet `packages/activerecord/src/associations/has-many-associations.test.ts`
is **still on the canonical-schema exclude list**. The per-test inline tables
were converged, but several file-level bespoke `Schema` consts (and their
`defineSchema(...)` calls) remain — so the exclude entry can never burn to zero
without a dedicated story.

Residual bespoke schemas as of 2026-06-25 (trails
`associations/has-many-associations.test.ts`):

- `UNIVERSAL_HM_SCHEMA` — line ~83
- `HEAD_SCHEMA` — line ~489 (consumed by `defineSchema(HEAD_SCHEMA)` ~577)
- `TAIL_HMT_SCHEMA` — line ~7144
- `TAIL_ASYNC_SCHEMA` — line ~7438
- `TAIL_HMT2_SCHEMA` — line ~7476
- `COUNTER_CACHE_HEAD_SCHEMA` — line ~7558 (consumed ~7568)

The file still contains ~14 `defineSchema(...)` calls. Rails source:
`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`.

## Acceptance criteria

- [ ] Converge each residual schema onto the canonical `TEST_SCHEMA` tables
      (authors/posts/comments/companies/clients/accounts/people/…) matched to
      Rails, OR — only where a column has no `schema.rb` analog — keep a single
      file-unique scoped `defineSchema` + teardown (never a shared canonical
      table name). Add columns to `test-helpers/test-schema.ts` ONLY when Rails
      `schema.rb` has them (parity-check first).
- [ ] No bespoke shared-name schema or `defineSchema(<canonical-name>, …)` left.
- [ ] File **removed from `eslint/require-canonical-schema-exclude.json`**;
      `pnpm lint` clean with no `eslint-disable`.
- [ ] `pnpm vitest run packages/activerecord/src/associations/has-many-associations.test.ts`
      passes on sqlite.
- [ ] Test names unchanged (test:compare matching).

## Definition of done

Fidelity is the deliverable. Leaving the file on the exclude list or adding an
`eslint-disable` does **not** close this story.
