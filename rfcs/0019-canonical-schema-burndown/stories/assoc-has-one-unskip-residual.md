---
title: "assoc-has-one-unskip-residual"
status: claimed
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-18T14:22:08Z"
assignee: "assoc-has-one-unskip-residual"
blocked-by: null
---

## Context

PR #3585 converted `has-one-associations.test.ts` to canonical models/fixtures
(story `assoc-has-one-shared-tables`). The old bespoke file _faked_ behavior
against bespoke tables, so it reported 71 `matched` tests in `test:compare`; the
honest canonical port reports 51 `matched` / 41 `skipped` (−20 `matched`),
because ~20 previously-faked-passing tests surface real has_one impl gaps and
are now faithful `it.skip`s. This story tracks un-skipping them as each blocking
impl gap closes, recovering the −20 delta. (Owner-approved negative delta per
the canonical-port norm; fidelity > gate.)

trails: `packages/activerecord/src/associations/has-one-associations.test.ts`
Rails: `vendor/rails/activerecord/test/cases/associations/has_one_associations_test.rb`

### Skipped regressions grouped by blocking gap

- **belongs_to inverse-of on cascade/load** (so `Account#firm` is set when the
  has_one loads it, letting `before_destroy` record `destroyed_account_ids`):
  `dependence`, `association change calls destroy`. See
  `inverse-of-single-association-access-convergence` (RFC 0030).
- **has_one writer immediate persistence / new-parent guard / post-failure
  reset** (Rails persists on assignment to a saved owner; raises RecordNotSaved
  on a new parent; resets target on failed assignment): `assignment before
child saved`, `create when parent is new raises`, `creation failure due to
new record should raise error`. Folds into `assoc-has-one-writer-persist`.
- **belongs_to null-assignment via `update`** (`post.update({author: null})`
  must nullify the FK): `clearing an association clears the associations
inverse`.
- **has_one load on a new record with a manually-set PK**:
  `has one loading for new record`.
- **create with inexistent foreign key** must raise UnknownAttributeError:
  `create with inexistent foreign key failing`.
- **canonical Bulb public attribute accessors** (build/create block forms +
  after_initialize): `build with block`, `create with block`,
  `create bang with block`, `association attributes are available to after
initialize`. Blocked by `canonical-bulb-public-attribute-accessors` (RFC 0030).
- **polymorphic has_one**: `nullify on polymorphic association`.
- **Cpk has_one** (CompositePrimaryKeyMismatchError + nullify):
  `nullification on cpk association`, `composite primary key malformed
association class`, `composite primary key malformed association owner class`.
- **has_one touch query-counts** (Club/Membership): `has one with touch option
on create`, `... on update`, `... on destroy`.
- **Developer audit_logs model** (Developer.create builds `auditLogs`):
  `nullification on destroyed association` — needs the `AuditLog` model ported.

## Acceptance criteria

- [ ] As each blocking gap above closes, un-skip the corresponding test(s) and
      port the body faithfully from Rails (drop the `it.skip` + BLOCKED note).
- [ ] `test:compare` `matched` for `has-one-associations.test.ts` returns to ≥71
      (recovering the −20 from the canonical conversion).
- [ ] No bespoke tables / `defineSchema` reintroduced; stay on canonical
      models + `companies`/`accounts` fixtures.
