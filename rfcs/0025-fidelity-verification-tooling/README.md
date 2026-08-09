---
rfc: "0025-fidelity-verification-tooling"
title: "Fidelity verification tooling — options-key/constants/deprecation parity, error-class + raw-SQL lint rules"
status: postponed
created: 2026-06-12
updated: 2026-08-08
owner: "@deanmarano"
packages:
  - activerecord
  - arel
clusters:
  - api-compare
  - lint
priority: 2
---

# RFC 0025 — Fidelity verification tooling

## Summary

The port's existing verification toolchain covers API **surface**
(`api:compare`, 4951/4952 at 100%), naming/structure (generated ESLint
baselines), behavior (`test:compare`, 92.4%), and output (`parity:schema` /
`parity:query`). What it does NOT measure: **option-hash keys** (the biggest
remaining Ruby-API dimension), **error-class identity**, **literal
constants/defaults**, **deprecation status**, and the arel-only SQL rule that
exists only as CONTRIBUTING prose. This RFC adds five bounded tools, each
following an existing, proven pattern in the trails repo (generated-manifest
ESLint rule, api:compare sub-report) so every story is mechanical to
implement and ratchets via a baseline that only shrinks.

Source analysis: `trails/docs/activerecord/port-fidelity-analysis-2026-06-11.md`.

## Motivation

Concrete divergences the current toolchain cannot see:

- A `hasMany` options type missing a key Rails accepts (`inverse_of`-class
  gaps) passes api:compare (name + arity match) and stays invisible until a
  ported test happens to exercise it.
- Users `rescue ActiveRecord::RecordNotFound`; nothing verifies our
  `errors.ts` hierarchy matches Rails' error classes or that Rails-mirroring
  code throws ported error classes instead of bare `Error`.
- CONTRIBUTING bans raw SQL strings outside adapters; RFC 0022 exists because
  string-assembled SQL crept in anyway — the ban is unenforced prose.
- Literal defaults (batch sizes, lock names) and `@deprecated` status can
  silently differ — `extract-ruby-api.rb` already parses signatures, so
  defaults are in reach.

All five tools are **report-first or baseline-ratcheted**: none can break CI
on day one; each starts with a generated exclude baseline (the
`require-canonical-schema` shape) or a JSON report, and tightens from there.

## Design

Two clusters. Every story names the exact pattern file to copy.

### Cluster `api-compare` — extend the extraction/compare pipeline

The pipeline: `scripts/api-compare/extract-ruby-api.rb` (Ripper-based, emits
`output/rails-api.json`) + `extract-ts-api.ts` (TS compiler API, emits
`output/ts-api.json`) + `compare.ts` / `arity.ts` (matching + sub-reports).
The **arity checker** (`arity.ts` → `output/arity-mismatches.json`, surfaced
in the `run.sh` summary line) is the pattern to clone: a post-match
sub-report over already-matched method pairs, advisory output file, count in
the summary.

- **Options-key parity** (`options-kwargs-key-parity`): harvest accepted
  option keys per Ruby method (explicit `valid_options` arrays where they
  exist; `options[:foo]` / `options.fetch(:foo)` / `options.key?(:foo)`
  accesses in the method body via Ripper); harvest the corresponding TS
  options-interface keys from the parameter type AST; diff per matched pair.
- **Constants/defaults parity** (`constants-defaults-parity`): the Ruby
  extractor already captures parameter signatures (see `rubySig` in
  arity-mismatches.json); extend both extractors to record **literal**
  default values (number/string/symbol/true/false/nil) and module-level
  constants, compare literals after symbol→string normalization.

### Cluster `lint` — generated-manifest ESLint rules

The pattern: `eslint/rails-private-jsdoc.mjs` + its generated
`eslint/rails-private-methods.json` manifest (written by api:compare), with a
colocated `*.test.mjs`, registered in `eslint.config.mjs` under the
`blazetrails` plugin (see L106–130) and scoped per file-glob. Ratchet
baselines follow `eslint/require-canonical-schema-exclude.json`.

