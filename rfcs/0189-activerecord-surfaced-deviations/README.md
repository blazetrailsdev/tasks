---
rfc: "0189-activerecord-surfaced-deviations"
title: "activerecord surfaced deviations — the package's standing convergence bucket"
status: draft
created: 2026-10-10
updated: 2026-10-10
owner: "@deanmarano"
packages:
  - "activerecord"
  - "activemodel"
  - "ruby-compat"
clusters:
  - "connection-adapters"
  - "associations"
  - "relation"
  - "model"
related-rfcs:
  - "0174-activerecord-api-parity-100"
  - "0175-activerecord-test-parity-100"
  - "0178-activerecord-arms-parity-100"
  - "0188-module-initialize-inlined-into-constructors"
  - "0123-blocked-convergence-holding"
  - "0127-fidelity-tooling-signals-and-hygiene"
  - "0154-ruby-compat-surfaced-deviations"
  - "0158-activesupport-assertion-surfaced-port-bugs"
  - "0023-surfaced-deviations"
---

# RFC 0189 — activerecord surfaced deviations

## Summary

The standing convergence bucket for `packages/activerecord/**`: wrong bodies surfaced by porting work
elsewhere, each one a named Rails `file:line` against a named trails `file:line`, that no gate row,
register entry or report names. It runs no campaign of its own. It is the home a surfaced activerecord
deviation goes to when no active RFC owns its axis, and it is where the draft backlog of
`0174-activerecord-api-parity-100` goes at that RFC's sunset.

## Motivation

trails CLAUDE.md routes a new deviation to "the best-fit active RFC, else the
`<package>-surfaced-deviations` bucket for the package it is about — one exists per package". For
activerecord, the largest port, **none exists**. `0023-surfaced-deviations` is postponed and retired as
the catch-all, and ruby-compat (0154), actionpack (0141) and trailties (0142) each have their bucket.

So activerecord findings went to RFC 0174, the parity campaign that happened to be active. RFC 0174's
charter is four measured axes — name, skip, call and pin — plus one close-out story. Its own README says
so under "Open questions" 1: "there is no `activerecord-surfaced-deviations` bucket. The unclustered
stories here are that bucket in practice", deferred at each of its three splits (2026-10-02, twice, and
2026-10-06).

### Evidence

Measured 2026-10-10 against tasks `main` and trails `main` @ `7bcc4d4996`, during the sunset triage of
RFC 0174.

