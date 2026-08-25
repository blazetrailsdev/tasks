---
rfc: "0115-activemodel-fidelity-convergence"
title: "activemodel package-wide fidelity convergence and line-bloat burndown"
status: active
created: 2026-08-19
updated: 2026-08-19
owner: "@deanmarano"
packages:
  - "activemodel"
  - "activerecord"
  - "activesupport"
  - "actionview"
clusters:
  - "api-compare"
related-rfcs:
  - "0107-relation-ts-decomposition"
  - "0084-wide-call-set-burndown"
  - "0095-call-argument-parity"
  - "0112-one-rails-thing-n-trails-things"
  - "0023-surfaced-deviations"
priority: 1
---

# RFC 0115 — activemodel package-wide fidelity convergence and line-bloat burndown

## Summary

`packages/activemodel` is the **worst-inflated package in the repo**: 62
Ruby↔TS matched pairs, **3,618 Ruby code lines → 9,076 TS code lines = 2.51x**,
against a repo-wide average of 1.85x (activerecord 2.40x, activesupport 1.76x,
arel 1.51x, actionview 1.15x, rack 1.09x, trailties 0.74x). Measured 2026-08-19
off a fresh `pnpm parity:api`, comparing code lines only (blank and comment
lines stripped on both sides).

This RFC applies the RFC 0107 method — classify every member by _which Rails
file defines its counterpart_, then move or delete — to the whole package.

As in 0107, the ratio is not "the port is verbose". It is three things:
**surface that belongs to a different Rails file** (mostly `model.ts`),
**surface that belongs to a different Rails _package_** (ActiveRecord and
ActiveSupport bodies parked on `ActiveModel::Model`), and **parallel invented
machinery sitting next to a faithful port of the same thing**.

## Motivation

### The measurement (2026-08-19)

Top offenders by excess code lines
(`+excess  ratio  matched-methods  ruby→ts  novel/moved from parity:api:extra`):

```text
+1562 196.2x  29m  ruby    8 -> ts 1570  novel 20 moved 81  model.rb
+ 364   9.5x   1m  ruby   43 -> ts  407  novel  3 moved  7  serialization.rb
+ 292   6.8x   1m  ruby   50 -> ts  342  novel  3 moved  3  callbacks.rb
+ 280   3.3x  17m  ruby  122 -> ts  402  novel  4 moved  2  dirty.rb
+ 274   2.2x  23m  ruby  236 -> ts  510  novel  5 moved  2  attribute_methods.rb
+ 189   3.1x  15m  ruby   91 -> ts  280  novel  6 moved  6  attribute_set.rb
+ 153   3.6x   5m  ruby   58 -> ts  211  novel  3 moved  9  attributes.rb
+ 152   2.7x   6m  ruby   90 -> ts  242  novel  4 moved  1  attribute_registration.rb
+ 139   2.3x  24m  ruby  106 -> ts  245  novel  2 moved  3  naming.rb
+ 127   3.2x   2m  ruby   59 -> ts  186  novel  2 moved  1  type/decimal.rb
+ 117   1.8x  11m  ruby  152 -> ts  269  novel  1 moved  2  attribute_set/builder.rb
+ 116   4.5x   2m  ruby   33 -> ts  149  novel  1 moved  1  attribute_assignment.rb
+ 110   1.9x   4m  ruby  126 -> ts  236  novel  1 moved  0  validations/numericality.rb
+ 109   1.7x  23m  ruby  165 -> ts  274  novel  0 moved 10  errors.rb
+ 104   3.3x   6m  ruby   45 -> ts  149  novel  0 moved  1  type/helpers/accepts_multiparameter_time.rb
+ 100   1.7x  13m  ruby  142 -> ts  242  novel  1 moved  0  error.rb
+  99   3.1x   6m  ruby   47 -> ts  146  novel  2 moved  1  lint.rb
+  93   3.4x   1m  ruby   39 -> ts  132  novel  1 moved  6  type/date_time.rb
+  88   2.6x   7m  ruby   54 -> ts  142  novel  6 moved  3  validator.rb
+  82   2.3x   4m  ruby   61 -> ts  143  novel  3 moved  1  validations/length.rb
```

`pnpm parity:api:extra --package activemodel` scores the package at
**147 novel / 200 moved** public names across 59 files, of which `model.ts`
alone carries **20 novel / 81 moved**.

Fourteen files are already fully clean — `attribute_mutation_tracker.rb`,
`validations/absence.rb`, `conversion.rb` among them. They are the reference
for what "converged" looks like here, and two of them (below) are the direct
evidence that the bloat is _parallel_ machinery, not missing machinery.

### `model.ts` — the classification