- **Error-class parity** (`error-class-parity-lint`): manifest of Rails error
  classes harvested from the vendored source (pattern:
  `scripts/build-rails-privates-manifest.ts`); rule (a) asserts every
  manifest class has a TS counterpart with matching parent, (b) bans
  `throw new Error(` in Rails-mirroring `src/` files.
- **No raw SQL** (`no-raw-sql-lint`): flag SQL-keyword string/template
  literals passed to execution methods outside `connection-adapters/` and
  `tasks/`, with a generated exclude baseline for legitimate admin-SQL sites.
- **Deprecation parity** (`deprecation-parity-lint`): manifest of
  `deprecator`-wrapped Rails methods; rule requires `@deprecated` JSDoc on
  the TS counterpart (autofixable, like rails-private-jsdoc).

## Call-argument fidelity (`api:calls:args`) — spike findings, 2026-08-08

Investigation only; no gate was built. The question: `api:calls`
(`scripts/api-compare/lint-call-mismatches.ts`) compares the **set of call
names** a Rails body makes against its port's, and RFC 0084's own defect-shape
table lists "wrong values / literals" as **blind**. A port can call `where`
where Rails calls `where`, pass a completely different argument list, and the
gate stays green. Can a fourth dimension — call **arguments** — be extracted and
compared at acceptable signal-to-noise?

**Verdict: yes, ship a narrowed version.** Measured signal is 77% genuine
divergence over 102 hand-classified rows, nowhere near the >90%-noise NO
threshold. The dimension also finds a defect class nothing else in the
toolchain can see (below).

### 1. Extractor feasibility

**Ruby — yes.** `walk_for_calls` (`extract-ruby-api.rb:2291`) already visits
every `:fcall` / `:vcall` / `:call` / `:command` / `:command_call` / `:super`
node and discards everything but the name. The argument node is a sibling
already in hand at each of those sites: `node[2]` for `:command` and
`:method_add_arg`, `node[4]` for `:command_call`, `node[1]` for `:super`. A
Ripper-only prototype emitted argument lists for all of them.

Extractable, with fidelity:

| Argument form                              | Extractable                         | Descriptor                                                                               |
| ------------------------------------------ | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| Bare identifier / ivar (`o`, `@collector`) | yes                                 | `id:<name>`                                                                              |
| Numeric / string / boolean / nil literal   | yes                                 | `num:` / `str:` / `bool:` / `nil`                                                        |
| Symbol (`:dump`)                           | yes                                 | `sym:<name>`                                                                             |
| Constant (`Nodes::Grouping`)               | yes                                 | `const:<short>`                                                                          |
| Nested call (`o.relation`, `foo(x)`)       | yes, name only                      | `call:<name>`                                                                            |
| Keyword args / trailing hash               | yes, keys + value descriptors       | `kwargs{k=<desc>,…}`                                                                     |
| `new` expression                           | yes                                 | `call:constructor` (`new Foo()` already credits `constructor`, `extract-ts-api.ts:2698`) |
| Array / hash literal contents              | **no** (opaque)                     | `array` / `hash` — must skip                                                             |
| String interpolation                       | **no**                              | `str-interp` — must skip                                                                 |
| Splat / double-splat / block-pass          | **no** (arity is unknown)           | flag and skip the site                                                                   |
| Block (`do…end`, `&blk`)                   | **no**                              | flag; compare the non-block args only                                                    |
| Binary / unary / ternary expressions       | **no** (shape is language-specific) | skip                                                                                     |

Two hard Ripper limits, both structural:

- **Ripper cannot distinguish a local-variable read from a zero-arg self-send.**
  `type_cast_for_database(name, value)` — `name` may be a local or a reader.
  The descriptors `id:x` and `call:x` must therefore collapse into one bucket
  (`ref:x`) on both sides. This is the same information loss `inert_receiver?`
  (`extract-ruby-api.rb:2280-2288`) already works around for the weak-call set.