| Figure                                                         | Value                    |
| -------------------------------------------------------------- | ------------------------ |
| RFC 0174 stories                                               | 233                      |
| — done / closed                                                | 85 / 10                  |
| — `ready` or `in-progress`, all on a charter axis              | 15                       |
| — `draft`                                                      | 123                      |
| — `draft` with a `cluster` (i.e. on one of 0174's axes)        | **0**                    |
| Draft est-loc (9 unsized)                                      | 13,825                   |
| Drafts filed into 0174 in the 3 days to 2026-10-10             | 19                       |
| Drafts filed into 0174 while this triage ran                   | 5                        |
| Drafts found already landed on `main` and closed by the triage | 3 of 125 (premises live) |

Every one of the 123 drafts is unclustered: none deletes a `SKIP_GROUPS` entry, a call-baseline row, an
unpinned body or a name miss. They are bodies that read something Rails does not, carry an arm Rails
lacks, or hold a helper with no Rails counterpart, found while converging a neighbouring member. The
campaign's 15 open charter stories are outnumbered eight to one by a backlog its close-out does not
measure, and the backlog grows by about six stories a day.

The triage checked each draft's slug against trails' merged commits and spot-checked 25 premises
against `main`. Three had landed and were closed (`delete-enum-type-of-now-callerless`, trails#8443;
`djas-add-constraints-null-relation-early-return`, trails#8343;
`join-constraints-extracts-children-in-place`, trails#8479). Every other commit that names a draft
names it as a filed follow-up, so the set is live. It was not verified premise by premise; a story is
re-checked against `main` when it is refined to `ready`, as in every bucket.

## Design

### Scope

In scope: a divergence in `packages/activerecord/**` between a ported member and its Rails counterpart
that no measured axis names, where the fix lands in `packages/activerecord/src/`.

Out of scope, because another RFC owns the row or the fix:

| The story                                                                                  | Owner                       |
| ------------------------------------------------------------------------------------------ | --------------------------- |
| deletes a name miss, a `SKIP_GROUPS` entry, a call-baseline row or an unpinned body        | RFC 0174 while it is active |
| deletes a row of `parity:api:arms:report`, `parity:api:returns` or `parity:api:duck-types` | RFC 0178                    |
| changes a test, an assertion, a fixture file or the test schema                            | RFC 0175                    |
| inlines a module `initialize` or a class-level `new` into a constructor                    | RFC 0188                    |
| is fixed in `packages/activesupport/src/` or `packages/date/src/`                          | RFC 0158                    |
| is fixed in `packages/ruby-compat/src/`                                                    | RFC 0154                    |
| is fixed in the comparer or a parity script (`scripts/api-compare/`, `scripts/parity/`)    | RFC 0127                    |
| is blocked on an owner ruling or on work no active RFC will do                             | RFC 0123                    |

A story that touches two of these goes where its first acceptance criterion points, the rule RFC 0178
already uses. The boundary is checked at filing time.

### Clusters

`cluster:` carries the theme so that `tasks next-bundle --cluster` packs coherent bundles out of a flat
bucket. The four follow Rails' file tree under `activerecord/lib/active_record/`:

- **`connection-adapters`** — `connection_adapters/**`, `connection_handling.rb`, `database_configurations/**`,
  `tasks/**`, `migration/**`, `schema_dumper.rb`, `result.rb`, `statement_cache.rb`, `log_subscriber.rb`,
  `query_cache.rb`: pools and leases, the mysql2 / pg / sqlite3 driver seams, schema statements and
  dumpers.
- **`associations`** — `associations/**`, `reflection.rb`, `autosave_association.rb`,
  `nested_attributes.rb`, `delegated_type.rb`, `disable_joins_association_relation.rb`.
- **`relation`** — `relation/**`, `relation.rb`, `querying.rb`, `scoping/**`, `statement_cache.rb`'s
  callers in finders, `token_for.rb`, `secure_password.rb`.
- **`model`** — everything `Base` includes that is not one of the above: `core.rb`, `persistence.rb`,
  `model_schema.rb`, `inheritance.rb`, `attributes.rb`, `attribute_methods/**`, `callbacks.rb`,
  `transactions.rb`, `validations/**`, `encryption/**`, `enum.rb`, `fixtures.rb` and `fixture_set/**`
  (the source, not the fixture files), `test_fixtures.rb`.

The carried stories arrive unclustered. `tasks` has no verb that sets `cluster`, so assignment is not
part of the rehome; it happens when a story is refined (§ "Open questions" 1).

### Filing

A story here names the Rails `file:line`, the trails `file:line`, and the acceptance criteria that make
the trails body read as the Rails one. It carries `est-loc` and stays `draft` until a refine has
re-checked its premise against `main`. A `CONVERGEABLE <story-id>` receipt in trails that names a story
here keeps resolving when a story moves in, because slugs do not change.

### Carried in

Every story that is `draft` under `0174-activerecord-api-parity-100` on the day this RFC is numbered:
123 on 2026-10-10, minus any that land and plus any filed before then. They are not listed here because
the set moves daily; the rehome commit is the record. The triage already routed the ones another RFC
owns:

| Story                                                                   | Went to                           |
| ----------------------------------------------------------------------- | --------------------------------- |
| `delegate-generated-reader-returns-a-function-valued-result`            | RFC 0158                          |
| `enumerable-pluck-cannot-index-a-records-index-reader`                  | RFC 0158                          |
| `body-pins-cover-only-the-first-def-of-a-multiply-defined-name`         | RFC 0127                          |
| `trailmap-remeasure-attribute-reads-after-cast-cache-fix`               | RFC 0136                          |
| `record-init-internals-never-reaches-activemodel-validations` (blocked) | RFC 0188, which holds its blocker |
| 4 blocked stories waiting on an owner ruling or on RFC 0073             | RFC 0123                          |

RFC 0174 keeps its 15 open charter stories (13 `ready`, 2 `in-progress`), close-out included, and closes
when they land.

## Non-goals

- **Driving activerecord to a parity percentage.** A deviation bucket has no headline number. The
  measured axes stay with RFCs 0174, 0175 and 0178.
- **Re-measuring anything at close.** `activerecord-api-parity-100-close-out` stays in RFC 0174 and does
  not wait on this RFC; no gate reads these stories.
- **Holding blocked work.** A story that turns out to wait on an owner ruling or on an unported
  subsystem moves to RFC 0123 with its blocker.
- **Rewriting the stories.** The carried stories move as they are. Their bodies, sizes and `deps` do not
  change in the rehome.

## Alternatives considered

- **Leave the drafts in RFC 0174.** Rejected: 0174 would hold 138 open stories of which 15 are its
  charter, its close-out would describe a tenth of what the RFC contains, and it could never close
  while agents file six stories a day into it. This is the failure RFC 0141's motivation records for
  RFC 0104.
- **Spread the drafts over existing RFCs.** Done where a charter covers the story (9 stories, table
  above). For the rest no charter does: RFC 0178 takes a story only when the row it deletes comes from
  one of its three reports, and none of the five drafts that mention those reports names such a row in
  its first acceptance criterion. RFC 0175 owns tests, RFC 0188 one mechanical conversion.
- **File under RFC 0023.** Rejected: `postponed`, and retired as the catch-all by CLAUDE.md.
- **Several themed RFCs** (adapters, associations, relation, model). Rejected for the reason RFC 0141
  gives: the right partition at the wrong granularity. The themes are the `cluster:` values.

## Rollout

1. **Filing (this PR).** The README only, `status: draft`. No story file is added or edited.
2. **Rehome, after the number is assigned.** `pnpm tasks rehome <ids> --to <this rfc> --reason "sunsetting
0174-activerecord-api-parity-100: unclustered surfaced deviation, no 0174 axis"` for every `draft`
   story then under RFC 0174.
3. **Routing.** trails CLAUDE.md's "one exists per package" becomes true; a finding agent's
   `pnpm tasks list | grep surfaced-deviations` now returns an activerecord row. RFC 0174's README
   "Open questions" 1 is marked resolved by its owner.
4. **Activation** is the owner's call. Until then the stories are `draft` in a `draft` RFC and none is
   claimable, which is what they are today.

## Verification

- `pnpm validate` passes across all RFCs and stories.
- After step 2, `pnpm tasks list --rfc 0174-activerecord-api-parity-100 --status draft` is empty and
  `pnpm tasks list --rfc <this rfc>` reports the carried count.
- After step 2, every `CONVERGEABLE <story-id>` receipt in `packages/activerecord/src` that named a
  carried story still resolves (`pnpm tasks show <id>`).
- Burndown target: closes at **0 open stories with no new filing for a full campaign cycle**, the way
  0124 and 0134 closed.

## Open questions

1. **Who assigns `cluster` to the carried stories?** `tasks` has no cluster setter and story files are
   not hand-edited. Options: add a `set-cluster` verb (a story for RFC 0091), or assign at refine time
   through whatever the refine flow uses. Deferred to the first refine of this RFC; the bucket works
   unclustered in the meantime, as it did inside 0174.
2. **`draft` or `active`?** Filed `draft` so the owner decides when the backlog becomes schedulable.
   Sibling 0154 was filed `active`; 0141 and 0142 are `draft`.

## Changelog

- 2026-10-10: initial RFC, filed at the sunset triage of `0174-activerecord-api-parity-100` to give
  activerecord the per-package bucket CLAUDE.md says exists.
