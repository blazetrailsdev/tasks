---
rfc: "0134-activemodel-surfaced-deviations"
title: "ActiveModel surfaced deviations — the package's deviation bucket, taking custody from 0023 and adding the 2026-09-01 fidelity audit's findings"
status: draft
created: 2026-09-01
updated: 2026-09-01
owner: "@deanmarano"
packages:
  - "activemodel"
  - "activerecord"
  - "activesupport"
  - "date"
clusters:
  - "rails-deviation"
  - "invented-arm"
  - "guard-parity"
  - "receipt-hygiene"
  - "test-placement"
related-rfcs:
  - "0023-surfaced-deviations"
  - "0115-activemodel-fidelity-convergence"
  - "0131-activemodel-activerecord-api-parity-100"
  - "0124-arel-surfaced-deviations"
  - "0126-fidelity-tooling-continuation"
  - "0129-ruby-compat"
---

# RFC 0134 — ActiveModel surfaced deviations

The `activemodel-surfaced-deviations` bucket, following 0124's precedent for
arel: activemodel's deviation findings are pulled out of the
`0023-surfaced-deviations` catch-all into the package they belong to, and the
2026-09-01 fidelity audit's genuinely-new findings are added alongside them.

Audit report:
`~/.btwhooks/data/github/blazetrailsdev/trails/audits/activemodel-fidelity-20260901T135335Z.md`.
Every story carries trails and Rails `file:line` verified against the tree on
2026-09-01.

## Summary

activemodel measures well — 737/754 methods (97.7%), 963/963 test parity,
321/321 parameter names, 0 gated call-arg rows — but a line-by-line read of 12
files against `vendor/rails/activemodel/lib/active_model/**` found debt the
numbers do not show: silent behavioral divergences, one ratified-rule
violation, ~50 unreceipted novel names, and four malformed receipts.

This RFC holds **75 stories**: 17 from the audit, 57 taken into custody from
0023 (see Reconciliation), and the Phase 0 story that performed the transfer.
19 of the transferred ones arrive already `closed` — they are here because
their subject is activemodel, not because there is work left in them. It is the
home for activemodel deviation work going forward.

## Reconciliation with 0023 (do this before adding anything else here)

0023 is the retired catch-all. It held **81 activemodel-labelled stories**,
of which 72 were open (`draft`/`ready`) — counted 2026-09-01 with
`grep -l '"activemodel"' rfcs/0023-surfaced-deviations/stories/*.md`. That was
the pool this bucket owns, exactly as 0124 took custody of arel's 37, and it is
now transferred.

**Six moved with the RFC's seeding commit**, because the audit independently
rediscovered them and their 0023 prose is equal or better than the audit's.
Story IDs are filename-based, so a move preserves every existing reference:

| story (now here)                                     | why moved                                                                                                                                                                                                        |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `errors-as-json-drops-full-messages-option`          | identical finding AND identical slug to the audit's; 0023's version additionally catches Ruby's `&&`-returns-LHS nil subtlety and names the Rails test                                                           |
| `dirty-readers-resolve-aliases-where-rails-does-not` | same finding as the audit's Dirty story; 0023's is better — it enumerates the Rails lines, notes the behaviour predates PR #6990, notes both call gates are blind to it, and correctly labels `activerecord` too |
| `attribute-override-cast-value-invented-mutator`     | the audit framed `overrideCastValue` as "plausibly PERMANENT", which is **wrong** — 0023 establishes Rails' value-returning `with_cast_value` (`attribute.rb:87`) as the counterpart, so it converges            |
| `serializable-hash-async-return-boundary`            | same surface as the audit's thenable-receipts story; 0023's diagnoses the real async boundary, names all four functions, and records that an 0115 story is blocked on it                                         |
| `model-name-use-relative-model-naming-detection`     | the namespace half of the audit's naming story; 0023's knows the PR #6572 history and both trails call sites the audit missed                                                                                    |
| `comparison-validator-private-compare-is-invented`   | the other half of the comparability/comparison pair this RFC's `comparability-error-options-converge` touches — they edit the same two files                                                                     |

Three audit stories were **deleted** as inferior duplicates in the same commit
(`errors-as-json-…`, `dirty-dispatch-targets-…`, `serialization-thenable-…`),
and two were narrowed (`attribute-ts-novel-members-…` lost its
`overrideCastValue` item; the naming story was split, leaving
`modelname-vs-rails-name-tooling-disagreement`).

