---
rfc: "0000-activemodel-surfaced-deviations"
title: "ActiveModel surfaced deviations — silent body divergences, unreceipted inventions, and receipt hygiene from the 2026-09-01 fidelity audit"
status: draft
created: 2026-09-01
updated: 2026-09-01
owner: "@deanmarano"
packages:
  - "activemodel"
clusters:
  - "rails-deviation"
  - "invented-arm"
  - "guard-parity"
  - "receipt-hygiene"
  - "test-placement"
related-rfcs:
  - "0115-activemodel-fidelity-convergence"
  - "0131-activemodel-activerecord-api-parity-100"
  - "0124-arel-surfaced-deviations"
  - "0126-fidelity-tooling-continuation"
  - "0129-ruby-compat"
---

# RFC — ActiveModel surfaced deviations

The `activemodel-surfaced-deviations` bucket, seeded from the activemodel
fidelity audit
(`~/.btwhooks/data/github/blazetrailsdev/trails/audits/activemodel-fidelity-20260901T135335Z.md`),
mirroring what 0124 did for arel. Every story carries the trails and Rails
`file:line` verified against the tree on 2026-09-01.

## Summary

activemodel measures well — 737/754 methods (97.7%), 963/963 test parity,
321/321 parameter names, 0 gated call-arg rows — but the audit's line-by-line
read of 12 files against `vendor/rails/activemodel/lib/active_model/**` found
debt the numbers do not show: silent behavioral divergences, one
ratified-rule violation, ~50 unreceipted novel names, and four malformed
receipts. This RFC is the package's deviation bucket: 20 stories, each
converging one finding (or recording the reviewed decision at the site where
convergence is genuinely impossible).

## Motivation

The counted dimensions are green while behavior quietly differs. Concretely,
from the audit:

- **Silent behavioral divergences** the test suite does not catch:
  `Errors#asJson` ignores the `full_messages` option (`errors.ts:108` vs
  `errors.rb:246`); all ten `Dirty` dispatch targets resolve attribute aliases
  where Rails passes `attr_name.to_s` raw (`dirty.ts:58-171` vs
  `dirty.rb:299-419`), flipping `attribute_changed?(:alias)`;
  `attribute-set/builder.ts` adds a `?? defaultValue()` type fallback in three
  places where Rails would fail loudly.
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

Stories are clustered:

- `rails-deviation` — body diverges from its Ruby twin (control flow, dropped
  call, error site): the errors.ts trio, the Dirty alias sweep, comparability,
  time-value, `typeCastForSchema`, the `isValid` decomposition, the
  alias-definition reroute, `Errors#[]`.
- `invented-arm` — surface Rails does not have: the builder `defaultValue()`
  fallback, the Type/ValueType split, attribute.ts novel members, the
  `ModelName`/namespace pair.
- `guard-parity` — the UserProvidedDefault slot guard.
- `receipt-hygiene` — the prose receipts, the serialization thenable
  machinery, the no-counterpart-files sweep.
- `test-placement` — the two mapping gaps and the suffix rename.

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

## Alternatives considered

- **File everything into `0023-surfaced-deviations`:** retired as the
  catch-all; per-package buckets are the convention (0124 for arel).
- **Fold into RFC 0131:** 0131 is a placement/visibility RFC ("to 100% on
  parity:api"); these are behavior and surface findings its measurement cannot
  see. Mixing them would blur 0131's declaration-only taxonomy.
- **Ratify the deviations with receipts instead of converging:** violates the
  never-ratify rule; receipts appear here only where the audit verified a
  genuine TypeScript shortcoming or a repo-ratified rule already covers the
  shape.

## Rollout

Ordered by behavioral impact; each story is an independent PR from `main`
(no stacking, non-overlapping files).

1. **Behavior fixes** — `errors-as-json-drops-full-messages-option`,
   `dirty-dispatch-targets-resolve-aliases-rails-does-not`,
   `builder-invented-default-value-type-fallback`,
   `errors-import-drops-override-options-symbolization`,
   `errors-where-invented-branch-and-merge-bang-return`,
   `type-cast-for-schema-stringify-vs-inspect`,
   `attribute-user-provided-default-slot-guard-invented-throw`.
2. **Decomposition + missing surface** —
   `is-valid-inlines-validation-callback-wrap`,
   `alias-attribute-method-definition-reroute-namespace`,
   `port-errors-square-bracket-reader`.
3. **Baseline placeholders** — `comparability-error-options-converge`,
   `time-value-fast-string-to-time-review`.
4. **Surface burndown** — `type-value-split-and-name-property-burndown`
   (largest; may spawn split follow-ups),
   `attribute-ts-novel-members-receipt-or-fold`,
   `serialization-thenable-machinery-receipts`,
   `no-counterpart-files-receipt-sweep`,
   `receipt-hygiene-prose-receipts-and-duplicate-tag`,
   `naming-model-name-namespace-drop-and-modelname-rename`.
5. **Test placement** — `test-compare-lint-and-serializers-json-mapping`,
   `rename-trails-only-plain-tests-to-trails-suffix`.

## Verification

- Zero placeholder reasons left in
  `scripts/api-compare/call-mismatches-exclude/activemodel/` (3 today), and
  the file's row count only shrinks (14 today; the comparability story alone
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
   Settled inside its story by one MRI comparison run (`ruby` is on PATH)
   before any code moves; the story converges whichever site is actually
   wrong.
2. **Is `ModelName` a conventions-table mapping of Rails' `Name` or an
   invented rename?** `parity:api` matches the pair while `parity:api:extra`
   scores it novel; its story resolves the tool disagreement in
   `scripts/parity/conventions.ts` either way.

## Changelog

- 2026-09-01: initial RFC, seeded from the activemodel fidelity audit.
