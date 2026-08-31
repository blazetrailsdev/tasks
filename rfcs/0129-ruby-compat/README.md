---
rfc: "0129-ruby-compat"
title: "@blazetrails/ruby-compat: one home for the MRI core value types trails emulates, anchored to vendored ruby/ruby and measured by the call gates"
status: active
created: 2026-08-29
updated: 2026-08-29
owner: "@deanmarano"
packages:
  - ruby-compat
  - activesupport
  - activemodel
  - activerecord
  - actionpack
  - actioncontroller
  - actiondispatch
  - actionview
  - rack
  - date
  - i18n
  - trailties
clusters:
  - fidelity
related-rfcs:
  - "0089-corelib-primitives"
  - "0088-date-gem-port"
  - "0047-call-set-parity"
  - "0084-call-gate-consolidation"
  - "0095-call-argument-parity"
  - "0117-arel-extra-surface-burndown"
  - "0120-extra-surface-gating-rollout"
  - "0092-parity-tools-consolidation"
priority: 3
---

# RFC 0000 — `@blazetrails/ruby-compat`

## Summary

trails ports Rails. Rails runs on MRI, so a Rails body freely calls things Rails
does not define — `Rational(...)`, `Regexp.escape`, `Range#cover?`, `Hash#fetch`,
`<=>`. Those are **the Ruby language**, not the framework. They have no `.rb`
counterpart anywhere in `vendor/rails/`, so a trails port of one cannot be
measured by `parity:api`, cannot be credited by `parity:api:calls`, and has
nowhere to live. What actually happens today is that each port hand-rolls the
primitive where it first needed it, tags it `@noRailsEquivalent PERMANENT`, and
the next port hand-rolls it again.

`@blazetrails/ruby-compat` is the one home for them, and this RFC is as much
about the **measurement** as the move: a package that merely relocates the
duplicates without a gate behind it recreates them within a quarter.

Three numbers set the scale:

| Measurement                                                                                                                                     | Today             | Command                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------- |
| `@missingRailsCall` receipts across `packages/*/src`                                                                                            | **373**           | `grep -rh "@missingRailsCall" packages/_/src --include=_.ts \| wc -l` |
| …of which name a Ruby **core** method with no callable TS spelling (`empty?` 27, `fetch` 25, `merge` 16, `any?` 16, `size` 11, `include?` 4, …) | **the plurality** | `… \| awk '{print $2}' \| sort \| uniq -c \| sort -rn`                |
| `NO_JS_CALL_FORM` entries — Ruby calls the gate suppresses **globally** because no TS body could ever satisfy them                              | **9**             | `scripts/api-compare/compare.ts:249`                                  |

Every one of those is the same finding written three ways: **a Ruby core call has
no TS call form, so the call gates cannot see whether the port made it.**
ruby-compat manufactures the call form. That is what turns a permanent receipt
into a measurable call.

## Motivation

### 1. The primitives are duplicated, right now, in the tree

Not a projection — these are grep results as of 2026-08-29:

| Primitive                                       | Canonical copy                                           | Duplicates                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `Regexp.escape` (`re.c` `rb_reg_s_quote`)       | `activesupport/src/core-ext/regexp.ts:18` `regexpEscape` | `activerecord/src/support/quote-regex.ts:27` `escapeRegExp`, `activerecord/src/support/run-token.ts:23` `escapeRegExp`, `trailties/src/generators/trails-actions.ts:191` `escapeRegExp` — all three byte-identical to the canonical body                                                                                                                                                                                      |
| `Kernel#Rational()`                             | `vendor/ruby/rational.c` (`nurat_s_convert`)             | nowhere                                                                                                                                                                                                                                                                                                                                                                                                                       | Rails calls the FUNCTION at 20 sites; the class alone cannot answer them |
| `Hash#fetch(key, default)`                      | none — no canonical copy exists                          | `activerecord/src/connection-adapters/postgresql-adapter.ts:157`, `activerecord/src/connection-adapters/abstract-mysql-adapter.ts:127`, `activesupport/src/core-ext/string/conversions.ts:27` — three identical `key in hash ? hash[key] : defaultValue` bodies; plus the raising arm at `activesupport/src/core-ext/date-and-time/calculations.ts:201`                                                                       |
| `KeyError`                                      | `activesupport/src/core-ext/key-error.ts:12`             | `actionpack/src/action-dispatch/middleware/cookies.ts:509` (a second class declaration), and **seven** sites that build a plain `Error` and assign `err.name = "KeyError"` (`actionpack/.../test-case.ts:822`, `.../strong-parameters.ts:505`, `.../mime-type.ts:475`, `activemodel/src/attribute-set/builder.ts:157`, `activemodel/src/attribute-set.ts:31`, `activerecord/src/token-for.ts:107`, `rack/src/request.ts:673`) |
| Symbol discrimination (`":name"` per CLAUDE.md) | none                                                     | `i18n/src/backend/base.ts:241`, `.../fallbacks.ts:31`, `.../simple.ts:43`, `.../key-value.ts:64` — four identical private `isSymbol`; a fifth, differently-shaped, at `activemodel/src/validations/numericality.ts:179`                                                                                                                                                                                                       |
| `<=>` (`Comparable`)                            | none                                                     | `activesupport/src/range-ext.ts:15` `cmp`, `activesupport/src/core-ext/date-and-time/calculations.ts:81` `compare`, `date/src/date.ts:843` `spaceship`                                                                                                                                                                                                                                                                        |

`Regexp.escape` is the case that names the problem, because the tooling **already
says so**. `scripts/api-compare/enumerable-idioms.ts:78-89` carries a
`CORE_LIBRARY_ALIASES` table with exactly one entry, `escape → regexpEscape`, and
its doc comment argues the whole design of this RFC:

> One name, not a list of the spellings that happened to be in the tree: an alias
> list would ratify the divergence this entry exists to make visible, and a body
> that escapes under some other name should still flag.

That comment describes a gate. The gate does not exist. Three bodies escape under
another name and nothing flags.

### 2. A Ruby core value type is currently homed by accident

`Rational` — a line-by-line port of `rational.c` with `nurat_add`,
`nurat_s_canonicalize_internal` and `float_to_r` cited by C symbol — lives at
`packages/date/src/date.ts:1241`, inside the vendored **date gem** port, because
`date_zone_to_diff` was the first body that needed it. It is exported from
`@blazetrails/date` and imported across a package boundary by `activemodel`
(`type/decimal.ts:2`, `type/date-time.ts:4`, `type/helpers/time-value.ts:1`).
`Rational` is not part of the date gem. activemodel depending on `@blazetrails/date`
to cast a decimal is a dependency edge that exists only because the value type has
no home.

