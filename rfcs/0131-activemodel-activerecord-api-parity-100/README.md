---
rfc: "0131-activemodel-activerecord-api-parity-100"
title: "Take activemodel and activerecord to 100% on parity:api, by porting what is absent and by teaching the TS extractor the codegen its Ruby twin already models"
status: draft
created: 2026-08-31
updated: 2026-08-31
owner: "@deanmarano"
packages:
  - activemodel
  - activerecord
clusters:
  - fidelity
  - tooling
related-rfcs:
  - "0119-connection-adapter-fidelity"
  - "0126-fidelity-tooling-continuation"
  - "0127-fidelity-tooling-signals-and-hygiene"
  - "0130-activerecord-extra-surface-receipt-burndown"
priority: 2
---

# RFC 0131 — activemodel and activerecord to 100% on `parity:api`

## Summary

Two packages carry the last method-coverage gap in the data layer. Measured on
this branch after a clean `pnpm build`:

| package      | methods           | files   | missing |
| ------------ | ----------------- | ------- | ------- |
| activemodel  | 737/754 (97.7%)   | 66/67   | 17      |
| activerecord | 6160/6362 (96.8%) | 280/281 | 202     |

219 missing methods. **17 of them are behavior trails does not have.**
The rest are the same three things over and over: a body that lives in the wrong
file, a body that lives under an invented name, or a body the TypeScript
extractor structurally cannot see because trails generates the member the way
Rails does and `extract-ts-api.ts` models none of trails' generators while
`extract-ruby-api.rb` models all of Ruby's.

This RFC closes all 219 and both unported files. It converges; nothing in it
is closed by a baseline row, an allowlist, or a `@noRailsEquivalent` receipt.

## Motivation

### Do not read 202 as 202 methods to write

That is the single most important sentence in this document, because the naive
reading sets an estimate an order of magnitude too high and points the work at
the wrong files.

The measurement is a **placement and visibility** measurement. `parity:api`
answers "what would a Rails developer find on opening the file that mirrors this
`.rb`" — deliberately (`compare.ts:4091-4098`). A method with a correct,
tested, shipping body scores as missing when it is declared in the mirroring
file only as a bodyless signature and nothing else accounts for it
(`declarationOnlyInFile`, `compare.ts:1374-1382`). 149 of the 219 —
**68%** — are exactly that: they arrive in the artifact's `declarationOnly`
column, not as absences. Counting the rest, only 17 methods are behavior
trails does not have.

So the taxonomy below is the deliverable's spine. Every story states which
bucket it is in, and the two buckets that dominate are not ports.

## Relationship to `burn-down-the-declaration-only-population` (RFC 0126)

That story is the tracking parent for the 275-method declaration-only column
PR #7159 first measured, and it says in as many words: "split it per file or
per cluster as the work is claimed, biggest file first." **RFC 0000 is that
split, for activemodel and activerecord.** The parent stays open for the other
eight packages (abstractcontroller 14, activesupport 12, actiondispatch 9,
trailties 7, arel 5, rack 5, actioncontroller 4, actionview 3) and is not
closed by this RFC.

Its per-package table needs one caveat before anyone sizes work from it. It
gives activerecord **202** declaration-only, which is exactly activerecord's
_total missing_ count — the two columns appear to have been transposed when it
was written on 2026-08-28. Measured here on 2026-08-31, activerecord's
`DeclOnly` is **135** of 202 missing; activemodel's is **14** of 17, which does
match. The 67 activerecord methods in the difference are the ones nothing
declares at all: `command_recorder.rb`'s 43, `join_dependency.rb`'s 3, and the
rest of bucket C. Nothing about the work changes — this RFC covers all 219
either way — but a claimer reading 202 as declaration-only would expect every
one of them to have a body already, and 67 of them do not.

One correction that RFC carries forward, because acting on the parent story's
text as written would send a claimer at the wrong code. It describes
`relation.ts`'s 82 as "the finder/calculation members … under RENAMED
identifiers". That is true of 25 of them and of the 2 spawn members, and it is
the premise of stories 7 and 8 here. It is **not** true of the other 55: those
are the `VALUE_METHODS` accessors, and `defineValueMethods`
(`relation/query-methods.ts:161-193`) already installs them faithfully with
Rails' `fetch` semantics and `assert_modifiable!` on write. Renaming there
would be rewriting a correct port; story 4 credits it instead.