`vendor/rails/activemodel/lib/active_model/model.rb` is **8 code lines**: a
`Concern` that does `include ActiveModel::API` and `include ActiveModel::Access`
and nothing else. A raw 196x ratio is therefore meaningless. What is not
meaningless is that `packages/activemodel/src/model.ts` is **2,817 raw /
1,411 code lines over 184 members**, and **only 1 of those members
(`_toPartialPath`, and even that by way of `conversion.rb`) has a counterpart
in `model.rb`.**

Every member was classified by Ruby-name match against the whole of
`vendor/rails/activemodel/lib/active_model/**/*.rb` (plus `activerecord/lib`
and `activesupport/lib` for the no-match residue), summing each member's line
span. Code lines, comments stripped:

| destination                                                       | code lines | members |
| ----------------------------------------------------------------- | ---------- | ------- |
| **no ActiveModel counterpart at all** (breakdown below)           | **709**    | 68      |
| `validations/with.rb`                                             | 114        | 2       |
| `validations/validates.rb`                                        | 102        | 4       |
| `validations.rb`                                                  | 93         | 14      |
| `dirty.rb` (+ 13 shared with `attribute_mutation_tracker.rb`)     | 78         | 20      |
| `validations.rb` / `validator.rb` (`validate`)                    | 35         | 2       |
| `validations/callbacks.rb`                                        | 26         | 2       |
| `serializers/json.rb`                                             | 26         | 2       |
| `attribute_registration.rb`                                       | 25         | 8       |
| `attribute_methods.rb`                                            | 24         | 13      |
| `conversion.rb`                                                   | 18         | 5       |
| `attribute_assignment.rb`                                         | 16         | 4       |
| `naming.rb`                                                       | 17         | 3       |
| `attributes.rb`                                                   | 17         | 4       |
| the ten `validations/<kind>.rb` files (`validates_presence_of` …) | 42         | 15      |
| `access.rb`                                                       | 10         | 2       |
| `serialization.rb`                                                | 6          | 2       |
| `forbidden_attributes_protection.rb`                              | 6          | 2       |
| `translation.rb`                                                  | 5          | 2       |
| everything else (`api.rb`, `callbacks.rb`, shared/ambiguous)      | 42         | 18      |

**1,411 of 1,411 code lines belong somewhere other than `model.rb`.** The file
is not a port; it is a funnel class that absorbed the whole package.

And the 709-line no-ActiveModel-counterpart residue splits cleanly, because
`Base extends Model` (`packages/activerecord/src/base.ts:871`) let ActiveRecord
surface be parked one package down:

| residue bucket                                                                                                                                                                                                                                                                                                                                                                              | code lines |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| hand-written per-event callback macros + `setCallback`/`skipCallback`/`resetCallbacks`/`runCallbacks` — Rails generates these from `define_model_callbacks` (`callbacks.rb:109-127`)                                                                                                                                                                                                        | 316        |
| `normalizes` / `normalizeAttribute` / `normalizeValueFor` / `normalizeChangedInPlaceAttributes` / `_normalizationDecorator` — **`activerecord/lib/active_record/normalization.rb:26,88,106`**                                                                                                                                                                                               | 74         |
| `readAttribute` / `writeAttribute` / `readAttributeBeforeTypeCast` / `attributesBeforeTypeCast` / `columnForAttribute` / `hasAttribute` / `attributePresent` — **`activerecord/attribute_methods{,/read,/write,/before_type_cast}.rb`, `model_schema.rb:463`**                                                                                                                              | 32         |
| the save-side dirty family (`hasChangesToSave`, `savedChanges`, `changesToSave`, `attributeInDatabase`, `attributeBeforeLastSave`, `attributesInDatabase`, `changedAttributeNamesToSave`, `willSaveChangeToAttribute*`, `savedChangeToAttribute*`) — **`activerecord/attribute_methods/dirty.rb:108-180`**                                                                                  | 48         |
| genuinely nowhere in Rails: `toXml`/`_hashToXml`/`_xmlTypeInfo` (XML serialization was extracted to the `activemodel-serializers-xml` gem), `nullifyBlanks`/`_applyNullifyBlanks`, `withOptions`, `_validationOnToIf`, `_rejectOnOption`, `_validateOnCondition`, `_ensureOwnValidators`, `_registerValidator`, `_buildValidateConditions`, `_runValidateCallbacks`, `dup`, the constructor | 239        |