### 3. The call gates are blind here, and say so in their own comments

`compare.ts:200-248` explains why `key?` / `has_key?` are in `NO_JS_CALL_FORM`:

> Rails' options/params hashes port to object literals, whose membership tests are
> the `in` operator, `x.k !== undefined`, or destructuring with a default. The gate
> cannot tell a faithful `"k" in opts` from a dropped guard either way, so keeping
> them would baseline every options-hash port forever **with no way to ever
> discharge it.**

ruby-compat _is_ the way to discharge it. A `Hash` with a real `fetch` / `key?`
gives the port a callee, and the moment a callee exists the suppression is no
longer required. The same argument retires the 25 `@missingRailsCall fetch —
PERMANENT` receipts, whose text is uniformly "Ruby Hash#fetch has no JS call
analogue." It will have one.

`activesupport/src/ruby-empty.ts:11-15` reached this conclusion already, in-tree,
for one method:

> the obvious spellings — `xs.length === 0`, `Object.keys(h).length === 0` — are
> property reads, so a faithfully ported body emits no call at all and the
> call-set gate (RFC 0047) has nothing to credit the Ruby `empty?` with. Calling
> it keeps the Ruby method visible in the TS body, which is what the gate measures
> and what a Rails dev reads.

That is this RFC's thesis, already ratified for `empty?`. ruby-compat generalizes
it and gives the generalization a package.

### 4. The call baselines hold part of the population — and only part

`scripts/api-compare/call-mismatches-exclude/` holds **601 baselined
call-mismatch rows across 204 shards**, of which **251 name a Ruby core or
Enumerable call** rather than a Rails method. That headline number is real but it
is not this RFC's population, and it is worth splitting rather than quoting,
because two thirds of it belongs to someone else:

|                                 | Rows   | What it is                                                                                                                                                                                                                       | Owner                   |
| ------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **A. No JS counterpart at all** | **80** | `Hash` mutation, iteration and lookup (`merge` 18, `merge!` 7, `fetch` 14, `delete` 14, `delete_if` 4, `each_pair` 3, `each_key` 3, `update` 3, `transform_values` 3, `slice` 3, `except` 2, `reject` 2) and `Regexp.escape` (4) | **this RFC**            |
| B. Natively portable            | 58     | `join`, `split`, `match`/`match?`, `warn`, `first`/`last`/`size`/`empty?`/`any?`/`map`… — JS has the same-named method, or an alias the comparator already credits                                                               | the call-gate RFCs      |
| C. Receiver-ambiguous           | 113    | `new` (92), `call` (21)                                                                                                                                                                                                          | per-row comparator work |

**Bucket A is the claim.** Its rows have no JS spelling at any argument shape,
and where one was individually adjudicated rather than seeded, the reason states
this RFC's thesis outright:

> `Hash#merge` has no JS call form — `@defaults.merge(path.requirements)`
> (`route.rb:96`) is object spread `{ ...this.defaults, ...this.path.requirements }`.
>
> `Hash#delete_if` has no JS call form — `delete_if { |_, v| /.+?/m == v }`
> (`route.rb:96-98`) is spelled as an `Object.entries` loop.
>
> `Hash#transform_values` has no JS call form (RFC 0092
> positional-idiom-analogues); the TS counterpart is a plain object rebuilt by an
> `Object.entries` loop.

Each is correct as a description and permanent as a verdict, because nothing in
the tree offers the call form it says is missing. Those 80 rows are spread over
seven packages, so no single package's burndown will ever reach them — which is
the argument for a package rather than a sweep. It is also why the Hash scope
below is the mutation and iteration family and not only `fetch`.

**Bucket B is explicitly not ours**, and saying so is the point of the table.
`Array#join` and `String#split` exist in JS under the same names; the baselined
divergences are argument semantics, not missing calls — Ruby's argument-less
`join` defaults to `""` where JS defaults to `","`
(`journey/gtg/transition_table.rb:148`), and Ruby's `split` limit keeps the
remainder where JS discards it (`cache/file_store.ts` `file_path_key`). Those are
`parity:api:calls:args` findings. `Regexp#match?` already resolves to
`RegExp#test` through `JS_ENUMERABLE_ALIASES`. A ruby-compat export for any of
them would add surface that duplicates a native, which is the inverse of the
standing rule.

**One row is a finding against this RFC's own design**, and it is why
`Kernel#Rational()` is in scope:

> `Rational()` is a Kernel FUNCTION in Ruby; the port's Rational is a class
> (`@blazetrails/date` date.ts:1241) and JS has no way to construct one without
> `new`, so the kwarg value is `new Rational(999999999, 1000)`. (A Kernel-style
> `Rational()` factory would additionally have to canonicalize `Rational(n, 1)`
> to an Integer, which `new Rational` deliberately does not.)

Rails calls `Rational(...)` — the Kernel function, not the class — at **20 sites
across activesupport and activerecord**. Moving the _class_ alone would leave
every one of them unable to make the call. Ruby has both spellings and so must
ruby-compat, with the different fold semantics that row already identifies.

## Relationship to RFC 0089

**This RFC supersedes `0089-corelib-primitives`** (postponed since 2026-08-05),
and inherits its inventory rather than re-deriving it. Three things changed, and
each one is why the successor exists rather than a reactivation:

1. **The name.** `corelib` reads as "trails' core library". `ruby-compat` says
   what the package is: a compatibility layer for the Ruby language, in the
   `*-compat` idiom every reader already knows.
2. **Vendoring reverses 0089's central finding.** 0089 recorded "Vendorable
   source: **No** — not a distributable unit" and "`parity:api`: **Never**", and
   built its whole contract on that. `ruby/ruby` is a git repository and is
   vendorable exactly as `rails/rails` is. `parity:api` still cannot extract from
   C — that half of 0089 stands — but a **read-anchor** and a `vendor/ruby/…:LINE`
   citation gate replace it, which is a materially different contract from "no
   anchor at all" (see _Anchoring_).
3. **The scope is inverted.** 0089 led with `Module#include` / `#prepend` — the
   interpreter's object model. This RFC leads with **value types**, defers the
   object model entirely, and adds `Hash`, which 0089 did not consider and which
   the receipt tally says is the largest single population.