## Design

### The taxonomy

#### Bucket A — extractor asymmetry (124 methods)

`extract-ruby-api.rb` models Ruby's metaprogramming: `attr_accessor`,
`class_attribute`, `cattr_accessor`, `delegate`, `define_method`,
`alias_method` (`extract-ruby-api.rb:877-1013`). It therefore credits Rails
for members no `def` in the file declares. `extract-ts-api.ts` models **none**
of the trails idioms that mirror those macros. The asymmetry is not neutral: it
charges trails for being faithful.

Three arms, each verified against the artifact:

**A1 — a bodied object-literal mixin module loses to a same-named bodyless
interface.** The arm that harvests `export const X = { method() {…} }` as a
module (`extract-ts-api.ts:827-850`) is gated on `isExported(node)` and bails
outright when a module or class of that name is already registered
(`:838`). Interfaces are harvested first (`:631`), so in
`activemodel/src/type/helpers/accepts-multiparameter-time.ts` the bodyless
`interface InstanceMethods` (`:5-12`) wins and the bodied
`const InstanceMethods` (`:32`) — which is also not exported — is never seen.
Rails' `AcceptsMultiparameterTime::InstanceMethods`
(`activemodel/lib/active_model/type/helpers/accepts_multiparameter_time.rb:6`)
is a public module, so the missing `export` is itself a fidelity miss.

**This was prototyped end to end before the RFC was written.** With the
precedence fixed and the const exported, activemodel went **737 → 742** and
that file went **1/6 → 6/6**. Reverting either half alone put it back to 737,
so both are load-bearing. That is the confirmation CLAUDE.md's "prototype the
credit mechanism on ONE small file" asks for, and it is why no story in this
RFC says "declare these" — a `declare` is precisely what the extractor refuses
to credit.

**A2 — `classAttribute()` is unmodelled.** Ruby `class_attribute :foo` emits
`foo`, `foo?` and `foo=`; the Ruby extractor emits all three
(`extract-ruby-api.rb:926`, `:994`). trails' twin is
`classAttribute.call(base, "foo", …)` from `@blazetrails/activesupport`
(`packages/activesupport/src/class-attribute.ts`) inside an `included` block —
the shape CLAUDE.md names as the settled port of `included do class_attribute
:foo end`. It installs a real accessor pair at load time, and the extractor
sees nothing. 21 methods across four files, all four scoring as
declaration-only:

| file                                                     | methods | call site                       |
| -------------------------------------------------------- | ------- | ------------------------------- |
| activemodel `attribute_methods.rb`                       | 6       | `attribute-methods.ts:510`      |
| activemodel `validations.rb`                             | 3       | `validations.ts:75`             |
| activerecord `attribute_methods/time_zone_conversion.rb` | 6       | `time-zone-conversion.ts:29,33` |
| activerecord `model_schema.rb`                           | 6       | `model-schema.ts`               |

Ruby's three names all map to one TS name (`attribute_aliases`,
`attribute_aliases?` and `attribute_aliases=` all resolve to
`attributeAliases` in the artifact), so one harvested member credits the whole
triple. The prompt's guess that this is one story, not five, is right.

**A3 — a generated-method loop is unmodelled.** `migration/command_recorder.rb`
is the second-largest single gap at 43, and trails' port is the faithful one.
Rails writes `ReversibleAndIrreversibleMethods.each do |method| class_eval …
def #{method}(*args, &block); record(:"#{method}", args, &block); end … end`
(`command_recorder.rb:125-132`). trails writes the same loop over
`REVERSIBLE_AND_IRREVERSIBLE_METHODS` onto `CommandRecorder.prototype`
(`packages/activerecord/src/migration/command-recorder.ts:674-731`). Ruby's
extractor credits the macro; TypeScript's cannot see a prototype assignment.

**Hand-writing 43 methods here would make the port less faithful, not more, and
no story in this RFC proposes it.** The fix is the extractor arm.

**A4 — a `defineProperty` loop is unmodelled.** The same blind spot in its
other syntactic form, and the biggest single block in the RFC: 55 of
`relation.rb`'s 82 are the `Relation::VALUE_METHODS` accessors. Rails generates
them in `class_eval` from the name list
(`relation/query_methods.rb:162-186`, list at `relation.rb:54-65`,
`alias extensions extending_values` at `query_methods.rb:185`) — reader
`@values.fetch(:name, DEFAULT)`, writer `assert_modifiable!` then store.