**The remaining 72 open ones were re-verified and transferred by Phase 0**
(`custody-transfer-activemodel-stories-from-0023`), following 0124's method
exactly. Every one was read against the tree it describes, not just retitled:

- **32 moved here** and still open, each keeping its prose, `est-loc`, `deps`
  and `packages` labels (9 keep `activerecord` alongside `activemodel`, 2 keep
  `activesupport`, 1 keeps `date` — all four are declared above) and gaining a
  declared `cluster`. Story ids are filename-based, so every existing reference
  survives the move; each id was `git grep`ed across trails first and none is
  cited by a `CONVERGEABLE` receipt.
- **19 closed as converged**, each with a `closed-reason` naming the trails
  `file:line` that retired it. Their files move here too — closing does not
  change a story's subject — so 0134 is the whole activemodel record, open and
  retired. In summary:
  - **Attribute-method generation (4):** `defineAliasAccessor` is gone and
    `defineAttributeMethodPattern` has no bare-pattern carve-out
    (`bare-pattern-generates-reader-not-accessor-property`);
    `pattern.parameters` now gates the `answersWithAMethod` arm and threads
    into `defineProxyCall` (`attribute-method-pattern-parameters-unused`); the
    three registrars assign a new array and `ensureOwnPatterns` is gone
    (`attribute-method-pattern-registrars-push-instead-of-class-attribute-append`);
    `applyTo(attributeSet)` is the whole signature
    (`apply-to-takes-an-extra-class-argument`).
  - **Dirty and mutation tracking (4):** the external `DirtyTracker` no longer
    exists — `mutationsFromDatabase` / `mutationsBeforeLastSave` are
    `AttributeMutationTracker`s (`dirty-tracker-is-one-object-…`,
    `port-mutations-from-database-as-tracker`), `new M({attr})` now reports
    `changes` against the `_defaultAttributes` baseline and `changesApplied()`
    moves them to `previousChanges` (`construction-time-dirty-baseline-…`,
    verified by probe), and the read marker lives on `Attribute#hasBeenRead`
    (`accessed-fields-marker-belongs-on-the-attribute`).
  - **Numericality (3):** `validateEach` walks one
    `slice(options, ...RESERVED_OPTIONS)` loop in Rails' branch order, reassigns
    `value` from `parseAsNumber` at Rails' line, and carries no trails-only
    `allowBlank` arm; the exponent test no longer skips.
  - **Type and attribute-set (5):** `AttributeSet#deepDup` is the one-line
    `transform_values(&:deep_dup)` of `attribute_set.rb:73-75` (two stories),
    `_castWithoutScale` is gone, `ImmutableStringType#serialize` is the branch
    of `immutable_string.rb:48-54` with an identity `serializeCastValue`, and
    `typeForAttribute` dispatches through `this.resolveAttributeName`.
  - **Errors and validators (3):** `copyBang` calls `deepDup` and `dupWithBase`
    plus its `@missingRailsCall` tag are gone; every validator overrides
    `checkValidityBang`; `MAX_PASSWORD_LENGTH_ALLOWED` and
    `InstanceMethodsOnActivation` both exist and are used.
- **21 left in 0023**, because their subject is another package or they are
  cross-package sweeps. They are named in Non-goals below.

`grep -l '"activemodel"' rfcs/0023-surfaced-deviations/stories/*.md` therefore
returns 24 — the 21 in Non-goals plus 3 that were already closed or done before
this pass and were left undisturbed. Filtered to open stories it returns exactly
the 21.

### The eight families that came across

The 32 still-open transfers fall into eight groups, and they are the shape of
the work rather than the audit's five clusters — a claimant should pick a
family, not a lone story:

- **Type cast and serialize (9)** — `integertype-castvalue-to-i-semantics`,
  `float-cast-lacks-string-to-f-semantics`,
  `binary-cast-coerces-non-string-values`,
  `bigdecimal-lacks-nan-and-infinity-forms`,
  `serialize-cast-value-drops-is-utc-normalization`,
  `type-registries-register-nonexistent-value-type-name`,
  `yaml-encoder-coder-is-per-call-not-per-encoder`,
  `drop-fast-string-to-date-newline-guard`,
  `date-parse-stand-in-zone-table-and-grammar-completeness`. Adjacent to the
  audit's `type-cast-for-schema-stringify-vs-inspect` and
  `time-value-fast-string-to-time-review`.