0089's stories are not lost: `move-regexp-escape-to-corelib-and-adopt-remaining-copies`,
`move-range-core-and-succ-to-corelib`, `corelib-package-scaffold`,
`move-tempfile-and-tmpname-to-corelib` and `move-module-mixin-primitives` all
reappear here re-scoped — the last as
`move-module-mixin-primitives-to-ruby-compat`, which lifts the object-model
deferral for `include` / `extend` / `prepend` only. `port-ruby-mutex-for-check-pending`
and `port-uri-parser-escape-for-rack-and-routes-inspector` remain listed under
_Deferred_ below. **0089 is `status: superseded`, `superseded-by: 0129-ruby-compat`,
and its nine stories are closed** pointing at their successors here. (An RFC's
`status:` is markdown-owned — unlike a story's, `ingest.ts:481` carries it
across on every ingest — so that flip is a file edit, not a `tasks` verb. An
earlier draft of this paragraph said the opposite.)
`packages/activesupport/src/tempfile.ts` carries five "until RFC 0089" citations
(`:16`, `:32`, `:82`, `:83`, `:233`); repointing them is acceptance criteria on
the final cleanup story, so no citation goes stale mid-flight.

## Design

### The standing rule: only what trails actually calls

**Every member of `ruby-compat` must have a real call site in this repo, or be
reached by one that does.** No speculative MRI surface — not "the rest of
`Rational`", not "`Hash#transform_keys` while we're here", not a method added
because MRI has it.

This is the package's defining constraint, and it is not a style preference. A
Ruby-core package is uniquely exposed to scope creep because MRI's surface is
enormous and every member of it is defensibly "real Ruby". The `SKIP_GROUPS`
discipline that keeps other packages honest does not apply — there is no Ruby file
to be measured against — so the constraint has to be the rule itself.

**It is enforced by `parity:api:extra`, not by review.** Every ruby-compat member
is _novel_ extra surface by construction (no `.rb` maps onto the package), so the
whole package is scored by the extra-surface counter, it is enrolled in
`GATED_PACKAGES` (`scripts/api-compare/extra-surface-mark.ts:50`) at a seeded
mark, and that mark is only-shrink like every other. Adding a speculative member
raises `novel` and turns the gate red. There is no reseed. That makes "port the
whole of `Rational`" mechanically impossible rather than merely discouraged.

Two consequences the move stories inherit:

- **A move trims.** Where the existing implementation already carries surface no
  caller reaches, the move story deletes it rather than relocating it. Each move
  story's acceptance criteria names the call sites that justify each member it
  keeps.
- **A later need is a later story**, filed against this RFC with the call site
  that motivated it. Not a drive-by addition to a move PR.

### Scope

#### In scope — the core value types

The language-level value objects, and only the parts called today.

| Primitive                                | Source of truth                              | Moves from                                                  | Why now                                                                                                |
| ---------------------------------------- | -------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `Rational`                               | `vendor/ruby/rational.c`                     | `date/src/date.ts:1241`                                     | Wrongly homed in a gem port; already crosses a package boundary into activemodel                       |
| `Range` (+ its `String#succ` dependency) | `vendor/ruby/range.c`, `string.c`            | `activesupport/src/range-ext.ts`, `core-ext/string/succ.ts` | The unanchored class four Rails `core_ext/range/*.rb` ports reopen; fixes a dependency inversion       |
| `Hash` semantics                         | `vendor/ruby/hash.c`                         | nowhere — 4 private copies                                  | Largest population twice over: 76 baseline rows plus 25 `fetch` receipts                               |
| Symbol conventions                       | `vendor/ruby/symbol.c`                       | nowhere — 5 private copies                                  | CLAUDE.md already fixes the `":name"` representation; nothing implements it once                       |
| `Comparable`                             | `vendor/ruby/compar.c`                       | nowhere — 3 private copies                                  | `<=>` is the operator every value type above is ordered by                                             |
| `Regexp.escape`                          | `vendor/ruby/re.c`                           | `activesupport/src/core-ext/regexp.ts:18`                   | Named explicitly by the maintainer; 3 duplicates; the one entry `CORE_LIBRARY_ALIASES` already carries |
| `Kernel#Rational()`                      | `vendor/ruby/rational.c` (`nurat_s_convert`) | nowhere                                                     | Rails calls the FUNCTION at 20 sites; the class alone cannot answer them                               |

This set is scoped by what the tree actually calls — the `@missingRailsCall`
receipts and the baseline rows in Motivation §4 — not by MRI's method list. In:

- **Lookup:** `fetch` (both arms — the stored-`nil`/`false` return **and** the
  `KeyError` raise, the CLAUDE.md "fetch vs `??`" trap made callable), `key?` /
  `has_key?`, `dig`, `delete`.
- **Mutation and iteration**, which the baselines show is the larger half and
  which an earlier draft of this RFC missed entirely: `merge`, `merge!`,
  `update`, `delete_if`, `each_pair`, `each_key`, `transform_values`, `reject`,
  `slice`, `except`. Every one is a row whose adjudicated reason is "has no JS
  call form", ported as an object spread or an `Object.entries` loop.
- **`default` / `default_proc`**, needed by RFC 0128's
  `converge-alias-tracker-constructor-onto-rails-two-parameters`, which is
  blocked on a Ruby-Hash default proc existing.
- Insertion-ordered non-string keys where a port needs them.

Out, measured and named: **`compare_by_identity`** — its only occurrence is
`rack/src/headers.ts:481`, a Rails-anchored override that raises `TypeError`, so
nothing calls the real semantics.

#### Deferred — listed and sized, deliberately not scheduled

Real findings from the same inventory, deliberately given **no story in this
RFC**. Each becomes one only when the value types and their tooling have landed
and proved out — a successor RFC's work, not a later wave of this one.

