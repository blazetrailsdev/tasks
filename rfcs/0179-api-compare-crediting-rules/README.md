---
rfc: "0179-api-compare-crediting-rules"
title: "api-compare crediting rules: stop the gates flagging a correct port — split from RFC 0174"
status: active
created: 2026-10-02
updated: 2026-10-02
owner: "@deanmarano"
packages:
  - "activerecord"
  - "actionpack"
  - "actionview"
  - "activesupport"
clusters:
  - call-set
  - call-args
  - surface
  - reports
related-rfcs:
  - "0174-activerecord-api-parity-100"
  - "0178-activerecord-arms-parity-100"
  - "0127-fidelity-tooling-signals-and-hygiene"
  - "0156-parity-beyond-name-presence"
  - "0173-activemodel-parity-100"
  - "0154-ruby-compat-surfaced-deviations"
priority: 2
---

# RFC 0179 — api-compare crediting rules: stop the gates flagging a correct port

## Summary

This RFC holds stories whose fix is a rule in the comparer under `scripts/api-compare/`, not a change to a
port. Each one names a body that already does what Rails does and is still flagged, so it carries a receipt
(`@missingRailsCall`, `@missingRailsArgs`, `@noRailsEquivalent`) for a call it makes or a name Rails has.
The story teaches the gate to credit the port and deletes the receipts. It was split out of
`0174-activerecord-api-parity-100` on 2026-10-02 with 22 stories. 20 are open, at 3,000 est-loc;
2 were closed with no work done. The
destination of a story is decided by one question: **does its first acceptance criterion change the
comparer or the port?**

## Motivation

After RFC 0178 took the arms cluster, RFC 0174 held 266 stories. 22 of them are not activerecord work:

| Slice of 0174 (2026-10-02, from the DB) | Stories | Open | Open est-loc |
| --------------------------------------- | ------- | ---- | ------------ |
| comparer-rule stories                   | 22      | 20   | 2,850        |
| everything else                         | 244     | 198  | 36,555       |

The 2,850 is the DB's figure. One of the 20 open stories had no estimate and is sized at 150 in this split, which gives
the 3,000 the Summary and § "Rollout" use.

They differ from the rest of 0174 in three ways:

- **The diff lands in `scripts/`.** Eight of them name `compare.ts`, four `call-args.ts`, four
  `extract-ruby-api.rb` and three `receiver-as-first-arg.ts`. An agent working one needs the comparer's
  tests and no database.
- **They are not activerecord's.** A crediting rule applies to every package the gate reads. Three of the
  stories already name actionpack, actionview or activesupport receipts they clear.