- **Attribute-method generation (7)** —
  `activemodel-attribute-methods-missing-code-generator-layer`,
  `activemodel-attribute-methods-file-order-drift`,
  `activemodel-attribute-generates-accessors-eagerly`,
  `attribute-methods-method-missing-dispatch-unported`,
  `class-body-reader-suppresses-generated-writer`,
  `one-generated-attribute-methods-carrier-per-class`,
  `define-dirty-attribute-methods-into-generated-module`. This is the family
  the audit's `alias-attribute-method-definition-reroute-namespace` sits in,
  and the one the custody pass retired four stories from.
- **Assignment, access and validation mixins (5)** —
  `assign-attribute-respond-to-setter-reraise-arm`,
  `converge-sanitize-for-mass-assignment-mixin-split`,
  `access-has-no-standalone-mixin-or-indifferent-slice`,
  `model-validate-is-not-variadic`,
  `activemodel-instance-helper-methods-partial`.
- **Dirty and mutation tracking (3)** —
  `mutable-changed-in-place-reserializes-raw-old-value`,
  `activemodel-numeric-changed-passes-cast-value-to-equal-nan`,
  `binary-attribute-changed-uses-reference-equality`. The structural half of
  this family converged; what is left is per-type equality semantics — `Value#isChanged`
  is still `oldValue !== newValue` (`packages/activemodel/src/type/value.ts:57-59`).
- **Test placement (3)** — `activemodel-tests-lack-shared-rails-test-models`,
  `date-time-hash-with-wrong-keys-test-asserts-wrong-behavior`,
  `errors-to-json-test-bypasses-activesupport-encoder`. Joins Rollout phase 5.
- **Model naming (2)** — `model-name-derives-from-segments-not-inflected-name`,
  `model-name-initialize-invented-argument-errors`, completing the family whose
  third member (`model-name-use-relative-model-naming-detection`) moved with
  the first six.