| Item                                                               | Location                                     | ~LOC | Note                                                                                                                                                                       |
| ------------------------------------------------------------------ | -------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Module#include` / `#extend` / hooks / `Included<>` / `Extended<>` | `activesupport/src/include.ts`               | 239  | 0089's lead item; the object model, not a value type                                                                                                                       |
| `Module#prepend`                                                   | `activesupport/src/prepend.ts`               | 117  | ditto                                                                                                                                                                      |
| `Object#hash` (`rbHash`)                                           | `activesupport/src/rb-hash.ts`               | 82   | already a single canonical copy — a move, not a convergence                                                                                                                |
| `rb_equal`                                                         | `activesupport/src/rb-equal.ts`              | 51   | ditto; `Comparable` will depend on it, so sequencing matters                                                                                                               |
| `empty?` (`isEmpty`)                                               | `activesupport/src/ruby-empty.ts`            | 31   | the precedent this RFC generalizes; moves once the call mapping exists                                                                                                     |
| Ruby truthiness                                                    | `activerecord/src/ruby-truthy.ts`            | —    | the CLAUDE.md `if x` trap's implementation                                                                                                                                 |
| `NameError`                                                        | `activesupport/src/core-ext/name-error.ts`   | —    | Ruby core error class, sibling of `KeyError`                                                                                                                               |
| `SecureRandom`                                                     | `activesupport/src/core-ext/securerandom.ts` | —    | Ruby **stdlib**, not core — may warrant its own vendored-gem treatment                                                                                                     |
| `Tempfile` / `tmpname`                                             | `activesupport/src/tempfile.ts`              | —    | 0089 story; the file cites 0089 in five places. **Blocked on the platform-adapter question** — `tempfile.ts:86` calls `getCrypto()`, so it cannot move into a leaf package |
| `Mutex` (for `check_pending`)                                      | —                                            | —    | 0089 story; `synchronize` is a `NO_JS_CALL_FORM` entry                                                                                                                     |
| `URI` parser / escape                                              | —                                            | —    | 0089 story; stdlib                                                                                                                                                         |
| `Kernel#sprintf` / `format`                                        | `activesupport/src/core-ext/kernel/`         | —    | partly Rails-anchored; needs a per-member split before it can be sized                                                                                                     |

`core-ext/kernel/`, `core-ext/numeric/` and `core-ext/securerandom.ts` are
**mostly Rails-anchored** `core_ext` ports with real `.rb` counterparts. Moving
those would charge Rails' surface to a non-Rails package and destroy working
`parity:api` coverage — the exact inverse of the problem being solved. Only
individually-identified unanchored members are ever in scope, and that
identification is deferred work.

### Anchoring: vendored `ruby/ruby`

`vendor/ruby/`, fetched by `pnpm vendor:fetch` beside `vendor/rails/` and laid
down by `scripts/start-worktree.sh`, so a ruby-compat port cites
`vendor/ruby/rational.c:LINE` exactly the way an activerecord port cites
`vendor/rails/activerecord/lib/…:LINE` today.

**Pin: `v3_3_11`.** CI pins `ruby-version: "3.3"` in three jobs
(`.github/workflows/ci.yml:1412,1685,1798`), the host toolchain that runs
`extract-ruby-api.rb` is `ruby 3.3.11`, and `packages/date/src/date.ts:1230-1231`
already writes its behavioural claims against that exact build — "on ruby 3.3.11
`(Rational(1,2) * 12).class` is `Rational`". Pinning anywhere else would make
those in-tree citations unverifiable. The `date` gem stays pinned separately at
`v3.4.1`; a gem's ref and the interpreter's ref are independent, as they are for
a real Ruby install.

`compareApi: false` and `compareTests: false` on the entry, for the reason 0089
established and `date` already demonstrates (`vendor/sources.ts:190-206`): the
surface is C, so `extract-ruby-api.rb` sees nothing. **`parity:api` never enrolls
ruby-compat and that is permanent, not a flag a later story flips.**

Two mechanisms replace it, and together they are a stronger contract than 0089's
"no anchor":

- **A citation lint.** Every exported ruby-compat member carries a
  `vendor/ruby/<file>:<line>` citation that resolves — the file exists at the
  pinned SHA and the line is in range. A `@noRailsEquivalent PERMANENT` receipt
  stays required (the extra-surface extractor scores by Ruby-file mapping, and
  ruby-compat has none), but it stops being a bare assertion: the receipt says
  "no Rails counterpart" and the citation says "here is the MRI counterpart".
- **`ruby/spec`, which ships inside `ruby/ruby`.** MRI mirrors the ruby/spec
  suite at `spec/ruby/`, so one vendored source yields both the C read-anchor and
  a behavioural test suite — `spec/ruby/core/range`, `core/string`, `core/hash`,
  `core/rational`, `core/symbol`, `core/comparable`. 0089 planned a second
  vendored `ruby/spec` clone; it is unnecessary.

### Parity integration

Three gates, in dependency order. All three are **report-only first, gated
second** — the house pattern, and non-negotiable here because seeding a gate red
across nine packages blocks every unrelated PR.

#### Gate 1 — the Ruby-core → ruby-compat call mapping

**Where.** A new `scripts/parity/ruby-compat.ts`, and
`enumerable-idioms.ts`'s one-entry `CORE_LIBRARY_ALIASES` folds into it — that
entry _is_ a ruby-compat primitive, and its doc comment is this table's
specification. `scripts/parity/` because both `compare.ts` and `lint-calls.ts`
consume it, which is exactly the "two consumers, so it lives in the shared home"
rule RFC 0092 settled (`enumerable-idioms.ts:1-8`).

**Shape.** A resolution, not an alias list:

```ts
// Ruby core receiver + method  →  the ONE ruby-compat export that is its port.
export const RUBY_COMPAT_EXPORTS = new Map<string, string>([
  ["Regexp.escape", "regexpEscape"],
  ["Hash#fetch", "fetch"],
  ["Hash#key?", "hasKey"],
  ["Range#cover?", "cover"],
  ["Comparable#<=>", "cmp"],
  // …one row per exported member, keyed by its MRI spelling.
]);
```

Keyed by the **MRI spelling** rather than the bare method name, because the bare
name is ambiguous across receivers (`fetch` is `Hash#fetch`, `Array#fetch` **and**
`ActiveSupport::Cache::Store#fetch`, which is Rails and must keep flagging
normally). The comparator already has the receiver signal it needs for the cases
that matter: RFC 0083's inert-receiver filter, plus the `FOREIGN_READ_PREFIX`
marking `enumerable-idioms.ts:126` records. Where the receiver genuinely cannot
be resolved, **the row does not go in the table** — an unresolvable row would
credit a Rails `fetch` for a Ruby one, which is worse than the status quo. The
population is small enough (the value-type set is ~25 members) that per-row adjudication is
tractable; that is another reason the "only what we call" rule matters.

**Direction — and this is the part that is new.** `CORE_LIBRARY_ALIASES` is
_silence-only_: it can credit a call, never flag one. The mapping is
**bidirectional**:

- _Forward (credit)._ Ruby body calls `Regexp.escape`; TS body calls
  `regexpEscape` imported from `@blazetrails/ruby-compat` → the call is made. No
  mismatch row, no receipt.