- **Local aliasing is invisible.** `attr, values = o.left, o.right` then
  `visit(attr, collector)` reads as `ref:attr` where the port's
  `visit(node.left, collector)` reads as `ref:left`. Confirmed equivalents that
  cost real rows; see the noise bucket.

**TypeScript — yes, and easier.** `collectCalls` (`extract-ts-api.ts:2698`)
already walks `CallExpression` / `NewExpression` / `PropertyAccessExpression`
and calls `call.arguments.forEach(visit)`; the arguments are on the node.
Object literals give kwargs keys directly, `SpreadElement` gives the splat
flag, arrow/function expressions give the block flag.

One TS-side subtlety: `collectCalls` credits a bare property **read**
(`this.joinsValues`) as a call, deliberately, because Ruby has no field access.
Those are not call sites and carry no argument list. The args dimension must
key off syntactic call sites only, and treat a name that exists in the call set
purely via a property read as "no comparable TS site" rather than as a
zero-argument call.

### 2. Normalization rules

Normalizes (same pipeline as `options-keys.ts:24` `normalizeRubyKey` and
`literals.ts:105` `compareDefaults`, i.e. `snakeToCamel`):

- Identifiers: `id:join_name` → `ref:joinName`.
- Nested call names: `call:value_for_database` → `ref:valueForDatabase`;
  Ruby `new` → `constructor`.
- Symbols: `sym:inverse_of` → `ref:inverseOf`, and the colon-kept spelling
  `":inverse_of"` (CLAUDE.md "Symbols vs strings") must compare equal to the
  bare one — a port that keeps the colon is correct, not divergent.
- Identifier-shaped **strings**: `"value_before_type_cast"` → `valueBeforeTypeCast`.
  Only strings matching `/^[a-z][A-Za-z0-9_]*$/` normalize; an SQL fragment
  (`" GROUP BY "`) must compare byte-for-byte or the dimension loses its
  sharpest finding.
- `id:` and `call:` collapse to one `ref:` bucket (Ripper limit, above).

Compares structurally: argument **count**, **order**, and each descriptor.
Literal values compare by value, reusing `literals.ts` `normalizeLiteral`
(numeric underscores, `nil`↔`null`/`undefined`, escape canonicalization).

Ignored — no cross-language agreement is possible:

- Sites carrying a splat, double-splat or block-pass on either side.
- Any argument list containing an opaque descriptor (`?`, `array`, `hash`,
  `str-interp`, `binop:`, `unary`, `ternary`) — including one nested inside a
  `kwargs{}` descriptor. **Leaking nested `?` was 8 of 17 noise rows in the
  first activerecord sample**; recursing the check removed 94 of 604 rows
  outright.
- `super` (the module-mixin port structurally drops it) and every
  `NO_JS_CALL_FORM` name (`compare.ts:195`) plus the Enumerable/Object idiom
  denylist, exactly as the call-set gate excludes them.
- A leading `this`-mixin receiver argument the port adds
  (`deleteThroughRecords(this, records)` for Rails
  `delete_through_records(records)`, `reflectOnAggregation(Klass, name)`) —
  that is the settled `this`-typed-function idiom, not a divergence.

### 3. Signal-to-noise — measured

Prototype: a Ripper walker plus a `typescript` AST walker emitting ordered call
sites with argument descriptors, paired through the existing name-matched pairs
in `output/call-skeletons.json`.

| Package      | Matched pairs resolved | Comparable arg-bearing Ruby sites |     Match | **Flag** |
| ------------ | ---------------------: | --------------------------------: | --------: | -------: |
| arel         |                    301 |                               302 | 232 (77%) |   **70** |
| activerecord |                  2,279 |                             1,294 | 784 (61%) |  **510** |

Hand classification — arel is the **full** population (n=70), activerecord a
seeded random sample (n=40, of which 8 were eliminated by the nested-`?` fix,
leaving n=32). Combined n=102, well above the n≥30 bar.