`base.ts:4800-4817` already documents this arrangement in prose ("now lives on
Model.prototype", "Category A: resolved via Model inheritance"). That comment is
the ledger entry; this RFC is the burndown.

## Design

### F0 — the mixin idiom activemodel never adopted

Rails' ActiveModel is built almost entirely out of `ActiveSupport::Concern`:
**12 files `extend ActiveSupport::Concern`, 10 declare `module ClassMethods`,
and 8 carry an `included do` block** (`api.rb:65`, `attribute_methods.rb:70`,
`attributes.rb:35`, `conversion.rb:27`, `dirty.rb:127`, `serializers/json.rb:12`,
`validations.rb:40`, `validations/callbacks.rb:25`). Those blocks do exactly
three things: `extend` a sibling module, declare a `class_attribute`, and call
`define_callbacks`.

Every TS mechanism for all three is already ported and exported. activemodel
uses essentially none of them:

| mechanism                         | defined at                                | activemodel | activerecord |
| --------------------------------- | ----------------------------------------- | ----------- | ------------ |
| `include()` / `Included<>`        | `activesupport/src/include.ts:184`        | **3**       | 144          |
| `extend()` / `Extended<>`         | `activesupport/src/include.ts:335`        | **0**       | 65           |
| `[included]` / `[extended]` hooks | `include.ts:193`, `:272`, `:371`          | **0**       | —            |
| `classAttribute()`                | `activesupport/src/class-attribute.ts:70` | **0**       | 0            |

The three real `include()` call sites (`model.ts:2814`, `naming.ts:457`,
`serializers/json.ts:214`) are the same one-liner — pulling `toJSON` off
`ToJsonWithActiveSupportEncoder`. Everything else is hand-rolled, and the
package carries **82 `.call(this, …)` thunks** (`attribute-methods.ts` 25,
`model.ts` 18, `attributes.ts` 12, `dirty.ts` 9, `attribute-registration.ts` 6,
`attribute-set/builder.ts` 5) — the shape RFC 0107 retired wholesale from
`relation.ts` as its F5.

This is the _mechanism_ behind F1–F6, not a seventh finding alongside them:

- **`extend ClassMethods` → 22 `static X = X` lines.** `model.ts:312-319`,
  `:373` and `:1571-1591` assign class methods onto `Model` by hand. Rails
  `extend`s seven times inside `included do` (`validations.rb:41-45` extends
  `Naming`, `Callbacks`, `Translation` and `HelperMethods`; `api.rb:66-67`;
  `serializers/json.rb:13`). `extend()` has existed the whole time and has zero
  callers here.
- **`class_attribute` → five hand-rolled copy-on-first-write helpers.** Rails
  declares `attribute_aliases` and `attribute_method_patterns`
  (`attribute_methods.rb:71-72`), `param_delimiter` (`conversion.rb:32`),
  `include_root_in_json` (`serializers/json.rb:15`) and `_validators`
  (`validations.rb:50`) as one-line `class_attribute`s. trails reimplements
  those semantics five times: `_ensureOwnValidators` (`model.ts:1453`),
  `ensureOwnPatterns` and `ensureOwnAliases` (`attribute-methods.ts:735`,
  `:741`, six call sites) and `registerWithSuperclass`
  (`attribute-registration.ts:402`). `classAttribute()`'s own contract is
  _"reads walk the constructor chain; writes are local to the class"_ — the
  same thing, ported, with zero callers. This is the RFC 0112 pattern: one
  Rails construct, five trails spellings, and at least one of them
  (`_ensureOwnValidators`) admits in its JSDoc that it is behaviourally wrong.
- **`included do` → hard-coded static initializers.** `model.ts:278-290` bakes
  the two `AttributeMethodPattern`s and the empty alias map into `Model`'s
  static state, where `attribute_methods.rb:70-73` and `attributes.rb:35-37`
  declare them on include.

**A note on the hooks**, because the register looks like it forbids them:
CLAUDE.md's "Module mixins" section says Ruby lifecycle hooks (`extended`,
`included`, `inherited`) have "no TS equivalent — don't stub them", and
`scripts/parity/conventions.ts:444` skips those names with
`tsMirrorIsDrift: true`. That is stale for two of the three. `include.ts`
fires `included` and `extended` callbacks keyed by
`Symbol.for("@blazetrails/activesupport:included")` — so they never appear as
string-named public members, never surface to `parity:api:extra`, and do not
collide with the `SKIP_GROUPS` ban, which is about a string-named TS method.
Only `inherited` genuinely has no equivalent. Fixing that CLAUDE.md wording is
tracked separately; it is very likely why this idiom was never reached for
here.

### F1 — the callback macro block: 316 lines standing in for `define_model_callbacks`

`packages/activemodel/src/callbacks.ts:34-200` already contains a **faithful
port** of `ActiveModel::Callbacks.define_model_callbacks` and its three private
generators `_defineBeforeModelCallback` / `_defineAroundModelCallback` /
`_defineAfterModelCallback` (`callbacks.rb:109,129,136,143`). Rails uses it to
_generate_ `before_save`, `around_save`, `after_save`, … at include time.

trails does not call it for the model lifecycle. Instead `model.ts:1054-1452`
hand-writes 28 near-identical macros (`beforeSave` `:1082`, `afterSave`
`:1097`, `beforeCreate` `:1112` … `afterTouch` `:1332`), each 13–16 lines, plus
`setCallback` `:1365`, `skipCallback` `:1415`, `resetCallbacks` `:1449`,
`runCallbacks` `:2790`. None of them belongs to ActiveModel at all —
`ActiveModel::Model` has no `before_save`; `activerecord/lib/active_record/
callbacks.rb:36` is `define_model_callbacks :initialize, :find, :touch` +
`:save, :create, :update, :destroy`.