- _Reverse (flag)._ Ruby body calls `Regexp.escape`; TS body calls a **local**
  `escapeRegExp`, or inlines `s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")` → **a
  mismatch row**, in the same `call-mismatches-exclude/` shards under a new
  `kind: "rubyCompat"`, read only by this gate, exactly as `kind: "args"` is read
  only by `parity:api:calls:args` (RFC 0095). It converges by importing the
  export, not by baselining.

The forward direction is what `@missingRailsCall fetch — PERMANENT` receipts
discharge into; the reverse is the fidelity claim the RFC actually makes.

**Only-shrink interaction.** No baseline is reseeded and no high-water mark is
raised. The `rubyCompat` rows enter at zero (nothing is enrolled on day one), and
a package's enrollment story is what admits its rows — each converged in that same
PR or baselined with a per-row reviewed reason. This inverts nothing: a package
joins with its rows already at zero, so the mark can only ever come down.

**Enrollment.** Per-package, mirroring `GATED_PACKAGES` and the RFC 0121
enrollment set: an `ENROLLED_PACKAGES` list that is **only-grow**, one package per
story, in ascending order of receipt count — `i18n` and `activesupport` first
(smallest, and `i18n` holds four of the five `isSymbol` copies), `activerecord`
last. A package is never removed to turn a red run green.

**`NO_JS_CALL_FORM` shrinks as a consequence, not as a goal.** When a Ruby name in
that set acquires a ruby-compat callee, its entry is deleted and its suppressed
population becomes measurable. `key?` / `has_key?` are the first two, and their
comment says so. `to_s`, `each`, `catch` and `synchronize` are **not** candidates
and stay: a template literal, a `for…of`, a `catch` clause and a body with no
mutex are language constructs, not calls a package can supply. The gate must not
be used to argue otherwise.

#### Gate 2 — `parity:api:extra` scores ruby-compat's own surface

Answered above under _the standing rule_: every member is _novel_, the package
enrolls in `GATED_PACKAGES` at a seeded mark, only-shrink, no reseed. **Members
still carry `@noRailsEquivalent PERMANENT`** — the extractor maps Ruby files to TS
files and ruby-compat has no Ruby file, so without the tag the whole package
vanishes from the measured surface, which is the one outcome worse than being
counted. The receipt is paired with the MRI citation, and the citation lint is
what stops `PERMANENT` from degrading into a rubber stamp.

Note the RFC 0121 interaction: an `@internal` on a member absent from the
rails-private manifest requires a `@noRailsEquivalent` receipt to re-enter the
measured surface. ruby-compat members are _entirely_ absent from that manifest, so
the pairing is mandatory package-wide, not case-by-case. ruby-compat joins that
rule's enrollment set at the same time.

#### Gate 3 — no re-implementation outside the package

The gate the maintainer asked for, and the one the three `escapeRegExp` copies
motivate. A new ESLint rule, `blazetrails/no-ruby-compat-reimplementation`,
following the house shape of `eslint/no-native-date.mjs` / `no-node-builtins.mjs`
(ban a construct outside its sanctioned home) with a scope module and an
only-shrink exclude JSON.

**What it flags:** a function, method or class **declared outside
`packages/ruby-compat/`** whose name is a ruby-compat export name or a registered
known-alias of one. The alias register is seeded from today's tree —
`escapeRegExp` → `regexpEscape`, `isSymbol`, `cmp` / `spaceship` / `compare` →
`Comparable`, a local `fetch` over a `Record`, a second `KeyError` class — and
grows by one row whenever a convergence uncovers another spelling. Cheap, and it
catches every duplicate this RFC inventoried.

**What it cannot do, stated plainly:** it will not catch a copy under a name
nobody has seen. A structural detector — normalized-AST hashing of ruby-compat
export bodies against every candidate declaration in the tree — is the complete
answer, and it is filed as a **report-only** story precisely because its false
positives are unknown until it runs against the real tree. Shipping the name-based
rule first, gated, beats shipping the structural one late and ungated.

**And the structural detector has now run, so that gap has a measurement rather
than a plan** (`structural-duplicate-detector-report`,
`pnpm parity:structural-duplicates:report`). Matching each ruby-compat export's
normalized body — the `skeleton` the TS extractor already records, plus the
literal arguments it erases — against every declaration in `packages/*/src`
returns **732 candidates, of which 4 are real duplicates: precision 0.55%**.

The distribution says why, and it is structural rather than fixable. 708 of the
732 come from five shapes that are one or three tokens long: `constructor`
(220), the four `Comparable` operators (488 between them, whole body
`["ref:call"]` — one delegated call, the shape of every thin wrapper in the
tree). Eleven more come from `Range#inspect` and five from `isBetween`'s
`["ref:call", "if", "ref:call"]`. The primitives this RFC exists to protect are
one-to-three tokens long _because they are primitives_, and a shape that short
cannot be discriminating no matter how the normalizer is written. All four real
hits landed on the longest distinct shapes in the set.

**The recommendation is therefore: do not gate it, and the name-based rule is
the final answer for Gate 3.** A gate at 0.9% precision is a gate that gets
disabled in its first week, and the alternative — a minimum-skeleton-length
threshold — buys precision by excluding exactly the primitives that motivated
the RFC. The command stays in the tree as a report, because it earns its keep
as a periodic audit: this first run found four duplicates
`no-ruby-compat-reimplementation` could not, none spelled like their ruby-compat
counterpart — filed as `converge-activesupport-is-include-to-ruby-compat`,
`converge-activesupport-except-to-ruby-compat` and
`converge-hash-default-proc-seats`.

The exclude JSON is seeded with today's copies, one row each, and each row is
deleted by the move story that converges it. It reaches zero when the value-type moves land.

### Migration shape

Per-primitive, one primitive per PR, in three beats:

1. **Move + shim.** The implementation moves to `packages/ruby-compat/src/`,
   **trimming any surface no call site reaches**, and the old path becomes a bare
   re-export. Nothing outside the package changes, so the PR is reviewable as a
   move and every existing import keeps working.
2. **Flip callers.** Import sites move to `@blazetrails/ruby-compat` and the
   duplicates are deleted, one primitive at a time.
3. **Delete the shims.** One final story, after every caller is flipped.

The shim beat is what keeps each PR under the ceiling and independently
revertable, and it is why beat 3 exists at all. Watch the `declare module`
augmentations: `core-ext/range/compare-range.ts:18`, `overlap.ts:64` and
`conversions.ts:15` all augment `"../../range-ext.js"`, and a re-export shim does
**not** carry a module augmentation — those three retarget in the same PR as the
Range move, not later.

