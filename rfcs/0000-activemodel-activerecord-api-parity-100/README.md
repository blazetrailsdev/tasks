---
rfc: "0000-activemodel-activerecord-api-parity-100"
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

# RFC 0000 — activemodel and activerecord to 100% on `parity:api`

## Summary

Two packages carry the last method-coverage gap in the data layer. Measured on
this branch after a clean `pnpm build`:

| package | methods | files | missing |
| --- | --- | --- | --- |
| activemodel | 737/754 (97.7%) | 66/67 | 17 |
| activerecord | 6160/6362 (96.8%) | 280/281 | 202 |

219 missing methods. **Fewer than 15 of them are behavior trails does not have.**
The rest are the same three things over and over: a body that lives in the wrong
file, a body that lives under an invented name, or a body the TypeScript
extractor structurally cannot see because trails generates the member the way
Rails does and `extract-ts-api.ts` models none of trails' generators while
`extract-ruby-api.rb` models all of Ruby's.

This RFC closes all 219 and both unported files. It converges; nothing in it
is closed by a baseline row, an allowlist, or a `@noRailsEquivalent` receipt.

## Do not read 202 as 202 methods to write

That is the single most important sentence in this document, because the naive
reading sets an estimate an order of magnitude too high and points the work at
the wrong files.

The measurement is a **placement and visibility** measurement. `parity:api`
answers "what would a Rails developer find on opening the file that mirrors this
`.rb`" — deliberately (`compare.ts:4091-4098`). A method with a correct,
tested, shipping body scores as missing when it is declared in the mirroring
file only as a bodyless signature and nothing else accounts for it
(`declarationOnlyInFile`, `compare.ts:1374-1382`). 168 of the 219 —
**77%** — are exactly that: they arrive in the artifact's `declarationOnly`
column, not as absences.

So the taxonomy below is the deliverable's spine. Every story states which
bucket it is in, and the two buckets that dominate are not ports.

## The taxonomy

### Bucket A — extractor asymmetry (69 methods)

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

| file | methods | call site |
| --- | --- | --- |
| activemodel `attribute_methods.rb` | 6 | `attribute-methods.ts:510` |
| activemodel `validations.rb` | 3 | `validations.ts:75` |
| activerecord `attribute_methods/time_zone_conversion.rb` | 6 | `time-zone-conversion.ts:29,33` |
| activerecord `model_schema.rb` | 6 | `model-schema.ts` |

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

### Bucket B — misplacement and invented names (about 135 methods)

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
retires ~34 novel names from `parity:api:extra` (RFC 0130's population).

The second instance is the `Relation::VALUE_METHODS` surface — 55 of
`relation.rb`'s 82. Rails generates a reader and a writer per value
(`relation/query_methods.rb:162-186`); the reader is
`@values.fetch(:name, DEFAULT)` and the writer calls `assert_modifiable!`
before storing. trails models each as a plain mutable field on a host interface
(`relation/query-methods.ts:214-244`, `relation.ts:1855-1890`) assigned
directly (`query-methods.ts:1087`). That is not only invisible to the
extractor; **it is a behavioral divergence** — every write currently skips
`assert_modifiable!`, and `fetch` with a stored `nil` is not `??` (CLAUDE.md,
"`fetch` vs `??`"). This bucket's largest story is therefore also a real bug
fix.

The third instance is adapter statements sitting one file off Rails, in both
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

### Bucket C — genuine ports (13 methods)

Behavior that is not in trails at all:

| file | methods |
| --- | --- |
| `associations/join_dependency.rb` | `column_aliases`, `node`, `node=` |
| `associations/preloader/association.rb` | `LoaderRecords`: `keys_to_load`, `already_loaded_records_by_key`, `populate_keys_to_load_and_already_loaded_records`, `already_loaded_records` |
| `encryption/properties.rb` | `encoding`, `encoding=` |
| `insert_all.rb` | `format_columns`, `quote_columns` |
| `base.rb` | `db_warnings_ignore`, `db_warnings_ignore=` |

`db_warnings_ignore` is a borderline case kept here deliberately: the value
exists, on a trails-invented `ar-config.ts:174` config object rather than as a
`class_attribute` on `Base` where `base.rb:352` puts it, so the story both
ports the seat and deletes the invention.

### The two unported files: `gem_version.rb`

Both packages sit at one file short — activemodel 66/67, activerecord 280/281 —
and it is `gem_version.rb` in each. **It is in scope, and it is not an
`unported-files` row.** The surface exists: `gemVersion()` ships in both
packages, in `deprecator.ts:15` / `deprecator.ts:13`, which is not the file
`gem_version.rb` mirrors. activesupport already does it correctly
(`activesupport/src/gem-version.ts:25`), so the fix is one file per package
copied from a working sibling. CONTRIBUTING.md's rule applies exactly: the only
admissible reason for an unported-files row is that the surface does not exist
and is not intended to, and here it exists.

## Design

### Order

Bucket A first, and specifically A1 first, because A1's extractor change is the
one already proven to move a number and because every later story is measured
against the artifact it produces. A2 and A3 are independent of A1 and of each
other and can run in parallel.

Bucket B and C stories then run independently, one Ruby file (or one shared
mechanism) each. The only intra-bucket dependency is inside `relation.rb`: the
`VALUE_METHODS` work is split in two, and the second half depends on the first
because both edit the same accessor block.

### What is out of bounds

Stated once, for every story:

- **No `declare`, no bodyless signature, as a fix.** The extractor refuses to
  credit one on purpose. A story whose diff is a type declaration has not
  moved the number and has not converged anything.
- **No baseline row, no allowlist widening, no `@noRailsEquivalent` receipt**
  as a way to make a count move. Renames in this RFC *lower*
  `parity:api:extra`; none of them may raise a mark.
- **No hand-expansion of a faithful generator.** A3's 43 and A2's 21 are
  generated in trails because they are generated in Rails.
- **Names come from `docs/ruby-ts-conventions.md`.** Every rename in bucket B
  is to the name that table produces, not to a name that happens to credit.

### Verification each story runs

`pnpm build` first — `parity:api` refuses a stale build and
`API_COMPARE_FORCE=1` does not override it — then
`API_COMPARE_FORCE=1 pnpm parity:api --package <pkg>`, reading the per-file row
and the package total. Touching a ported body also means `pnpm parity:api:calls`
and `pnpm parity:api:calls:args`; touching a signature also means
`pnpm parity:api:params`; adding any public name also means
`pnpm parity:api:extra:gate`.

## Acceptance

- activemodel: 754/754 methods, 67/67 files.
- activerecord: 6362/6362 methods, 281/281 files.
- `scripts/api-compare/extra-surface-mark.json` moves only via `:tighten`, and
  activerecord's `novel` is lower than it starts by at least the ~34 `perform*`
  names.
- No new row in any `call-mismatches-exclude/` shard, `arity-exclude.json`, or
  `unported-files/`, and no new `@noRailsEquivalent`.