`packages/activerecord/src/callbacks.ts:82-206` **already exports** `beforeSave`,
`afterSave`, `beforeCreate`, … as free functions. They are shadowed by the
`Model` statics.

Below all of this, `callbacks.ts:196-537` is a second layer: 203 code lines of
`_registerCallbackOnProto`, `hasCallbackOnProto`, `skipCallbackOnProto`,
`snapshotCallbacksOnProto`, `restoreCallbacksOnProto`, `runAllCallbacks`,
`runBeforeCallbacksOnProto`, `runAfterCallbacksOnProto`,
`beforeOrAroundCallbackSources`, `_resolveCallbackObject`,
`_buildAfterModelIfConditions` — an adapter over
`packages/activesupport/src/callbacks.ts`, which is itself a **1,631-line
faithful port** of `ActiveSupport::Callbacks` (`Callback`, `CallbackChain`,
`CallbackSequence`, `Before`/`After`/`Around`, `set_callback`, `skip_callback`,
`reset_callbacks`, `run_callbacks`). Rails has no such adapter; `ActiveModel::
Callbacks` is 50 lines because `include ActiveSupport::Callbacks` does the work.

Convergence: `Base` calls `defineModelCallbacks` for its seven events, the
macros disappear from `model.ts`, and the adapter layer in
`activemodel/callbacks.ts` is replaced by direct `ActiveSupport::Callbacks`
calls. ~520 lines across the two files.

### F2 — an invented `DirtyTracker` beside a faithful `AttributeMutationTracker`

`packages/activemodel/src/attribute-mutation-tracker.ts` is one of the
package's 14 clean files: `AttributeMutationTracker` (`:43`),
`ForcedMutationTracker` (`:150`), `NullMutationTracker` (`:207`) — a
member-for-member port of `attribute_mutation_tracker.rb:7,91,156`.

`packages/activemodel/src/dirty.ts:116` defines a **second**, unrelated
`DirtyTracker` class, and `initInternals` (`dirty.ts:65`) installs it as
`this._dirty`. Its own JSDoc states the deviation outright: _"Trails
consolidates Rails' two mutation trackers into a single `DirtyTracker`."_

Rails' `Dirty` has no tracker of its own. Every reader is a one-line
delegation to `mutations_from_database` (`dirty.rb:286-368`), and
`changes_applied` (`:272-278`) is precisely the hand-off
`@mutations_before_last_save = mutations_from_database;
@mutations_from_database = nil` that the collapsed single tracker cannot
express. The collapse is why `dirty.ts` carries 102 lines with no counterpart
(`snapshot` `:415`, `restore` `:589`, `_restoreOne` `:612`,
`reinstateNewRecordChanges` `:503`, `attributeWritten` `:533`,
`redetectChanges` `:570`, `_isInPlaceMutableChange` `:383`,
`_hasInPlaceMutableChange` `:389`, `_deleteChange` `:399`, `_clearChanges`
`:405`) and why the 78 dirty lines in `model.ts` are wrappers around wrappers.

### F3 — `serialization.ts`: 228 lines of JSON coercion and dual sync/async return

`serialization.rb` is 43 code lines; `serialization.ts` is 407, of which only
76 map onto `serialization.rb` members. The residue:

- `coerceForJson` (`:608`) + `_coerceForJson` (`:618`) — 63 lines of recursive
  JSON coercion with cycle detection. Rails gets this from
  `ActiveSupport`'s `Object#as_json` (`core_ext/object/json.rb`), which trails
  **already ports** at `packages/activesupport/src/core-ext/object/json.ts`
  as the `Object`/`Hash`/`Array`/`Numeric`/`BigDecimal`/`Regexp`/… `asJson`
  dispatch.
- `thenableHash` (`:473`) + `asJsonThenable` (`:449`) + `isSerializableCollection`
  (`:542`) + `sendAssociation` (`:524`) — a `Proxy`-based value that is usable
  both synchronously and via `await`, 67 lines. This is the async-plumbing
  bucket; see Open questions.
- `normalizeIncludes` (`:732`) — 28 lines extracting what Rails does inline in
  three lines inside `serializable_add_includes`
  (`serialization.rb:187-189`: `includes = Hash[Array(includes).flat_map { … }]`).
  A decomposition deviation: Rails inlines it, so trails must inline it.
- `safeSet` (`:557`), `storeHasKey` (`:366`), `hasIncludes` (`:375`),
  `rubyArray` (`:719`) — prototype-pollution guards and Ruby-shim helpers with
  no counterpart.

### F4 — `attribute_set.rb` / `attribute_set/builder.rb`: a JS `Map` adapter over a Rails value object