**Dependency direction.** ruby-compat is a leaf and depends on nothing.
Everything else may depend on it. `packages/date` becomes a dependent (it loses
`Rational`), which also removes activemodel's accidental `@blazetrails/date`
edge.

## Non-goals

- **Porting MRI.** Only members with a real call site in this repo, ever. See
  _the standing rule_; this is the package's defining constraint and the reason
  `parity:api:extra` gates it from 0/0.
- **`parity:api` enrollment.** MRI's surface is C; `extract-ruby-api.rb` extracts
  nothing (measured for `date` by RFC 0088's `date-c-source-extractor-decision`).
  `compareApi: false` is permanent, not a flag a later story flips.
- **`compare_by_identity`.** Its only occurrence is `rack/src/headers.ts:481`, a
  Rails-anchored override that raises `TypeError`; nothing calls the real
  semantics.
- **The other seven `NO_JS_CALL_FORM` entries.** `to_s`, `to_str`, `each`,
  `present?`, `blank?`, `catch`, `synchronize` are language constructs (a
  template literal, a `for…of`, a `catch` clause, a body with no mutex), not
  calls a package can supply. Only `key?` / `has_key?` are this RFC's to
  discharge. A Ruby `Mutex` is deferred and is the only thing that could revisit
  `synchronize`.
- **`Proc` and `Proc#call`.** A Ruby Proc **is** a JS function — `proc { |x| … }`
  is an arrow function and `p.call(x)` is `p(x)`. No semantic gap, so nothing to
  port; an export would add surface duplicating a native, which the standing rule
  forbids. The 21 baselined `call` rows are a comparator concern, not a package
  one, and they cannot be closed by a blanket `NO_JS_CALL_FORM` entry either:
  `call` is also the **Rack middleware interface** (`rack/src/index.ts:25`
  declares `call(env)`, and every middleware implements it), so suppressing the
  name globally would hide a dropped middleware-chain call. Per-row work for the
  call-gate RFCs.
- **Natively-portable Enumerable, String and Array methods.** `join`, `split`,
  `match?`, `warn`, `first`, `size`, `map` and friends have same-named or
  already-aliased JS counterparts (bucket B in Motivation §4, 58 rows); their
  baselined divergences are argument semantics, not missing call forms.
- **`Enumerable` as a module.** Asked and measured, 2026-08-29; it does not
  clear the standing rule. Ruby's Enumerable splits three ways in this tree and
  none of the thirds is ours: Rails defines its own
  `core_ext/enumerable.rb` (18 methods — `index_by`, `pluck`, `many?`,
  `compact_blank`, `sole`…), which is **anchored** and must stay in activesupport
  or it loses working `parity:api` coverage; 20 further names
  (`select`→`filter`, `detect`→`find`, `inject`→`reduce`, `any?`→`some`…) already
  resolve through `JS_ENUMERABLE_ALIASES`; and the remainder are natively
  spelled after the snake→camel convention (`flat_map`→`flatMap`,
  `group_by`→`groupBy`). The evidence: Rails calls `flat_map` 87 times,
  `each_with_object` 48, `zip` 29, `group_by` 22 — and **all of them carry zero
  baseline rows**, against ~76 for `Hash`. Exactly **one** hand-rolled helper
  exists in the whole tree (`notifications/fanout.ts:503` `groupBy`, which
  `Object.groupBy` now answers natively). No duplicates, no rows, no receipts:
  there is no debt to home. (`empty?` is the one Enumerable-shaped member with a
  real population — 27 receipts — and it already exists as
  `activesupport/src/ruby-empty.ts`, listed under _Deferred_.)
- **`File`, `Dir`, `Pathname`, `Tempfile` and the fs/path surface.** Also asked
  and measured. It is three populations, and only one is ruby-compat-shaped:
  1. **Rails-anchored, stays.** `core-ext/file/atomic.ts` ↔ `file/atomic.rb`,
     `core-ext/pathname/{blank,existence}` ↔ their `.rb` files, plus
     `configuration-file.ts`, `encrypted-file.ts`, `file-update-checker.ts` —
     all real `ActiveSupport::` classes. Moving any of these destroys working
     coverage.
  2. **The Node platform adapter, which is not Ruby semantics.** `fs-adapter.ts`
     and `getFs()` / `getPath()` / `getCrypto()`. RFC 0089 ruled the
     `*-adapter.ts` family out for this reason and it still holds; more
     concretely, `eslint/no-node-builtins.mjs` hard-codes
     `@blazetrails/activesupport` as the replacement import for `fs`, `path` and
     `crypto`, so re-homing them is a lint-contract change, not a file move.
  3. **Ruby stdlib proper** — `Tempfile`, `Dir::Tmpname` — which IS
     ruby-compat-shaped and is already listed under _Deferred_.

  Even (3) is blocked today, and the blocker is this RFC's own leaf rule:
  `tempfile.ts:86` calls `getCrypto()` from activesupport, so `Tempfile` cannot
  move into a package that takes no workspace dependencies until the adapter
  question in (2) is settled. That is a genuine architectural decision about
  where platform abstraction lives — deliberately **not** smuggled into an RFC
  about value types, and worth its own once this one has proved out. Note also
  that `File`/`Dir` are stdlib rather than the language: `File.join` is 96 Rails
  calls and `File.expand_path` 97, but no port hand-rolls their semantics, so
  there is no measured debt there either.

- **Rails' own Hash core_ext.** `deep_transform_keys` / `deep_transform_keys!`
  (5 baseline rows) and `reverse_merge` are ActiveSupport extensions with real
  `.rb` counterparts, not Ruby core. They stay in activesupport and are excluded
  from the ~48-row figure above; `slice` and `except` ARE Ruby core (2.5 / 3.0)
  and are in scope.
- **Rails-anchored `core_ext` files.** `core-ext/kernel/`, `core-ext/numeric/`,
  `core-ext/securerandom.ts` have real `.rb` counterparts; moving them would
  charge Rails' surface to a non-Rails package and destroy working `parity:api`
  coverage — the inverse of the problem being solved. Only individually
  identified unanchored members are ever in scope, and that identification is
  deferred work.
- **The three divergent Range VALUE shapes.** `range-ext.ts:14`,
  `postgresql/oid/range.ts:26-31`,
  `attribute-methods/time-zone-conversion.ts:375-382` are unrelated node/type
  classes. `0023-surfaced-deviations/unify-three-range-value-shapes` is closed;
  `0119/pg-oid-range-builds-bespoke-range-not-core-range` is the live owner.
- **The object-model primitives.** `Module#include` / `#extend` / `#prepend`,
  `Object#hash`, `rb_equal`, Ruby truthiness, `Tempfile`, `Mutex`, `URI` — all
  real findings, all deferred, all listed and sized above. This RFC is value types.
- **Rewording receipts.** A `@missingRailsCall` or `@noRailsEquivalent` is
  retired by making the call or removing the surface, never by improving its
  prose. (CLAUDE.md: a deviation register is a burndown ledger, not permission.)

## Alternatives considered

- **Reactivate RFC 0089 as-is.** Its central premise is refuted by `ruby/ruby`
  being an ordinary git repository; reactivating would carry that premise into
  the package's permanent contract. See _Relationship to RFC 0089_.
- **Fold the primitives into `packages/date`.** `Rational` already lives there,
  so it is the path of least resistance. Rejected: `date` is a **vendored gem**
  with a gem's contract (its own upstream, its own test suite as the fidelity
  measure). The interpreter is not a gem, and merging the two makes "which
  contract applies here?" a rule contributors must remember rather than a
  structural fact. This is RFC 0089's _split_ argument and it still holds.