| Bucket                              | arel (n=70) | activerecord (n=32) | Combined (n=102) |
| ----------------------------------- | ----------: | ------------------: | ---------------: |
| (a) genuine divergence worth fixing |    57 (81%) |            22 (69%) |     **79 (77%)** |
| (b) confirmed equivalent            |      6 (9%) |              1 (3%) |           7 (7%) |
| (c) tooling noise                   |     7 (10%) |             9 (28%) |         16 (16%) |

The genuine bucket splits into three sub-classes:

- **a1 — argument order / dropped defaults (33% of arel rows).** The headline
  finding, and the reason to build this. trails moved `collector` to the **last**
  parameter across the entire arel visitor-helper family: Rails
  `inject_join(list, collector, join_str)` (`to_sql.rb:897`) is
  `injectJoin(nodes, connector, collector)` (`to-sql.ts:654`); likewise
  `collect_nodes_for` (`:179`), `infix_value` (`:957`),
  `infix_value_with_paren` (`:963`), `grouping_parentheses` (`:981`). 23 call
  sites. `arity.ts` cannot see it (the counts match), `api:compare` cannot see
  it (the names match), and `api:calls` cannot see it (the calls are made).
  This is a direct CLAUDE.md violation ("Same parameter _order_ and defaults")
  that has been invisible to every gate in the repo.
- **a2 — local/parameter identifier renamed away from Rails (33% arel / 31% AR).**
  `o`→`node`, `x`→`n`, `v`→`h`, `join_name`→`tbl`, `values`→`row`,
  `exprs`→`filtered`, `scope_for_association`→`sfa`. Also a CLAUDE.md
  violation ("A local or parameter keeps the Rails identifier"), but a
  _different_ dimension that merely surfaces here. High volume, low individual
  severity.
- **a3 — invented helper or conversion at the call site (16% arel / 13% AR).**
  Rails `visit o.escape, collector` (`to_sql.rb:485-495`) became
  `this.appendEscape(node.escape, collector)` (`to-sql.ts:1044`) — an extracted
  helper Rails does not have. `quoteTableName(rubyToS(name))` inserts a
  conversion Rails' `quote_table_name(name)` does not do. `UnaryOperation`
  declares `readonly operand` (`unary-operation.ts:19`) shadowing Rails'
  `Unary#expr` (`unary.rb:6`), and the visitor reads `node.operand` where Rails
  reads `o.expr`. Kwarg flattened to positional: Rails
  `assert_valid_value(object, action: :dump)` → `(object, "dump")`.

Residual noise (16%), after the nested-`?` fix and the mixin-receiver rule:
Ruby local aliasing (above), block-variable identity through a restructured
loop, dynamic `send`, and hoisted temporaries (`add_to_target(build_record(…))`
vs a TS local). All are false-positive-shaped and belong in the baseline with a
reason, not in a normalization rule.

### 4. Recommendation, shape and cost

**Ship it, narrowed.** Two row classes in one artifact:

- `shape` rows — argument count, order, literal values, kwarg keys (a1 + a3).
  **Gate these.** ~45% of flagged rows; this is the dimension nothing else
  measures.
- `naming` rows — argument lists that differ only in a `ref:` identifier
  spelling (a2). **Report-only at first.** They are real, but they are the
  local/parameter-identifier dimension, they are ~33% of the population, and
  gating them on day one buys a ~500-row baseline for a burndown that wants its
  own RFC.

Ratchet shape — **a separate baseline tree and a separate script**, not a fold
into the existing one:

- `scripts/api-compare/call-mismatches-args-exclude/`, sharded per file like the
  existing tree, keyed `package + tsFile + rubyName + call + rubyArgs`. It
  cannot fold into `call-mismatches-exclude`: that key has no argument
  component, and RFC 0084 measures its **row count** as the debt metric —
  mixing a second dimension in corrupts that measurement outright.
