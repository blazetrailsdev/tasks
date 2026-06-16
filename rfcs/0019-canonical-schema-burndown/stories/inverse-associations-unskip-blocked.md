---
title: "inverse-associations-unskip-blocked"
status: ready
updated: 2026-06-16
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #3471 converted `packages/activerecord/src/associations/inverse-associations.test.ts`
to the canonical schema/fixtures and dropped it from the
`require-canonical-schema` exclude list. The file is now 100% canonical (no
`defineSchema`, no bespoke models), structured to mirror the seven Rails classes
in `inverse_associations_test.rb` with verbatim test names.

55 tests pass; **38 are `it.skip`** with per-test tracking notes because the
underlying behavior is not yet implemented. This story un-skips them on the
already-canonical file (no class-name collision / no all-or-nothing split, since
the file no longer defines bespoke models).

- trails: `packages/activerecord/src/associations/inverse-associations.test.ts`
- Rails: `vendor/rails/activerecord/test/cases/associations/inverse_associations_test.rb`

## Skipped clusters to converge

1. **has_many_inversing object sharing on the load path** — with
   `Interest.hasManyInversing = true`, a `belongs_to` load must push the owner
   onto the inverse `has_many` cache so the re-loaded child is the _same_ object
   (topic sharing). Affects `with has many inversing should try to set inverse
instances...` (InverseBelongsTo + InversePolymorphic) and `... does not add
unsaved duplicate records when collection is loaded`.
2. **STI / polymorphic automatic inverse detection** — `Author.specialPosts`
   (STI-inferred), `Human.polymorphicFaceWithoutInverse` (`as:`-derived).
3. **`with_automatic_scope_inversing` test helper** — 3 scope-inversing
   reflection tests + `has_many_with_scoped_belongs_to`.
4. **Polymorphic belongs_to writer inverse validation** — `face.polymorphic_human
= ...` / `puzzled_polymorphic_human = ...` raising
   InverseOfAssociationNotFoundError; polymorphic eager-load inverse wiring;
   has_one inverse stale-state preservation.
5. **Autosave / fixture-id sqlite rowid collision** — `create_human` /
   `build_human` + `save!` INSERT collides with the CRC32-hashed fixture
   `humans.id` because the rowid sequence is not advanced past loaded fixtures.
   Affects 3 tests. Likely a shared fixtures-infra fix.
6. **Misc canonical models / features** — namespaced `Admin::Account`/`Admin::User`;
   `Firm`/`Project`/`Developer` has_one :through inverse_of (`this inverse stuff`);
   `Cpk::Car`/`CarReview` + `Cpk::Author`/`Book`/`Order` composite-PK inverse;
   `automatically_invert_plural_associations` (Book/Subscriber);
   `RecordNotFound` model/primaryKey on empty find; recursive inverse
   (`InverseOfAssociationRecursiveError`, RFC 0030); Bulb create/load
   `readAttribute` crash; find/initialize callback ordering (RFC 0030).

## Acceptance criteria

- [ ] Un-skip the listed tests, converging the implementation (never the test
      name or assertion) to Rails. Split across sibling PRs off `main` by cluster
      as needed (the file is canonical now, so per-cluster PRs no longer collide).
- [ ] Where a cluster needs a separate RFC/feature (e.g. RFC 0030 inverse-of
      single-association access), register/track it and skip only what is
      genuinely blocked, with a precise note.
- [ ] No `eslint-disable`; `pnpm vitest run` for the file green (passing, not
      skipped, for converged clusters).