- **Fold them into `activesupport`.** Where most of them already sit. Rejected:
  activesupport is a Rails package measured against
  `vendor/rails/activesupport/`, so every Ruby-core file in it is permanently
  unmatched surface, and a leaf package cannot depend on it — which is exactly
  the inversion `compare-range.ts:9` demonstrates today.
- **Extend `CORE_LIBRARY_ALIASES` instead of building a resolution table.**
  Rejected by that table's own comment: an alias list "would ratify the
  divergence this entry exists to make visible". An alias can only ever credit;
  it can never flag a hand-rolled substitute, which is the whole fidelity claim.
- **A second baseline artifact tree for `rubyCompat` rows.** Rejected: RFC 0095
  already solved this shape by putting `kind: "args"` rows in the existing
  `call-mismatches-exclude/` shards with each gate reading only its own kind.
  One artifact, one reseed-drift check, one place to look.
- **Gate the structural duplicate detector from day one.** Rejected: its
  false-positive rate is unmeasured, and a `key in hash ? hash[key] : d` shape is
  three tokens long. A gate seeded on an unmeasured signal is a gate that gets
  disabled. Name-based gated now, structural report-only —
  `structural-duplicate-detector-report` decides whether it can ever gate.
- **Vendor `ruby/spec` separately** (RFC 0089's plan). Unnecessary: MRI mirrors
  the suite in-tree at `spec/ruby/`, so one source yields both the C read-anchor
  and the behavioural suite.
- **Pin MRI to 3.4** (matching the vendored `date` gem's `v3.4.1`). Rejected:
  the gem ref and the interpreter ref are independent, and CI
  (`ci.yml:1412,1685,1798`), the host toolchain and `date.ts:1230`'s written
  behavioural claim are all 3.3. Pinning to 3.4 would make existing in-tree
  citations unverifiable.

## Prior and adjacent work

Live stories elsewhere that this RFC absorbs, answers, or must not collide with.
Each is cited in the story that touches it.

| Story                                                               | Status           | Relationship                                                                                                                                                        |
| ------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0126/converge-regexp-escape-call-gate-verdict`                     | done (#7169)     | Converged 8 copies onto `core-ext/regexp.ts` and added `CORE_LIBRARY_ALIASES`. Its closing note names RFC 0089's package as the eventual home — this RFC is it.     |
| `0023/converge-regexp-escape-onto-one-ported-call`                  | draft            | **Stale** — its seven rows were converged by #7169 and its "Converged shape" points at RFC 0089. `move-regexp-escape-to-ruby-compat` re-points or closes it.        |
| `0041/messagepack-rational-duplicates-the-ported-rational`          | draft            | A **fourth** `Rational` (`message-pack/extensions.ts:27-48`, a local interface + reduction). `move-rational-to-ruby-compat` absorbs it.                             |
| `0023/plain-object-has-no-hash-default-seat`                        | draft            | Asks "decide where a plain-object default seat lives". `ruby-compat-hash-default-proc-and-dig` is that answer.                                                      |
| `0128/converge-alias-tracker-constructor-onto-rails-two-parameters` | draft            | Blocked on a Ruby-Hash default proc existing. This RFC supplies it; that story consumes it.                                                                         |
| `0106/audit-missing-rails-call-permanence-claims`                   | done (#6855)     | The prior audit of `@missingRailsCall` PERMANENT claims. `retire-no-js-call-form-entries-and-fetch-receipts` continues it with a call form that did not exist then. |
| `0106/port-hash-fetch-semantics-validate-and-seeds`                 | done (#6673)     | Ported `Hash#fetch` semantics at specific sites. Establishes the semantics; this RFC gives them one home.                                                           |
| `0092/positional-idiom-analogues`                                   | done             | The measured decision that `first`/`last`/`size`/`any?` cannot be credited by receiver. Bounds what Gate 1 may claim.                                               |
| `0025/triage-no-counterpart-extra-surface-population`               | ready            | Triages the `rubyFile === null` extra-surface slice ruby-compat lands in. Coordinate before enrolling.                                                              |
| `0111/one-shared-nomethoderror-class`                               | draft            | The same consolidation for a sibling Ruby core error class. `KeyError` follows its shape.                                                                           |
| `0089/*` (9 stories)                                                | draft, postponed | Inventory inherited; four re-scoped here, five listed under _Deferred_.                                                                                             |

## Rollout

1. **Phase 0 — foundations.** `vendor-ruby-mri-source` →
   `ruby-compat-package-skeleton` → `ruby-compat-extra-surface-enrollment`;
   `ruby-compat-mri-citation-lint` and `no-ruby-compat-reimplementation-lint` in
   parallel once the skeleton exists. Nothing moves yet.
2. **Phase 1 — value types.** `move-regexp-escape-to-ruby-compat`,
   `move-range-core-and-succ-to-ruby-compat`, `move-rational-to-ruby-compat`,
   `ruby-compat-symbol-conventions`, `ruby-compat-comparable`,
   `ruby-compat-hash-fetch-and-key-error`, then
   `ruby-compat-hash-merge-and-iteration` and
   `ruby-compat-hash-default-proc-and-dig`. Independent of each other; each
   leaves a shim.
3. **Phase 2 — measurement.** `ruby-core-call-mapping-table` (report-only) →
   `enroll-call-mapping-i18n-and-activesupport` →
   `enroll-call-mapping-remaining-packages` →
   `retire-no-js-call-form-entries-and-fetch-receipts`.
   `structural-duplicate-detector-report` and
   `ruby-spec-behavioural-enrollment` run alongside.
4. **Phase 3 — cleanup.** `delete-ruby-compat-reexport-shims`, after every
   value-type story has landed and every caller is flipped.

The _Deferred_ set (the object-model primitives) is deliberately absent from
this rollout; it is a successor RFC's work, scheduled only once these phases
have proved out.

## Verification

Numbers, measured on 2026-08-29 and closed against at the end of Phase 3.

| Metric                                                      | Command                                                                                                                   | Today                                                                                                                                                        | Target                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Private `escapeRegExp` copies                               | `grep -rn "function escapeRegExp" packages/*/src --include=*.ts \| grep -v "\.test\."`                                    | 3                                                                                                                                                            | **0**                                                           |
| Private `fetch(hash, key, default)` copies                  | `grep -rn "^function fetch" packages/*/src --include=*.ts`                                                                | 4                                                                                                                                                            | **0**                                                           |
| Private `isSymbol` copies                                   | `grep -rn "function isSymbol" packages/*/src --include=*.ts \| grep -v "\.test\."`                                        | 5                                                                                                                                                            | **0**                                                           |
| Hand-rolled `<=>`                                           | `grep -rnE "^function (cmp\|compare\|spaceship)\(" packages/*/src --include=*.ts \| grep -v "\.test\."`                   | 3 (a 4th, `date/src/test-date.test.ts:37`, is test-local)                                                                                                    | **0**                                                           |
| `Rational` declarations                                     | `grep -rnE "(class\|interface) Rational\b" packages/*/src --include=*.ts \| grep -v "\.test\."`                           | 2                                                                                                                                                            | **1**                                                           |
| `KeyError` class declarations                               | `grep -rn "class KeyError" packages/*/src --include=*.ts \| grep -v "\.test\."`                                           | 2                                                                                                                                                            | **1**                                                           |
| Ad-hoc `err.name = "KeyError"` sites                        | `grep -rn 'name = "KeyError"' packages/*/src --include=*.ts \| grep -v "\.test\."` — 9 hits, less the 2 real class bodies | 7                                                                                                                                                            | **0**                                                           |
| `@missingRailsCall fetch` receipts                          | `grep -rh "@missingRailsCall fetch" packages/*/src --include=*.ts \| wc -l`                                               | 25                                                                                                                                                           | **0**                                                           |
| `NO_JS_CALL_FORM` entries                                   | `compare.ts:249`                                                                                                          | 9                                                                                                                                                            | **7**                                                           |
| `no-ruby-compat-reimplementation` exclude rows              | the JSON's length                                                                                                         | seeded at today's duplicate DECLARATIONS (**17** = 3+4+5+3+1+1; the seven `err.name` sites are assignments, not declarations, so the rule does not see them) | **0**                                                           |
| `ruby-compat` extra-surface `novel`                         | `pnpm parity:api:extra --package ruby-compat`                                                                             | n/a                                                                                                                                                          | **= total**, monotonically non-increasing after each enrollment |
| Bucket A rows in `call-mismatches-exclude/` (Motivation §4) | the aggregate in §4                                                                                                       | 80 of 601                                                                                                                                                    | **0**                                                           |
| — of which `Hash`                                           | the 12 Hash names in §4                                                                                                   | 76                                                                                                                                                           | **0**                                                           |
| — of which `Regexp.escape`                                  | `escape`                                                                                                                  | 4                                                                                                                                                            | **0**                                                           |
| Rails `Rational(...)` sites trails cannot call              | `grep -rn "Rational(" vendor/rails/{activesupport,activerecord}/lib`                                                      | 20, none callable                                                                                                                                            | **all callable**                                                |
| `parity:api` / `parity:test` deltas                         | the two commands                                                                                                          | —                                                                                                                                                            | **non-negative at every story**                                 |

The RFC has failed, regardless of how much code moved, if the duplicate counts
are not zero — relocation without convergence is the outcome it exists to
prevent.

## Open questions

Each must be resolved or deferred to a named story before `status: active`.

1. **Does a full `ruby/ruby` clone cost too much in CI?** It is substantially
   larger than any currently vendored source. Options: full clone; blobless
   (`--filter=blob:none`); sparse checkout of the C sources plus
   `spec/ruby/core/`. **Recommendation:** measure in
   `vendor-ruby-mri-source` and let the number decide — that story requires the
   measurement in its PR body. Deferred to that story, not to `active`.
2. **Can the comparator resolve a Ruby call's receiver well enough to key the
   mapping on `Hash#fetch` rather than `fetch`?** RFC 0092 measured that it
   cannot, in general, distinguish an Array receiver from a Relation one. The
   design's answer is that an unresolvable row simply does not go in the table,
   which is safe but may leave the table small enough to be not worth it.
   **Recommendation:** `ruby-core-call-mapping-table` reports the resolvable
   population before any package is enrolled; if it is too small to justify the
   gate, that story says so and Gate 1 is descoped to the forward direction
   only. This is the RFC's main technical risk and is deliberately front-loaded.
3. **Does `Comparable` have a workable mixin shape in a package that takes no
   workspace dependencies?** `include()` / `Included<>` live in
   `@blazetrails/activesupport`, which a leaf cannot import. `this`-typed
   functions assigned to the class is the fallback. **Recommendation:** settle it
   in `ruby-compat-comparable`; if neither works, that story blocks with the
   specific blocker rather than inventing a third idiom.
4. **Do `spec/ruby`'s RSpec-shaped files map onto `parity:test` at all?** The
   extractor's known shapes are minitest `def test_` and our `it(...)`.
   **Recommendation:** `ruby-spec-behavioural-enrollment` resolves it and records
   the answer; if the extractor cannot read them, that story blocks and the
   citation lint remains the package's only anchor — which is still stronger
   than RFC 0089's position.
5. **Should `activesupport`'s public surface keep re-exporting `Range` and
   `KeyError`?** Deferred to `delete-ruby-compat-reexport-shims`, which requires
   a per-export decision stated in its PR body rather than an accidental
   narrowing.

## Constraints

- One story per PR; each PR branches from `main`; no stacking; PRs open in draft.
- `compareApi` / `compareTests` stay `false` for the `ruby` source, permanently.
- No member without a call site. No baseline reseed. No mark raised. No package
  removed from an enrollment set to green a run.
- `parity:api` never enrolls ruby-compat.

## Changelog

- 2026-08-29: initial RFC. Supersedes `0089-corelib-primitives`.