`attribute-set.ts` carries 143 code lines that do map onto `attribute_set.rb`
and **124 that do not**: `get` (`:301`), `set` (`:307`), `has` (`:332`),
`entries` (`:442`), `forEach` (`:436`), `getAttribute` (`:63`), `isFrozen`
(`:286`), `assertNotFrozen` (`:290`), `narrowTo` (`:355`), `snapshotValues`
(`:382`), `resolveSnapshotValue` (`:401`), `cloneAttribute` (`:414`),
`overrideFromDatabase` (`:246`), `rebindFromDatabaseValue` (`:269`),
`forgetAttributeAssignment` (`:453`), `forgetAssignmentsBang` (`:470`).
`AttributeSet` in Rails exposes `[]`, `[]=`, `key?`, `keys`, `fetch_value`,
`write_from_user`, `write_cast_value`, `deep_dup` — all of which trails also
has, so the Map-shaped surface is a duplicate spelling, not a substitute.
`attribute_set/builder.ts` adds another 61 (`dupAttribute` `:30`,
`blockOrValue` `:157`, `cloneAttr` `:350`, `assignDefault` `:362`, `get`/`set`/
`has`).

### F5 — `type/decimal.ts`: hand-rolled BigDecimal arithmetic

`decimal.rb` is 59 code lines and does its work with Ruby's `BigDecimal`:
`BigDecimal(value, precision || BIGDECIMAL_PRECISION)`, `value.to_d`,
`apply_scale`. `decimal.ts` is 186, of which **143 have no counterpart**:
`splitDecimal` (`:276`), `roundHalfUpToScale` (`:315`),
`incrementDecimalDigits` (`:341`), `roundDecimalStringToSignificantDigits`
(`:229`), `rationalToSignificantDigits` (`:205`),
`roundFloatToSignificantDigits` (`:194`), `_castWithoutScale` (`:128`) —
significant-digit and half-up rounding implemented on decimal strings.

`packages/activesupport` already exports a `BigDecimal`, which `decimal.ts:1`
imports. This arithmetic is `BigDecimal`'s job (Ruby's `BigDecimal#round`,
`BigDecimal(x, ndigits)`), and it belongs behind that class, not in a type
caster.

### F6 — the remaining per-file residue

Each of these is a smaller instance of the same pattern; line counts are
no-Rails-counterpart code lines measured the same way.

| file                                          | residue | shape                                                                                                                                                                                                                                                          |
| --------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `attribute-methods.ts`                        | 124     | `ensureOwnPatterns`/`ensureOwnAliases` copy-on-write helpers (Rails: `class_attribute`), `defineDirtyAttributeMethods` (`:765`, 36L), `resolveAliasName{,In}` (`:814`, `:846`), `isDefinedByAClassBody` (`:676`), `extractParameters` (`:654`)                 |
| `type/helpers/accepts-multiparameter-time.ts` | 109     | `castFromMultiparameter` (`:110`, 69L), `isHash` (`:21`), `exactSecondsToNanoseconds` (`:49`)                                                                                                                                                                  |
| `attribute-registration.ts`                   | 66      | `pushPendingType`/`pushPendingDefault`/`pushPendingDecorator` (`:471`,`:485`,`:499`), `replayOwnPendingDecorators` (`:445`), `inDecoratorReplay` (`:393`), `registerWithSuperclass` (`:402`)                                                                   |
| `attributes.ts`                               | 57      | `setDefineMethodAttribute` (`:221`, 23L), `buildDefaultAttributes` (`:315`), `typeOptions` (`:296`)                                                                                                                                                            |
| `attribute-assignment.ts`                     | 54      | `isParamsLikeWrapper` (`:119`), `isHashLike` (`:189`), `typeNameForError` (`:195`), `findSetter` (`:233`), `assertHashAttributes` (`:11`,`:175`)                                                                                                               |
| `errors.ts`                                   | 54      | `mapWithDefault` (`:27`), plus a JS-collection facade `count`/`size`/`any`/`empty`/`clear`/`each`/`toArray`/`get`/`on`/`uniqBang` — Rails' `Errors` `include Enumerable` and `delegate :each, :clear, :empty?, :size, :uniq!` to `@errors` (`errors.rb:56-63`) |
| `naming.ts`                                   | 51      | `ModelName` constructor at 77 lines (`:259`) vs `naming.rb:32-53`, plus `equals` (`:142`), `compare` (`:157`), `sameSegments` (`:14`)                                                                                                                          |
| `error.ts`                                    | 42      | `optionsEqual` (`:46`, 32L), `equals` (`:306`), `dupWithBase` (`:334`)                                                                                                                                                                                         |
| `lint.ts`                                     | 42      | `withPatched` (`:174`, `:199`), `testErrors` (`:125`)                                                                                                                                                                                                          |
| `validator.ts`                                | 32      | `shouldValidate` (`:63`), `evaluateCondition` (`:55`), `filteredErrorOptions` (`:197`)                                                                                                                                                                         |
| `validations/numericality.ts`                 | 32      | `kernelFloat` (`:263`), `parseFloatRails` (`:531`), `isNumeric` (`:279`), `isSymbol` (`:284`)                                                                                                                                                                  |
| `validations/length.ts`                       | 11      | `resolveLengthOpt` (`:224`)                                                                                                                                                                                                                                    |
| `type/date-time.ts`                           | 9       | `_nsAtPrecision` (`:252`) — **already being deleted by open PR #6738**                                                                                                                                                                                         |