- **They were filed across two clusters and none.** 10 sat in `receipts`, 2 in `tooling` and 8 had no
  cluster, so no listing of 0174 showed them together, and one rule was filed twice (see § "Open
  questions").

### Baseline

Measured 2026-10-02 on trails `main` @ `c0f89d7927`.

| What                                                                      | Now                                       | Target                    |
| ------------------------------------------------------------------------- | ----------------------------------------- | ------------------------- |
| receipts in `packages/` that cite one of these stories                    | 53 in 32 files                            | 0                         |
| of which `@missingRailsCall` / `@missingRailsArgs` / `@noRailsEquivalent` | 38 / 11 / 4                               | 0                         |
| option-keys report, activerecord `extraInTs`-only pairs                   | 43 of 46 pairs (0174's baseline)          | none from a declared type |
| literals report, activerecord rows                                        | 1, a normalizer fault (0174's baseline)   | 0                         |
| structural-duplicates report, activerecord candidates                     | 9, all shape-only (the story's own count) | 0                         |

The first row is `git grep -F -f <slugs> -- packages | wc -l` over the 20 open slugs. The other 3 option-keys pairs
had a key missing in TS and were converged by `activerecord-option-keys-missing-in-ts` (RFC 0174, done).
How many of the 43 are real invented keys is not known until the extractor reads the body. The option-keys and
literals figures were measured for 0174 on 2026-09-30 @ `ea7d456048` and were not re-run for this split.

## Design

### Scope

**In:** a story whose first acceptance criterion changes the comparer (`scripts/api-compare/`,
`scripts/parity/`) so that a port which already matches Rails stops being flagged. It covers four
mechanisms, which are this RFC's clusters:

| Cluster     | Mechanism                                                                             | Stories      |
| ----------- | ------------------------------------------------------------------------------------- | ------------ |
| `call-set`  | the call-set gate (`pnpm parity:api:calls`): which TS forms count as a Ruby call      | 12 (11 open) |
| `call-args` | the call-argument gate (`pnpm parity:api:calls:args`): receiver alignment and pairing | 5 (4 open)   |
| `surface`   | the extra-surface scorer (`pnpm parity:api:extra:gate`) and the owner-seat rule       | 2            |
| `reports`   | advisory reports: option keys, literals, structural duplicates                        | 3            |

### Where a story goes

This table is repeated in 0174 § "Split: RFC 0179".

| The story's first acceptance criterion changes                                   | File it in                                    |
| -------------------------------------------------------------------------------- | --------------------------------------------- |
| a call-set, call-argument, extra-surface or advisory-report rule in the comparer | here                                          |
| the arms, void-return or duck-type extractor                                     | `0178-activerecord-arms-parity-100`           |
| a port under `packages/*/src`, a skip group, an exclude file or a baseline row   | the package's own RFC (0174 for activerecord) |
| a new signal, a new gate or a ratchet's mechanics                                | `0127-fidelity-tooling-signals-and-hygiene`   |

Two stories here leave the choice between a comparer rule and a port open, and decide it in their own PR:
`call-gate-credits-a-dynamic-import-as-kernel-load` (credit `import()` as `load`, or add a ruby-compat
`load`) and `extra-surface-credits-a-cross-package-extend-edge-to-its-extender` (follow the edge in the
scorer, or delete the declaration). They moved because the receipt they delete exists only for the gate. If
one resolves as a ruby-compat primitive, that primitive is filed in
`0154-ruby-compat-surfaced-deviations` and the story here takes a `deps` edge on it.

A story that both ports and re-scores stays with the port. `compatibility-module-members-unmeasured-by-parity-api`
and the two `*-score-against-the-*-gem` stories did not move for that reason.

### Principles

- **The rule is narrow and tested.** Each story adds the smallest proof that credits the port, with a unit
  test for the credited case and one for the nearest case that must stay flagged. A rule that silences a
  real omission is worse than the receipt it removes.
- **Every receipt the rule clears is deleted in the same PR**, in every package. The receipts gate reds a
  receipt that suppresses nothing, so a rule and its receipts cannot land separately.
- **No row is added.** A story adds no baseline row and no new receipt. Any row that moves in a package the
  story did not name is listed in the PR body.
- **If the port is wrong, the story says so and stops.** Where the body turns out not to match Rails, the
  port fix is filed in the package's RFC and this story takes a `deps` edge on it.
- **Each story is one PR.** The largest is 250 est-loc.

### Ordering

No story here has a `deps` edge. Three groups touch the same function, so within a group the second PR
rebases on the first:

- `compare.ts#significantCallsForReceivers`: `call-gate-credits-a-length-read-as-array-size`,
  `call-gate-proves-array-literal-ivars-and-kernel-array-receivers`,
  `call-gate-proves-where-clause-predicates-an-array-for-size`. All three concern `size` / `last` on an
  Array. The first credits the TS `.length` read; the other two extend the Ruby-side Array proof. Their
  receipt lists do not intersect today (`relation/batches.ts`, `calculations.ts`, `finder-methods.ts` and
  `migration.ts`; `connection-adapters/abstract/` and `asynchronous-queries-tracker.ts`;
  `relation/where-clause.ts`), but a broader proof in one can clear a receipt another names, so each
  re-checks its list before starting.
- `call-args.ts#alignBuiltinReceiver`: the three `call-args-gate-aligns-the-receiver-of-*` stories, and
  the second criterion of `call-gate-credits-a-ruby-compat-import-renamed-around-a-module-homonym`.
- `call-args.ts#pairCallSites`: `pair-call-sites-breaks-ties-by-receiver-name` alone. A story in RFC 0173
  waits on it (§ "Gating"), so it goes first.

### Gating

- **`active` from birth.** The two `ready` stories here were claimable in 0174 and stay claimable. The 18
  drafts are not claimable until they are marked ready, as before.
- **Edges out of this RFC:** none.
- **Edges into this RFC:** `lazy-attribute-set-keys-drops-args-receipt-after-pairing-tiebreak` (RFC 0173)
  depends on `pair-call-sites-breaks-ties-by-receiver-name`. `activerecord-api-parity-100-close-out`
  (RFC 0174) names `activerecord-option-keys-extra-arm-measures-read-keys` and
  `activerecord-literal-normalizer-backslash-escapes`.

### After merge

`tasks set-deps-rfc` refuses an RFC that is not on main yet, so these run once this has merged. They
replace the 0174 close-out's two story-level edges with one edge on this RFC, and finish the same cleanup
for RFC 0178, which `tasks set-deps` refused while the close-out's `deps` was a wrapped flow sequence.
That refusal is tracked as `set-deps-refuses-a-prettier-wrapped-flow-sequence` (RFC 0091); this split
rewrites the list as a block list so the verb works today:

```bash
tasks set-deps-rfc activerecord-api-parity-100-close-out --add 0179-api-compare-crediting-rules
tasks set-deps activerecord-api-parity-100-close-out --remove activerecord-option-keys-extra-arm-measures-read-keys,activerecord-literal-normalizer-backslash-escapes
tasks set-deps activerecord-api-parity-100-close-out --remove <the 43 slugs now under rfcs/0178-activerecord-arms-parity-100/stories>
```

## Non-goals

- **Arms, void-return and duck-type extractor faults.** RFC 0178 owns them with the rows they produce.
- **New signals, new gates and ratchet mechanics.** RFC 0127 and RFC 0156 own those. This RFC only changes
  what an existing gate credits.
- **Porting.** No story here changes a body under `packages/*/src` beyond deleting a receipt, with two
  exceptions the stories already name: `comparator-reads-a-module-named-const-as-the-instance-seat` exports
  three module-named consts, and `call-gate-credits-string-conversion-as-string-new` restores one Rails
  guard.
- **Auditing PERMANENT receipts.** The `activerecord-audit-permanent-receipts-*` stories stay in 0174.
  They are where most of these stories were surfaced, and a new finding of this kind is filed here.
- **A close-out story.** The end condition is a count (§ "Verification"), and 0174's close-out re-measures
  every gate these rules feed.

## Alternatives considered

- **A new active RFC for the comparer-rule stories (chosen).** 22 stories (20 open), no
  `deps` edge out, one in from
  RFC 0173 and two from the 0174 close-out. One mechanism family, one directory.
- **Rehome them into `0127-fidelity-tooling-signals-and-hygiene`**: rejected. 0127 is `draft`, and
  `claimable()` surfaces a story only when its own RFC is `active`, so the two ready stories would stop
  being claimable and the RFC 0173 story waiting on `pair-call-sites-breaks-ties-by-receiver-name` would
  wait on 0127's activation. 0127 is also about new signals and ratchet hygiene, not crediting rules.
- **Leave them in 0174 under one cluster**: rejected. It fixes the listing and nothing else. They would
  still sit in an activerecord RFC while clearing actionpack, actionview and activesupport receipts.
- **Take the connection-adapter stories instead** (39 open, 7,360 est-loc): rejected. 7 edges out and 3 in,
  and it cuts across every axis cluster.
- **Take the "belongs in ruby-compat" stories instead** (about 37 drafts): rejected for now. The group was
  matched by slug keyword, not read, and RFC 0154 (`ruby-compat-surfaced-deviations`) may already be its
  home. It needs its own analysis.
- **Move `compatibility-module-members-unmeasured-by-parity-api` and the two gem-scoring stories too**:
  rejected. Each one's first criterion is a port or a vendored source, and a 0174 pins story depends on
  the first.

## Rollout

Status is from the DB as of 2026-10-02. The groups can be worked in parallel, subject to § "Ordering".

1. **Call-argument gate.** 5 stories, 4 open, 500 est-loc. First, because RFC 0173 waits on the pairing story.
   - Draft: `pair-call-sites-breaks-ties-by-receiver-name`,
     `call-args-gate-aligns-the-receiver-of-a-function-form-hash-merge`,
     `call-args-gate-aligns-the-receiver-of-function-form-fetch-and-max`,
     `call-args-gate-aligns-the-receiver-of-function-form-prepend`
   - Closed, moot before any work (trails#8392 added `last` to `RECEIVER_AS_FIRST_ARG`):
     `call-args-gate-reads-an-explicit-self-receiver-as-a-simple-receiver`
2. **Call-set gate.** 12 stories, 11 open, 1,610 est-loc.
   - Draft, Array `size` / `last`: `call-gate-credits-a-length-read-as-array-size`,
     `call-gate-proves-array-literal-ivars-and-kernel-array-receivers`,
     `call-gate-proves-where-clause-predicates-an-array-for-size`
   - Draft, a TS form that is a Ruby call: `call-gate-credits-a-dynamic-import-as-kernel-load`,
     `call-gate-credits-invoking-a-proc-valued-member-as-proc-call`,
     `call-gate-credits-rb-f-send-of-a-literal-name-as-that-call`,
     `call-gate-credits-string-conversion-as-string-new`,
     `call-gate-credits-argumentless-hash-new-as-a-literal`
   - Draft, resolution: `call-gate-credits-a-module-include-edge-to-its-includer`,
     `call-gate-credits-a-ruby-compat-import-renamed-around-a-module-homonym`,
     `call-gate-generate-method-set-has-claim-and-heredoc-order`
   - Closed as a duplicate (§ "Open questions" 1): `call-gate-reads-literal-rbfsend-as-a-call`
3. **Surface.** 2 stories, 370 est-loc.
   - Draft: `comparator-reads-a-module-named-const-as-the-instance-seat`,
     `extra-surface-credits-a-cross-package-extend-edge-to-its-extender`
4. **Advisory reports.** 3 stories, 520 est-loc.
   - Ready: `activerecord-option-keys-extra-arm-measures-read-keys`,
     `activerecord-literal-normalizer-backslash-escapes`
   - Draft: `structural-duplicates-report-residual-shape-false-positives`

## Verification

- **No receipt in trails cites a story here.** `git grep -F -f <the 20 open slugs> -- packages | wc -l` reaches 0,
  down from 53.
- **The gates stay green with no row added:** `pnpm parity:api:calls`, `pnpm parity:api:calls:args`,
  `pnpm parity:api:extra:gate` and `pnpm parity:api:receipts:gate`.
- **The three reports list no activerecord false positive:** the literals report has 0 activerecord rows,
  the structural-duplicates report has 0 activerecord candidates, and the option-keys report lists no
  `extraInTs` key that comes from the declared parameter type rather than a read in the body. Any pair
  still listed has been triaged as a real invented key by
  `activerecord-option-keys-extra-arm-measures-read-keys`, which converges it in its own PR or files it in
  `0174-activerecord-api-parity-100` and names the story in its PR body. Converging those filed stories is
  0174's work; this RFC does not wait on it.
- `pnpm tasks list --rfc 0179-api-compare-crediting-rules` shows no open story.

## End condition

This RFC closes when every Verification line holds. It is a bucket for as long as receipt audits keep
finding rules the gates lack: a new one is filed here with `pnpm tasks new 0179-api-compare-crediting-rules
<slug> --body-file <path>`, naming the Rails `file:line`, the TS body, the receipt it carries and the
comparer function that should credit it.

## Open questions

None is open. Each was resolved before the RFC went `active`.

1. **Two stories asked for the same rule.** `call-gate-reads-literal-rbfsend-as-a-call` and
   `call-gate-credits-rb-f-send-of-a-literal-name-as-that-call` both credit a literal-name `rbFSend` /
   `rbFPublicSend` as a call to that name, and both delete the `@missingRailsCall limit` receipt on
   `DisableJoinsAssociationRelation#first`. Resolved: the first was closed as a duplicate with `tasks close`
   on 2026-10-02, before the split. The second is the one trails cites. Both moved here, so the closed one
   sits beside the story that replaced it.
2. **Should the 18 drafts be marked ready?** Resolved: not by this split. `status` is DB-owned and a move
   does not change it; marking one ready is `tasks status-set <id> ready`. The first to mark is
   `pair-call-sites-breaks-ties-by-receiver-name` (50 est-loc), because the RFC 0173 story in § "Gating"
   cannot start until it is done. Each draft has a Rails `file:line`, acceptance criteria and an estimate.
3. **Do the three Array `size` stories overlap?** Resolved: they stay separate. One credits the TS
   `.length` read and two extend the Ruby-side Array proof, and their receipt lists do not intersect today.
   § "Ordering" has each re-check its list first.

## Changelog

- 2026-10-02: created by splitting the comparer-rule stories out of `0174-activerecord-api-parity-100`. 22
  stories moved (2 ready, 18 draft, 2 closed). Each moved story changes its `rfc:` and `cluster:` lines.
  `structural-duplicates-report-residual-shape-false-positives` also takes a title and an `est-loc` of 150,
  which is why the RFC opens at 3,000 est-loc against the DB's 2,850.