- A `pnpm api:calls:args` script (alias `parity:api:calls:args`) plus its own CI
  step, mirroring `lint-call-mismatches.ts`: only-shrink, regenerate the
  artifact in the gate, stale-row arm, partial-scope rejection.
- Advisory-first, per this RFC's own rollout rule: land the artifact and a
  `--report` mode with no gate, seed the baseline in a follow-up PR on `main`,
  then flip to gating.

Cost — six stories, each inside the PR LOC ceiling:

| Story                                | Scope                                                                       |      ~LOC |
| ------------------------------------ | --------------------------------------------------------------------------- | --------: |
| `ruby-extractor-emit-call-arguments` | `walk_for_calls` emits `callArgs`; extractor-schema + shared-cache key bump |      ~200 |
| `ts-extractor-emit-call-arguments`   | `collectCalls` emits `callArgs`; property-reads excluded                    |      ~170 |
| `call-args-normalize-and-compare`    | new `call-args.ts` + tests (all rules in §2)                                |      ~230 |
| `call-args-artifact-and-report`      | `compare.ts` wiring, `output/call-arg-mismatches.json`, `--report`          |      ~150 |
| `call-args-ratchet-and-ci-step`      | `lint-call-args.ts` clone + scripts + CI step + docs                        |      ~300 |
| `call-args-baseline-seed`            | generated baseline tree, `main`-only                                        | generated |

Total ~1,050 LOC of hand-written code. Cache invalidation differs per side and
is easy to get backwards: `extractor-schema.ts` governs the **TS** extractor
cache only (`EXTRACTOR_SOURCES`, `extractor-schema.ts:91`), so `callArgs` is
registered in `EXTRACTOR_OUTPUT_FIELDS` by the **TS** story alone; the Ruby
manifest keys on the content hash of `extract-ruby-api.rb` itself
(`orchestrate.ts:88-99`) and self-invalidates. One registration, one story — the
two extractor stories share no edit and stay parallel-safe.

**Do not** reuse `arity.ts`: that dimension checks `def` signatures
(declaration-site parameter counts), not call sites, and its
`arity-exclude.json` is keyed by method, not by call.

## Alternatives considered

- **One mega "fidelity audit" agent pass instead of tooling.** Rejected:
  audits decay; generated baselines + CI ratchets keep measuring after every
  merge.
- **Gating (CI-fail) from day one.** Rejected: every tool starts advisory or
  baseline-excluded; flipping to error is a one-line config change once the
  baseline is reviewed.
- **prism for Ruby body parsing.** Rejected: `extract-ruby-api.rb` already
  uses Ripper and runs everywhere CI does; new extraction stays in the same
  script.
- **Body-shape fingerprinting, behavioral-stub lint, schema canonical v2
  (FKs/check constraints), differential query fuzzing** (all from the source
  analysis doc). Deferred — descoped from this RFC to keep it to the
  highest-signal five tools; each can become its own RFC/story later.

## Rollout

1. Phase 1 (independent, parallel-safe — distinct file sets):
   `no-raw-sql-lint`, `error-class-parity-lint`,
   `options-kwargs-key-parity`.
2. Phase 2 (build on Phase-1 extraction plumbing):
   `constants-defaults-parity`, `deprecation-parity-lint`.

## Open questions

1. **Where does the options-key TS truth live for option bags typed as
   broader interfaces (e.g. shared `QueryOptions`)?** Recommendation: compare
   against the _resolved_ property set of the parameter type via the type
   checker, and skip-with-reason any method whose options param isn't an
   object type.

## Changelog

- 2026-06-12: initial RFC
- 2026-08-08: call-argument fidelity spike — verdict, measurements and six
  implementation stories added as `## Call-argument fidelity`
- 2026-06-12: descope to five stories — body-shape-fingerprinting,
  behavioral-stub-lint, schema-canonical-v2-fk-check moved to
  Alternatives/deferred