### F7 — the deviation registers

- **Call-set / call-argument baseline**: 54 rows across 20 shards in
  `scripts/api-compare/call-mismatches-exclude/activemodel/`, largest
  `attribute-set.json` (7), `attribute-methods.json` (7), `dirty.json` (6),
  `attribute-set/builder.json` (6), `secure-password.json` (4). Only 4 carry
  `kind: "args"`; the rest are call-set rows. All rows in `model.json`
  (`initialize` omits `assign_attributes`; `validates_each` omits
  `validates_with`) still carry the verbatim RFC 0047 seed reason. This is a
  small ledger and, as in RFC 0107, it is not the story — but the F1–F6 moves
  will strand rows, and each stranded row is deleted by hand (never reseeded)
  with `pnpm parity:api:calls:tighten <shard>` afterwards.
- **`@noRailsEquivalent`**: 192 tags in the package, 6 currently matched by
  `parity:api:extra`; 181 claim `PERMANENT`, 11 `CONVERGEABLE`. The 11
  CONVERGEABLE claims are in scope. The `PERMANENT` claims are re-read as part
  of the file's story, and a claim that is really "displaced surface" rather
  than a language shortcoming converges.
- **`@missingRailsCall`**: 1 in the package.
- **`arity-exclude.json`**: 0 activemodel rows — nothing to burn down.

### Interaction with in-flight work

`gh pr list` (2026-08-19) shows exactly one open PR touching
`packages/activemodel`: **#6738** (RFC 0112), which edits
`attribute-assignment.ts`, `model.ts`, `type/date-time.ts`,
`type/helpers/time-value.ts`. It deletes `_nsAtPrecision`, converges
`_assignAttribute` onto `attribute_assignment.rb:67-75`, and adds
`matchedAttributeMethod` + an `attribute=` alias to `Model`. Stories touching
`attribute-assignment.ts`, `type/date-time.ts` and the assignment slice of
`model.ts` are written against post-#6738 `main` and note it. No other
activemodel file is contended. A sibling agent is concurrently drafting an RFC
for `packages/activerecord/src/associations/collection-proxy.ts`; no story here
touches that file.

## Non-goals

- **Behavior or public-API change.** Every story is a refactor with the
  existing suites as the contract. Where a move changes _where_ a name is
  defined, the name and its call sites stay identical.
- **`packages/activerecord/src/associations/collection-proxy.ts`** — owned by a
  concurrent RFC.
- **Reseeding any baseline.** Rows shrink only as bodies converge; CLAUDE.md's
  hand-delete-then-`tighten` rule applies unchanged.
- **The `type/**` casters that already measure ≈1:1** (`type/value.rb`,
`type/boolean.rb`, `type/string.rb`, `type/integer.rb`, `type/float.rb`) —
  healthy, out of scope.
- **The 14 already-clean files.** They are the reference, not the work.
- **Rewriting the `validations/<kind>.rb` validator bodies.** Only the
  `validates_*_of` macro _placement_ moves; the validators themselves are in
  scope only where F6 names them.

## Alternatives considered

- **Leave `model.ts` alone and only fix the leaf files.** Rejected: 1,411 of
  the package's excess code lines are in `model.ts`, and every leaf file's
  story has to reason about which of its own members `model.ts` shadows. The
  redistribution is the unblock.
- **Move `model.ts`'s ActiveRecord surface into `activerecord` by re-exporting
  from `model.ts`.** Rejected: a re-export keeps the definition in the wrong
  package and keeps `parity:api:extra` scoring it as moved surface on
  `model.ts`. The bodies move.
- **Baseline the residue as `@noRailsEquivalent PERMANENT` and close.**
  Rejected on CLAUDE.md grounds — a deviation-convergence story never closes by
  writing a better justification, and 181 PERMANENT claims in one package is
  itself the smell this RFC exists to address.
- **One large `model.ts` PR.** Rejected: 1,411 code lines is 4–5x the PR LOC
  ceiling and the review-cycle data cited in CLAUDE.md puts a ≥700-LOC PR at
  13+ review rounds.

## Rollout