- **Multiparameter time (2)** — `multiparameter-empty-string-truthiness` (also
  cited by RFC 0082's truthiness residual register) and
  `multiparameter-extra-positions-collapse`.
- **Numericality (1)** — `wire-numericality-changed-in-place-short-circuit`,
  the one member the custody pass did not retire:
  `prepareValueForValidation` still lacks Rails' leading
  `return value if record_attribute_changed_in_place?` arm
  (`numericality.rb:122`).

### One carried-forward problem, flagged not fixed

`class-body-reader-suppresses-generated-writer` declares
`deps: ["bare-pattern-generates-reader-not-accessor-property"]`, which the
custody pass closed as converged, and its "Converged shape" is premised on
readers becoming generated *methods* rather than accessor properties. CLAUDE.md
ratifies the opposite ("Generated attribute readers are properties"), so that
premise cannot land as written. The dep does not block — the ready queue treats
`closed` as resolved — and a custody transfer does not rewrite bodies, so it is
recorded here for whoever claims it: the story's symptom is real, its stated
route is not.

## Motivation

The counted dimensions are green while behavior quietly differs. From the
audit, excluding what the six custody-transferred stories already cover:

- **Silent behavioral divergences** the test suite does not catch:
  `attribute-set/builder.ts` adds a `?? defaultValue()` type fallback in three
  places where Rails would fail loudly (`builder.rb:51`, `:78`, `:166`);
  `Errors#import` drops Rails' override-options symbolization
  (`errors.rb:154-161`); `Errors#where` invents an early-return branch
  (`errors.rb:189-194`).
- **A ratified-rule violation**: `Attribute#withUserDefault`
  (`attribute.ts:241-248`) guards a slot read with an invented throw, which
  CLAUDE.md's "Call-time constant resolution" section explicitly bans.
- **Unreceipted invented surface**: `parity:api:extra --package activemodel`
  measures 50 novel / 42 moved / 92 total with only 22 receipt-allowed. ~24 of
  the novel rows are one decision — the `Type`/`ValueType` split plus a
  per-subclass `name` property — and are the blocker for enrolling activemodel
  in `parity:api:extra:gate` (arel sits at 0 novel, activerecord is pinned).
- **Receipt hygiene**: 3 free-prose `@noRailsEquivalent` receipts (claims true,
  shape illegal) and 1 duplicated tag.
- **Baseline placeholders**: 3 of activemodel's 14 call-mismatch baseline rows
  still carry the generic RFC 0126 "pending per-body convergence review" text —
  rows nobody has actually reviewed.
- **Test placement**: `cases/lint_test.rb` (the 57th Rails test file) and
  `serializers/json_serialization_test.rb` sit outside the test-compare
  population despite TS twins existing, and 13 trails-authored suites use the
  plain `.test.ts` suffix the trails-only convention reserves for ported files.

## Design

One story per finding, standard deviation-convergence discipline (CLAUDE.md
"A documented deviation is debt, not permission"): every story converges or
`tasks block`s with a specific blocker; none closes by writing a better
justification, widening a baseline, or moving the deviation to a different
register. Regression tests must fail on the baseline before the fix.

Clusters: `rails-deviation` (body diverges from its Ruby twin),
`invented-arm` (surface Rails does not have), `guard-parity` (the slot guard),
`receipt-hygiene` (malformed or missing receipts), `test-placement` (mapping
and suffix gaps).

## Non-goals

Work already owned elsewhere stays there; this RFC does not duplicate it:

- **The 14 DeclOnly parity misses and `gem_version.rb`:** owned by RFC 0131
  (extractor visibility + the last true absences).
- **`type_for_attribute → fetch` baseline row:** owned by
  `burn-down-rfc0126-repairing-surfaced-call-rows` (RFC 0126).
- **The `transformValues` rubyCompat baseline row:** converges under RFC
  0129's delegate-hash-to-Record change.
- **Extra-surface gate enrollment for activemodel:** a separate only-grow
  `GATED_PACKAGES` decision with its own burndown; this RFC only clears the
  novel surface that blocks it.
- **The 8 language-shortcoming baseline rows the audit judged genuine**
  (the Map-`fetch` spellings as spellings, bcrypt, Temporal `new_date`,
  `define_call match?`): correctly baselined; not re-litigated here.
- **Cross-package sweeps that merely touch `packages/activemodel/`** stay in
  0023, per 0124's rule — they are `activemodel`-labelled but not
  `activemodel`-subject:
  `hoist-module-super-and-bind-call-into-activesupport`,
  `consolidate-kernel-integer-and-float-conversions`,
  `claude-md-module-mixins-section-contradicts-itself`,
  `assertion-counter-ignores-ported-minitest-assertions`,
  `converge-four-divergent-public-send-ports`,
  `ruby-object-clone-dup-has-no-settled-trails-spelling`,
  `unify-ruby-class-name-message-helpers`, and
  `parity-api-extra-counts-symbol-keyed-module-hooks-as-novel` (a
  `parity:api:extra` extractor finding).
- **Stories whose subject is `activesupport`** stay in 0023:
  `extend-copies-module-functions-ruby-does-not` (`include.ts`'s `extend()`),
  `set-callback-undefined-chain-raises-bespoke-error` and
  `restore-conditional-skip-callback-coverage-in-skip-writer` (both
  `callbacks.ts`).
- **Stories whose subject is `activerecord`** stay in 0023:
  `column-serializer-arity-check-raises-typeerror-not-argumenterror`,
  `route-record-hydration-through-build-from-database`,
  `retire-the-ar-validates-macro-override`,
  `activerecord-primes-a-new-records-dirty-set`,
  `belongs-to-default-runs-at-before-validation-queue-position`,
  `destroy-callback-preload-scans-filter-source-text`,
  `query-parity-datetime-precision-unprecisioned-column`,
  `connection-in-local-time-is-vacuous-under-utc-ci`,
  `converge-update-columns-unknown-key-raise`, and
  `auto-filtered-parameters-model-name-element`.

## Alternatives considered

- **Leave everything in `0023-surfaced-deviations`:** retired as the catch-all;
  per-package buckets are the convention (0124 for arel). Leaving them there is
  what produced this RFC's duplicate-filing problem in the first place.
- **File the audit's findings without reconciling 0023:** rejected — it is how
  the first draft of this PR shipped three exact duplicates of open stories.
  Two implementers picking the same finding out of two RFCs is the failure
  mode.
- **Fold into RFC 0131:** 0131 is a placement/visibility RFC ("to 100% on
  parity:api"); these are behavior and surface findings its measurement cannot
  see. Mixing them would blur 0131's declaration-only taxonomy.
- **Ratify the deviations with receipts instead of converging:** violates the
  never-ratify rule. The `overrideCastValue` item is the cautionary example —
  the audit reached for PERMANENT on a method Rails demonstrably has a
  counterpart for.

## Rollout

Each story is an independent PR from `main` (no stacking, non-overlapping
files). Phases 1-5 sequence the audit's 17 findings, whose interlocks are
known. The 32 still-open custody transfers are **not** folded into those
phases — their ordering constraint is the family, described above, and each
family's own `deps` — except the three test-placement ones, which join phase 5
behind `test-compare-lint-and-serializers-json-mapping`.

0. **Custody transfer** — **done**: the remaining 72 open activemodel-labelled
   stories in 0023 were re-verified against the tree, 32 moved here still open,
   19 closed as converged (files re-homed here), 21 left in 0023 as not
   activemodel-subject (see Reconciliation and Non-goals). The 32 arrive
   clustered and grouped by family, so they slot in without a re-read.
1. **Behavior fixes** — `errors-as-json-drops-full-messages-option`,
   `dirty-readers-resolve-aliases-where-rails-does-not`,
   `builder-invented-default-value-type-fallback`,
   `errors-import-drops-override-options-symbolization`,
   `errors-where-invented-branch-and-merge-bang-return`,
   `type-cast-for-schema-stringify-vs-inspect`,
   `attribute-user-provided-default-slot-guard-invented-throw`.
2. **Decomposition + missing surface** —
   `is-valid-inlines-validation-callback-wrap`,
   `alias-attribute-method-definition-reroute-namespace`,
   `port-errors-square-bracket-reader`,
   `model-name-use-relative-model-naming-detection`.
3. **Baseline placeholders** — `comparison-validator-private-compare-is-invented`,
   then `comparability-error-options-converge` (that order: the first may
   delete the code the second edits), `time-value-fast-string-to-time-review`.
4. **Surface burndown** — `attribute-override-cast-value-invented-mutator`,
   then `attribute-ts-novel-members-receipt-or-fold` (declared `deps`);
   `type-value-split-and-name-property-burndown` (largest; may spawn split
   follow-ups), `serializable-hash-async-return-boundary`,
   `no-counterpart-files-receipt-sweep`,
   `receipt-hygiene-prose-receipts-and-duplicate-tag`,
   `modelname-vs-rails-name-tooling-disagreement`.
5. **Test placement** — `test-compare-lint-and-serializers-json-mapping`
   **first**, then `rename-trails-only-plain-tests-to-trails-suffix`, which
   declares the dependency in its frontmatter: the mapping story may pull
   `lint.test.ts` and `serializers/json.test.ts` into the mapped population,
   and renaming them to `.trails.test.ts` first would defeat that.

## Verification

- 0023 holds zero open activemodel-**subject** stories. Met by Phase 0: the 21
  still matching `grep -l '"activemodel"'` are activerecord-, activesupport- or
  sweep-subject and are enumerated in Non-goals. None of the 19 closed was
  closed without a recorded `closed-reason` citing the tree state.
- Zero placeholder reasons left in
  `scripts/api-compare/call-mismatches-exclude/activemodel/` (3 today), and
  the row count only shrinks (14 today; the comparability story alone
  retires 2).
- `pnpm parity:api:extra --package activemodel` unreceipted novel count
  reaches 0 (50 novel minus 22 allowed today), making the package eligible
  for the extra-surface gate.
- Zero free-prose `@noRailsEquivalent` tags in `packages/activemodel/src`
  (every tag matches `PERMANENT` or `CONVERGEABLE [a-z0-9-]+`; 3 prose + 1
  duplicate today).
- `pnpm parity:test` activemodel reaches 57/57 mapped Rails files (56 counted
  today).
- Each behavior story lands a regression test that failed on its baseline.

## Open questions

1. **Does the Dirty alias resolution compensate for a generation-path gap?**
   Settled inside `dirty-readers-resolve-aliases-where-rails-does-not` by one
   MRI run (`ruby` is on PATH), which that story already requires as its first
   acceptance criterion.
2. **Is `ModelName` a conventions-table mapping of Rails' `Name` or an
   invented rename?** `parity:api` matches the pair while `parity:api:extra`
   scores it novel; `modelname-vs-rails-name-tooling-disagreement` resolves
   the tool disagreement either way.
3. ~~**Does Phase 0 move all 72, or close some in place?**~~ **Answered** by
   Phase 0: of 72 open, 32 moved still-open, 19 closed as converged with a
   tree-state reason, 21 stayed in 0023 as not activemodel-subject. Closed
   stories are re-homed here rather than left behind, so 0134 is the whole
   activemodel record. See Reconciliation.

## Changelog

- 2026-09-01: initial RFC, seeded from the activemodel fidelity audit; six
  stories taken into custody from 0023 and three audit duplicates deleted
  after review found the overlap.
- 2026-09-01: Phase 0 (`custody-transfer-activemodel-stories-from-0023`) — the
  remaining 72 open activemodel-labelled stories in 0023 re-verified against
  the tree: 32 moved here open and clustered, 19 closed as converged (their
  files re-homed here too), 21 left in 0023 and named in Non-goals.
  `activesupport` added to declared `packages`; open question 3 answered.