trails already ports that generator faithfully: `defineValueMethods`
(`relation/query-methods.ts:161-193`) walks the same three lists, picks the
same three suffixes and defaults, and installs an `Object.defineProperty` pair
whose getter is `name in values ? values[name] : defaultValue()` — Ruby's
`fetch`, not `??` — and whose setter calls `assertModifiableBang` (`:1396`).
`extensions` is installed the same way at `:195`.

This one is worth stating explicitly because the plain reading of the artifact
gets it backwards. The host-interface entries that look like plain mutable
fields (`relation/query-methods.ts:214-244`, `relation.ts:1855-1890`) are the
_types_ of accessors that already exist; there is no behavioral divergence here
to converge, and a story that "ported" these would be rewriting a correct port.

#### Bucket B — misplacement and invented names (78 methods)

Real trails-source work, no tooling. The body exists, ships, and is tested; it
is in the wrong file or under a name Rails does not use. Both are defects
CONTRIBUTING.md names explicitly ("correct behavior under a name, signature, or
structure Rails doesn't have is also a defect, because the next agent to port a
caller won't find it").

The dominant instance is a **`perform*` prefix on every relation mixin
entry point**. `relation/finder-methods.ts:634-660` maps `find: performFind`,
`take: performTake`, `first: performFirst` …; `relation/spawn-methods.ts:64-70`
maps `spawn: performSpawn`, `merge: performMerge`. The exported function name is
`performFind`, so the mixin-credit arm
(`mixinMethodCreditedToOwnFile`, `compare.ts:2349-2366`) looks for `find` in
`relation/finder-methods.ts`, does not find it, and reports a miss on
`relation.rb`.

The counter-example in the same file is the proof: `exists`, `include` and
`member` are exported under their Rails names, and all three credit **today**,
as moves, with no tooling change at all. The fix is the rename, and it also
retires ~32 novel names from `parity:api:extra` (RFC 0130's population).
25 of the renames are on `relation.rb`, 2 more (`spawn`, `merge`) reach it
through `spawn_methods.rb`, and 5 land on `relation/calculations.rb`.

The second instance is adapter statements sitting one file off Rails, in both
directions at once:

- `connection_adapters/postgresql/database_statements.rb` — 12 missing.
  Rails defines `explain`, `execute`, `exec_insert`, `begin_db_transaction`,
  `set_constraints` and the rest in
  `postgresql/database_statements.rb:7-195`; trails puts the bodies on
  `postgresql-adapter.ts` (`:885` `execute`, `:1320` `explain`) and leaves
  bodyless signatures in `postgresql/database-statements.ts:18-40`.
- `connection_adapters/postgresql_adapter.rb` — 7 missing, the opposite way.
  Rails defines `enum_types`, `create_enum`, `drop_enum`, `rename_enum`,
  `rename_enum_value` and `column_definitions` in
  `postgresql_adapter.rb:518-1034`; trails puts them in
  `postgresql/schema-statements.ts:1270`.

##### Bucket B's file-parity half: the two `gem_version.rb`

Both packages sit at one file short — activemodel 66/67, activerecord 280/281 —
and it is `gem_version.rb` in each. **Its 2 methods are part of bucket B's 78,
not a fourth category** — the fix is a move, the same as every other row in
this bucket. It is in scope, and it is not an `unported-files` row.

The surface exists: `gemVersion()` ships in both
packages, in `deprecator.ts:15` / `deprecator.ts:13`, which is not the file
`gem_version.rb` mirrors. activesupport already does it correctly
(`activesupport/src/gem-version.ts:25`), so the fix is one file per package
copied from a working sibling. CONTRIBUTING.md's rule applies exactly: the only
admissible reason for an unported-files row is that the surface does not exist
and is not intended to, and here it exists.

These are the only two methods in the RFC that also move a `files:` count, which
is why they get their own heading — but they are counted once, in bucket B.

#### Bucket C — genuine ports (17 methods)

Behavior that is not in trails at all:

| file                                    | methods                                                                                                                                        |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `associations/join_dependency.rb`       | `column_aliases`, `node`, `node=`                                                                                                              |
| `associations/preloader/association.rb` | `LoaderRecords`: `keys_to_load`, `already_loaded_records_by_key`, `populate_keys_to_load_and_already_loaded_records`, `already_loaded_records` |
| `encryption/properties.rb`              | `encoding`, `encoding=`                                                                                                                        |
| `associations/preloader/batch.rb`       | `loaders`                                                                                                                                      |
| `insert_all.rb`                         | `columns_list`, `format_columns`, `quote_columns`                                                                                              |
| `base.rb`                               | `db_warnings_ignore`, `db_warnings_ignore=`                                                                                                    |
| activemodel `errors.rb`                 | `[]` (→ `get`)                                                                                                                                 |
| activemodel `attributes.rb`             | `initialize` (→ `constructor`)                                                                                                                 |

`db_warnings_ignore` is a borderline case kept here deliberately: the value
exists, on a trails-invented `ar-config.ts:174` config object rather than as a
the module accessor `active_record.rb:260-263` declares, so the story both
ports the seat and deletes the invention.

### Order

Bucket A first, and specifically A1 first, because A1's extractor change is the
one already proven to move a number and because every later story is measured
against the artifact it produces. A2 and A3 are independent of A1 and of each
other and can run in parallel.

Bucket B and C stories then run independently, one Ruby file (or one shared
mechanism) each. Only three dependency edges exist, and none of them is
logical sequencing — two are file-overlap (stories 9/10 both edit
`postgresql-adapter.ts`; stories 5/12 both edit `deprecator.ts`) and one is a
credit prerequisite (story 18 replaces five hand-written accessor pairs with
Rails' loop, which regresses the file unless story 4 has landed).

### What is out of bounds

Stated once, for every story:

- **No `declare`, no bodyless signature, as a fix.** The extractor refuses to
  credit one on purpose. A story whose diff is a type declaration has not
  moved the number and has not converged anything.
- **No baseline row, no allowlist widening, no `@noRailsEquivalent` receipt**
  as a way to make a count move. Renames in this RFC _lower_
  `parity:api:extra`; none of them may raise a mark.
- **No hand-expansion of a faithful generator.** A3's 43 and A2's 21 are
  generated in trails because they are generated in Rails.
- **Names come from `docs/ruby-ts-conventions.md`.** Every rename in bucket B
  is to the name that table produces, not to a name that happens to credit.

### Per-story gate commands

`pnpm build` first — `parity:api` refuses a stale build and
`API_COMPARE_FORCE=1` does not override it — then
`API_COMPARE_FORCE=1 pnpm parity:api --package <pkg>`, reading the per-file row
and the package total. Touching a ported body also means `pnpm parity:api:calls`
and `pnpm parity:api:calls:args`; touching a signature also means
`pnpm parity:api:params`; adding any public name also means
`pnpm parity:api:extra:gate`.

## Rollout

19 stories, 202 activerecord methods and 17 activemodel methods, every one
accounted for exactly once.

| #   | story                                                            | bucket | methods      | est-loc | deps |
| --- | ---------------------------------------------------------------- | ------ | ------------ | ------- | ---- |
| 1   | `credit-bodied-object-literal-mixin-modules`                     | A1     | 5 am         | 130     | —    |
| 2   | `credit-classattribute-generated-accessors`                      | A2     | 9 am + 12 ar | 240     | —    |
| 3   | `credit-prototype-loop-generated-methods`                        | A3     | 43 ar        | 220     | —    |
| 4   | `credit-defineproperty-loop-generated-accessors`                 | A4     | 55 ar        | 240     | —    |
| 5   | `port-gem-version-files`                                         | B      | 1 am + 1 ar  | 90      | —    |
| 6   | `converge-activemodel-errors-index-and-attributes-constructor`   | C      | 2 am         | 170     | —    |
| 7   | `rename-finder-methods-to-rails-names`                           | B      | 25 ar        | 300     | —    |
| 8   | `rename-spawn-and-calculation-methods-to-rails-names`            | B      | 7 ar         | 180     | —    |
| 9   | `move-postgresql-database-statements-to-their-rails-file`        | B      | 12 ar        | 340     | —    |
| 10  | `move-postgresql-enum-ddl-back-to-postgresql-adapter`            | B      | 7 ar         | 300     | 9    |
| 11  | `port-abstract-database-statements-transaction-and-result-seats` | B      | 7 ar         | 320     | —    |
| 12  | `move-migration-proxy-into-migration-file`                       | B      | 6 ar         | 200     | 5    |
| 13  | `port-adapter-statement-pool-and-transaction-seats`              | B      | 5 ar         | 240     | —    |
| 14  | `converge-activerecord-single-method-files`                      | B      | 7 ar         | 280     | —    |
| 15  | `port-join-dependency-column-aliases-and-table-node`             | C      | 3 ar         | 220     | —    |
| 16  | `port-preloader-loader-records`                                  | C      | 5 ar         | 300     | —    |
| 17  | `port-insert-all-column-formatting-helpers`                      | C      | 3 ar         | 190     | —    |
| 18  | `port-encryption-properties-encoding-accessor`                   | C      | 2 ar         | 160     | 4    |
| 19  | `converge-db-warnings-ignore-onto-its-rails-seat`                | C      | 2 ar         | 170     | —    |

activemodel closes on stories 1, 2, 5 and 6 — four stories, 17 methods, one
file. Everything else is activerecord.

Only three dependency edges exist, all file-overlap rather than logical:
10 → 9 and 12 → 5 share a file with their parent, and 18 → 4 needs the
`defineProperty` credit arm before it can replace five hand-written accessor
pairs with Rails' loop without regressing the file.

### Phases

Phase 1 is the only ordering that matters. Everything after it is
parallelisable except where the three dependency edges say otherwise, so the
phase numbers below are a claim order, not a gate.

1. Phase 1 — `credit-bodied-object-literal-mixin-modules`. It is the proven
   mechanism; every later story reads the artifact it produces.
2. Phase 2 — the other three credit arms, in parallel:
   `credit-classattribute-generated-accessors`,
   `credit-prototype-loop-generated-methods`,
   `credit-defineproperty-loop-generated-accessors`. 119 methods, no source
   change in `packages/` beyond one `export`.
3. Phase 3 — activemodel closes: `port-gem-version-files`,
   `converge-activemodel-errors-index-and-attributes-constructor`. The package
   reaches 754/754 and 67/67 here, months before activerecord does, which is
   the point of running it early.
4. Phase 4 — the renames, largest first:
   `rename-finder-methods-to-rails-names`,
   `rename-spawn-and-calculation-methods-to-rails-names`. These also retire
   ~32 names from RFC 0130's novel population.
5. Phase 5 — the adapter moves, ordered by their file overlap:
   `move-postgresql-database-statements-to-their-rails-file`, then
   `move-postgresql-enum-ddl-back-to-postgresql-adapter`; alongside them
   `port-abstract-database-statements-transaction-and-result-seats` and
   `port-adapter-statement-pool-and-transaction-seats`.
6. Phase 6 — the remaining moves:
   `move-migration-proxy-into-migration-file` (after phase 3's gem-version
   story vacates `deprecator.ts`),
   `converge-activerecord-single-method-files`.
7. Phase 7 — the genuine ports, in any order:
   `port-join-dependency-column-aliases-and-table-node`,
   `port-preloader-loader-records`,
   `port-insert-all-column-formatting-helpers`,
   `port-encryption-properties-encoding-accessor` (after phase 2's
   `defineProperty` arm), `converge-db-warnings-ignore-onto-its-rails-seat`.

## Non-goals

- **The other eight packages' declaration-only rows.** 59 of RFC 0126's 275
  live outside these two (abstractcontroller 14, activesupport 12,
  actiondispatch 9, trailties 7, arel 5, rack 5, actioncontroller 4,
  actionview 3). The credit arms this RFC lands will move some of them for
  free, and that is reported per story, but chasing the remainder belongs to
  the parent story.
- **`parity:test`, assertions, and arity.** 100% here is method-name coverage
  in the two packages. CONTRIBUTING.md's "What 100% test compare means" is a
  separate, stronger claim with its own gates; nothing in this RFC advances it.
- **RFC 0130's activerecord receipt burndown.** The renames lower its `novel`
  count as a side effect and each story reports the delta, but this RFC does
  not enrol activerecord in tagged-only mode or write a single receipt.
- **Widening `GATED_PACKAGES` or enrolling activemodel anywhere.** Reaching
  100% is not an argument for changing what is gated; that is RFC 0120's
  decision to make on its own evidence.
- **Body-pinning the converged pairs.** CONTRIBUTING.md asks a convergence
  story to `--pin` what it verified, and the bucket-B and bucket-C stories
  should. The bucket-A stories verify nothing about a body and must not pin.

## Alternatives considered

- **Port the 149 declaration-only members by hand into their mirroring files.**
  This is the reading the raw count invites, and for 124 of them it means
  deleting a faithful port of a Rails generator and replacing it with the
  hand-expansion Rails itself declined to write. `command_recorder.rb` is the
  clearest case: 43 hand-written methods where Rails has a six-line loop and
  trails already has its twin. Rejected as a fidelity regression bought with
  a metric.
- **Leave the generated surface uncounted and lower the denominator.** An
  `unported-files`-style exclusion, or a `SKIP_GROUPS` entry per generated
  name. Rejected on CONTRIBUTING.md's rule — the only admissible reason is that
  the surface does not exist and is not intended to, and every one of these
  surfaces ships. It would also make the two extractors disagree permanently
  about what a generator produces, which is the defect, not the fix.
- **Fix the asymmetry from the Ruby side — stop crediting `class_attribute`
  and friends.** Symmetric, and much smaller. Rejected because it lowers the
  Rails denominator to match a TypeScript limitation, so every package's
  coverage number would improve without a line of trails changing. The
  denominator is Rails' surface; it does not get to shrink.
- **One story per Ruby file, uniformly.** Would give ~28 stories, several of
  them one-line diffs paying a full CI round each. The 12 single-method files
  are grouped into two stories instead, and the four credit arms are split by
  syntactic form rather than by file because each needs its own recognizer and
  its own negative tests.
- **A single "extractor codegen parity" story covering all four arms.** ~830
  est-loc against a 700 ceiling, four independent recognizers and four sets of
  negative tests in one review. Split.

## Verification

The RFC is done when all of the following hold, measured after `pnpm build`
with `API_COMPARE_FORCE=1 pnpm parity:api`:

- **activemodel — 754/754 methods (100%), 67/67 files**, from 737/754 and 66/67
  measured 2026-08-31.
- **activerecord — 6362/6362 methods (100%), 281/281 files**, from 6160/6362
  and 280/281 measured 2026-08-31.
- The `DeclOnly` column reports **0** for both packages, down from 14
  (activemodel) and 135 (activerecord) measured 2026-08-31.
- `pnpm parity:api:extra --package activerecord` reports at least **32** fewer
  novel names than at RFC start, and
  `scripts/api-compare/extra-surface-mark.json` has moved only via
  `parity:api:extra:tighten`.
- No row was added to any `call-mismatches-exclude/` shard, to
  `arity-exclude.json`, to `param-name-mark.json`, or to
  `scripts/parity/unported-files/`, and no `@noRailsEquivalent` or
  `@missingRailsCall` tag was written to close a story.
- Each of the four credit arms ships negative tests: a shape the arm must not
  credit, asserted to credit nothing. A too-generous arm invents coverage
  silently across every package, which is the one way this RFC could make the
  number lie.

## Open questions

1. **Do the four credit arms belong in this RFC or in 0126/0127?** They are
   extractor work, they benefit eight other packages, and RFC 0127 owns
   fidelity-tooling signals. Recommendation: keep them here, as RFC 0130 does
   with its own `define_model_callbacks` credit story, because this burndown is
   what motivates and sizes them — but each carries `packages:` naming only the
   packages whose numbers it moves, so the tooling RFCs' owners see them in
   `tasks touching scripts/api-compare/`.
2. **Should `defineValueMethods` keep its `@noRailsEquivalent PERMANENT`
   receipt once its output is credited?** The function is a real extra name
   with no Ruby counterpart — Rails has a bare `class_eval` loop, not a helper
   — so the receipt still reads true. Recommendation: keep it, and have story 4
   confirm rather than assume; if crediting the loop's output also credits the
   installer, the receipt goes stale and the `parity:api:extra` stale-tag arm
   will say so.
3. **Does `scoping.rb`'s `ScopeRegistry` want its own file?** Its two other
   members already credit as moves to `base.ts`, so `converge-activerecord-
single-method-files` can close the row either by moving the class to
   `scoping.ts` or by leaving it and adding the constructor where it is.
   Recommendation: move it — a move that leaves two members credited by the
   misplaced-cluster fallback is a weaker outcome than one that puts the class
   where Rails has it. Deferred to that story's author, who will have the file
   open.

## Changelog

- 2026-08-31: initial RFC