F0 is not a phase of its own — it is the idiom every other story is
expected to use. Five stories name it explicitly in their acceptance
criteria: `converge-attribute-methods-copy-on-write-and-alias-helpers`,
`converge-attribute-registration-pending-modification-helpers`,
`fan-out-model-validation-runner-surface-to-validations`,
`fan-out-model-attribute-methods-and-registration-surface` and
`converge-attributes-define-method-attribute-and-defaults`.

**Phase 1 — `model.ts` redistribution.** Nothing else can be reviewed locally
until the funnel is emptied, because every leaf file's members are shadowed by
a `Model` static. Each story moves one destination-file's worth of members and
touches `model.ts` plus that one destination — so they are _not_ parallel-safe
against each other on `model.ts`, and are sequenced. Order within the phase is
by blast radius, smallest first:

1. `delete-model-xml-serialization-and-nullify-blanks`
2. `move-ar-normalization-surface-out-of-model`
3. `move-ar-attribute-read-write-surface-out-of-model`
4. `move-ar-save-side-dirty-surface-out-of-model`
5. `retire-model-lifecycle-callback-macros-onto-define-model-callbacks`
6. `retire-model-transactional-and-find-callback-macros`
7. `retire-model-set-callback-skip-callback-run-callbacks-passthrough`
8. `fan-out-model-validates-macro-to-validations-validates`
9. `fan-out-model-validates-with-to-validations-with`
10. `fan-out-model-validation-runner-surface-to-validations`
11. `fan-out-model-validates-of-macros-to-helper-methods`
12. `fan-out-model-dirty-surface-to-dirty-ts`
13. `fan-out-model-attribute-methods-and-registration-surface`
14. `fan-out-model-serialization-conversion-access-naming-surface`

**Phase 2 — per-file convergence.** Non-overlapping files; these run in
parallel once Phase 1 is done.

- `converge-dirty-tracker-onto-rails-mutation-trackers`
- `retire-activemodel-callbacks-proto-adapter-onto-activesupport`
- `converge-serialization-json-coercion-onto-activesupport-as-json`
- `inline-serialization-normalize-includes-into-serializable-add-includes`
- `specify-serializable-hash-async-return-boundary` — survey/decision only
- `resolve-serialization-thenable-hash-async-return` _(blocked on 19 — see Open questions)_
- `retire-attribute-set-map-adapter-surface`
- `converge-attribute-set-builder-residue`
- `converge-attribute-methods-copy-on-write-and-alias-helpers`
- `converge-attribute-registration-pending-modification-helpers`
- `converge-attributes-define-method-attribute-and-defaults`
- `move-decimal-rounding-into-activesupport-bigdecimal`
- `converge-accepts-multiparameter-time-cast-from-multiparameter`
- `converge-errors-enumerable-delegation-onto-rails`
- `converge-error-options-equality-and-dup-with-base`
- `converge-model-name-constructor-and-comparable-surface`
- `converge-validator-condition-evaluation-onto-rails`
- `converge-numericality-and-length-parsing-residue`
- `converge-attribute-assignment-hash-guards`
- `converge-lint-with-patched-helpers`

**Phase 3 — ledger.**

- `burn-down-activemodel-call-mismatch-baseline-rows`

## Verification

Measured with the same tooling and the same code-line rule, off a fresh
`pnpm build && pnpm parity:api`:

- **Package ratio 2.51x → ≤ 1.85x** (the current repo-wide average). That is
  9,076 TS code lines → ≤ 6,700 against unchanged Ruby.
- **`model.ts` ≤ 200 code lines**, and every member it retains has a
  counterpart in `model.rb`, `api.rb`, or `access.rb` — the three files Rails'
  `ActiveModel::Model` is made of.
- **`pnpm parity:api:extra --package activemodel`: 147 novel / 200 moved →
  ≤ 40 novel / ≤ 30 moved**, with `model.ts` at 0/0.
- **`@noRailsEquivalent` PERMANENT claims 181 → ≤ 60**, CONVERGEABLE claims
  11 → 0.
- **The five hand-rolled copy-on-first-write helpers → 0**, replaced by
  `classAttribute()`; `extend()` call sites in activemodel **0 → ≥ 1**; the
  82 `.call(this, …)` thunks → ≤ 20.
- **`call-mismatches-exclude/activemodel` 54 rows → ≤ 20**, only-shrink at
  every step; `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green
  with no reseed on any PR.
- **`pnpm parity:api` and `pnpm parity:test` deltas non-negative on every
  story**, and the activemodel suites pass unchanged.

## Open questions

1. **Is `thenableHash` a genuine TypeScript shortcoming?** — **RESOLVED
   (2026-08-21, `specify-serializable-hash-async-return-boundary`): (a), with a
   documented exception for the `JSON.stringify` seam.**

   `serializableHash` / `asJson` return `Promise` unconditionally and every
   caller is converged, following RFC 0063's `isValid()` precedent — **except**
   `toJSON`, which cannot be converged and does not need to be.

   ### Call-site inventory (non-test, `packages/{activemodel,activerecord,actionview}`)

   | Call site                                                                                    | Can it `await`?                        | Cost of an unconditional `Promise`                                                                                                                       |
   | -------------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `activemodel/serialization.ts:39` `serializableHash` (definition)                            | n/a                                    | Body becomes `async`; the `sync` re-entry flag and both `thenableHash` arms (`:46`, `:51`) collapse into one straight-line `await preloadIncludes(...)`. |
   | `activemodel/serialization.ts:119,129` nested include recursion                              | yes (already inside an `async` helper) | `await` / `Promise.all` — `:119` already maps over `serializableHash`.                                                                                   |
   | `activemodel/serialization.ts:145` `SerializableHash` interface member                       | n/a                                    | Return type becomes `Promise<Record<string, unknown>>`.                                                                                                  |
   | `activemodel/serializers/json.ts:164` `serializableHash` (JSON mixin delegator)              | yes                                    | One `await`.                                                                                                                                             |
   | `activemodel/serializers/json.ts:85` `asJson`                                                | yes                                    | One `await`; `asJsonThenable` (`serialization.ts:449`) is deleted, its root-wrap `finalize` inlined.                                                     |
   | `activemodel/model.ts:2303` `Model#serializableHash`                                         | yes                                    | One `await`.                                                                                                                                             |
   | `activemodel/model.ts:2307` `Model#asJson`                                                   | yes                                    | One `await`.                                                                                                                                             |
   | `activerecord/serialization.ts:11` STI `except`-union wrapper                                | yes                                    | One `await` on the tail call.                                                                                                                            |
   | `activerecord/attribute-methods.ts:822` `serializableHash` forwarder                         | yes                                    | One `await`.                                                                                                                                             |
   | `activerecord/base.ts:4669` `serializableHash` static assignment                             | n/a                                    | Type only.                                                                                                                                               |
   | `activerecord/relation/delegation.ts:969,1101` `Relation#asJson`                             | yes — **already `async`**              | `RECORD_DELEGATES.asJson` maps records; becomes `Promise.all`. Net simplification: the relation half is already a promise.                               |
   | `activesupport/core-ext/object/json.ts:47` **`toJSON`**                                      | **NO**                                 | `JSON.stringify` invokes `toJSON(key)` and consumes the return value synchronously; there is no awaiting form.                                           |
   | `activerecord/token-for.ts:138`, `connection-adapters/{column,schema-cache,mysql/column}.ts` | n/a                                    | Different methods — activesupport's free `Object#as_json` and plain column `toJSON`. Unaffected.                                                         |

   `fromJson` (`json.ts:110`, `model.ts:2335`) is `JSON.parse` + `assignAttributes`
   and never touches associations; it stays synchronous and is out of scope.

   ### Why `toJSON` is not a counter-example

   `toJSON` is the only site that cannot await, and by construction it never
   needs to: it calls `this.asJson()` **with no arguments**
   (`core-ext/object/json.ts:55`), so `options.include` is always nil and the
   association-reading branch — the sole reason `thenableHash` exists — is
   unreachable. The async boundary is entirely inside the `include:`-bearing
   path, and the one sync-only caller never enters it.

   So `toJSON` keeps a synchronous path by calling the sync internal builder
   directly (today's `serializableHash(record, options, /* sync */ true)`),
   which is sound precisely because it passes no `include`. That is one narrow,
   provable seam with a Rails-shaped public surface around it, versus 67 lines
   of `Proxy` on the main path.

   ### Consequence

   `resolve-serialization-thenable-hash-async-return` is unblocked and set
   `ready`: it deletes `thenableHash` (`:473`), `asJsonThenable` (`:449`), the
   `sync` re-entry parameter's dual contract, and `isSerializableCollection` /
   `sendAssociation`'s thenable-specific handling, and converges the eleven
   awaitable call sites above.

2. **Where do the ActiveRecord bodies land — `activerecord`, or a
   `Model`-hosted mixin?** Stories 2–7 move bodies into
   `packages/activerecord/src/{normalization,callbacks,attribute-methods/*}.ts`,
   which all already exist and already export most of the names. The
   alternative is keeping them on `Model` behind an `Included<>` merge. The
   first matches Rails' module layout and is what the stories specify;
   flag now if the cross-package churn is unwanted.
3. **Does `Base` need `define_model_callbacks` at class-definition time or at
   first use?** Rails runs it at include time. JS has no `inherited` hook, and
   `model.ts:1453` `_ensureOwnValidators` already documents trails' deferred
   copy-on-first-write workaround for exactly this. Story 5 must state which
   it picks; the copy-on-write precedent is the likely answer.

## Changelog

- 2026-08-19: initial RFC
- 2026-08-19: add F0 — the `include()` / `extend()` / `[included]` /
  `classAttribute()` idiom activemodel never adopted; five story bodies
  updated to name it
