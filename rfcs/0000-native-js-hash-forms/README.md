---
rfc: "0000-native-js-hash-forms"
title: "Native JS hash forms: the call gates credit `in` / `delete` / `Object.assign` / element access as the Hash call they port, and the ruby-compat hash helpers shrink to what JS lacks"
status: draft
created: 2026-10-10
updated: 2026-10-10
owner: "@deanmarano"
packages:
  - ruby-compat
  - activesupport
  - activemodel
  - activerecord
  - actionpack
  - actionview
  - trailties
  - rack
  - rack-session
  - rack-test
  - i18n
  - arel
clusters:
  - gate
  - substitution
  - carrier-audit
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. Never use a `draft-` prefix —
     `draft` is a lifecycle status, not a dir prefix (see top-level README). -->

# RFC — Native JS hash forms

## Summary

A Rails option hash is a plain JS object in trails, and JS already has a form
for most of what Rails does to one: `k in h`, `h[k]`, `h[k] = v`,
`delete h[k]`, `Object.assign(h, other)`, `for (const [k, v] of
Object.entries(h))`. Today a port spells those as calls into
`@blazetrails/ruby-compat` (`hasKey(h, k)`, `hashAref`, `hashAset`,
`hashDelete`, `mergeBang`, `eachPair`), because the call gates only credit a
Ruby `key?` / `delete` / `merge!` when the TS body makes a call of a mapped
name. There are about 336 such call sites in source. This RFC does three
things, in order:

1. **Gate.** Teach the TS extractor to record each native form as a marked
   form, and the comparator to credit the Ruby hash call a form ports. The call
   stays in the comparison. No name joins `NO_JS_CALL_FORM`.
2. **Substitution.** Replace the helper call sites with the native form wherever
   the native form means the same thing at that site, and shrink `hash.ts` to
   the arms JS has no form for.
3. **Carrier and HWIA audit.** Convert the few string-keyed `new Hash()` sites
   to plain objects, ratify which `Hash` features are permanent, and inventory
   the `HashWithIndifferentAccess` consumers against what Rails passes.

Not every site converts. A native form replaces a helper only where it does
the same thing: most `hashDelete` sites use the value Ruby's `delete` returns
and JS's does not, and `fetch` has no native form at all. Those keep the
helper, and the RFC reports the residual rather than promising zero.

The scope is the repo owner's ruling of 2026-10-10: "I don't want things to use
hash or hashwithindifferentaccess unless specific features are necessary."

## Motivation

### What the helpers are

`packages/ruby-compat/src/hash.ts` is 1,490 lines (its test,
`hash.trails.test.ts`, is 1,264). The helpers are functions over `object` /
`Record<string, T>`, not methods of a carrier. Measured 2026-10-10 on trails
`main` at `ddd629745a`, counting lines that call the name in
`packages/*/src/**/*.ts`, with `hash.ts` itself excluded:

| Helper        | Ruby        | Non-test lines | Of which `.name(` on a class | With test files |
| ------------- | ----------- | -------------- | ---------------------------- | --------------- |
| `hasKey`      | `key?`      | 107            | 12                           | 184             |
| `hashDelete`  | `delete`    | 94             | 0                            | 107             |
| `mergeBang`   | `merge!`    | 76             | 26                           | 128             |
| `eachPair`    | `each_pair` | 39             | 9                            | 57              |
| `hashAref`    | `[]`        | 28             | 0                            | 82              |
| `hashAset`    | `[]=`       | 25             | 0                            | 30              |
| `deleteIf`    | `delete_if` | 12             | 2                            | 19              |
| `keepIf`      | `keep_if`   | 2              | 0                            | 10              |
| `hashReplace` | `replace`   | 2              | 0                            | 5               |
| **Total**     |             | **385**        | **49**                       | **622**         |

The request that opened this RFC quoted the right-hand column (622) as the
non-test count. It is the count with test files, and 61 of the test-file sites
are `hash.trails.test.ts` testing the helpers themselves. The population this
RFC substitutes is about **336 helper call sites in source** (385 lines less
the 49 that are a method call on `Rack::Headers`, `Session`, HWIA and the like,
which are ported Rails members and stay) plus about 41 in other packages' test
files.

`fetch` (about 100 call sites) and `merge` (about 66) are also hash helpers and
are decided here (§ "Per-name decisions"), though `fetch` is not substituted.

### Why the helpers exist

RFC 0129 put them there on purpose. `key?` and `has_key?` used to sit in
`NO_JS_CALL_FORM`, because the only JS spelling of an object-hash membership
test was the `in` operator or `x.k !== undefined`, "a shape the gate cannot
tell from a dropped guard" (`scripts/api-compare/compare.ts:303-307`).
`hasKey` gave the gate a callee to see, the two entries were discharged, and
the ports were moved onto the call. The rows that bind the helpers today are in
`scripts/parity/ruby-compat.ts`:

- `RUBY_COMPAT_EXPORTS` (`:45-67`): `Hash#key?` / `Hash#has_key?` → `hasKey`,
  `Hash#each_pair` → `eachPair`, `Hash#delete_if` → `deleteIf`.
- `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS` (`:100-129`): `Hash#delete` →
  `hashDelete`, `Hash#merge!` → `mergeBang`, `Hash#merge`, `Hash#fetch`,
  `Hash#replace` → `hashReplace`, `Hash#include?` → `hasKey`, each admitted
  only for a receiver Ripper proved a hash.

Read forward, a row credits the helper. Read in reverse by
`scripts/api-compare/lint-ruby-compat-calls.ts`, a flagged call that resolves
to an export is a row telling the port to import it, across all 24 enrolled
packages. So a port that writes `"public" in options` where Rails wrote
`options.key?(:public)` is red on `parity:api:calls` and is told to call
`hasKey`. That is the dependency this RFC has to remove first.

`scripts/parity/conventions.ts:1469` (`HAS_PREDICATE_ALIASES`,
`["key?", "hasKey"]`) is a different table and is **not** changed. It spells a
ported member: `Rack::Headers#key?` is `Headers#hasKey` (`:1140-1156`),
`Request::Session#key?` is `Session#hasKey`. Removing the row would unmap
those members and would not affect how a `hasKey(h, k)` call is credited.

### What the helpers cost

- A reader who knows Rails and JS has to learn nine names to read an option
  hash being read.
- Each helper carries arms a plain-object site never takes: `hasKey` probes
  the prototype, an own `isKey` method and `instanceof Map` before it answers
  (`hash.ts:189-201`), on every option read.
- The call form hides which sites need Ruby's semantics. `hashDelete` returns
  the stored value; 78 of its 97 call sites use that value and 19 are a bare
  statement, and the two read the same.

## Design

### The crediting mechanism: a marked native form, not an exemption

`NO_JS_CALL_FORM` (`compare.ts:413`) removes a Ruby name from significance
everywhere. RFC 0149 used it for `symbolize_keys`, and it was right there: a
bare-keyed object is already normalized, so the faithful port has no code at
the site at all. A hash read is different. The port still has code at the site,
and the gate should still demand it.

The mechanism to extend is `NATIVE_FORM_ANALOGUES`
(`scripts/api-compare/enumerable-idioms.ts:262-284`). The TS extractor marks a
callee-less construct it saw in a body with the `@` prefix (`@length`,
`@length:<receiver>`, `@import`, `@timer`, `@invoked:<name>`;
`extract-ts-api.ts:6693-6801`), and `hasNativeFormAnalogue`
(`compare.ts:848-871`) drops a Ruby call from significance for **one body**
only when its paired TS body carries the form, the Ruby receiver kind is one
the row admits, and the receiver's name matches the name in the mark. That is
how `.length` credits `size` today.

This RFC adds these forms. Each mark is emitted bare and with the receiver's
trailing name, as `@length` is:

| Mark              | TS construct                                 | Ruby call it credits                      |
| ----------------- | -------------------------------------------- | ----------------------------------------- |
| `@in:<recv>`      | `k in recv`, `Object.hasOwn(recv, k)`        | `key?`, `has_key?`, `include?`, `member?` |
| `@delete:<recv>`  | `delete recv[k]`, `delete recv.k`            | `delete`                                  |
| `@assign:<recv>`  | `Object.assign(recv, other)`                 | `merge!`, `update`                        |
| `@spread:<recv>`  | `{ ...recv, ...other }`                      | `merge`                                   |
| `@entries:<recv>` | `for (const [k, v] of Object.entries(recv))` | `each_pair`                               |

`[]` and `[]=` need no mark. Element access already tokenizes as `ref:get` and
`assign:computed` (`extract-ts-api.ts:6177-6183`), the spellings `hashAref` /
`hashAset` exist to match
(`scripts/api-compare/operator-order-spelling.ts:79-90`). The story for that
pair confirms it against fixtures and fixes whatever does not hold.

A dropped call stays visible under this mechanism. If Rails has
`options.key?(:public)` and the port has neither `hasKey(options, …)` nor a
membership test on `options`, the body carries no `@in:options` and the row
flags, as it does now. The receiver-name match is what `NO_JS_CALL_FORM`
cannot give.

### Answering `compare.ts:330-352`

That note declines this same trade for `size` / `empty?` / `first` / `last`
and says `delete`, `merge` and `fetch`, "all real JS call forms", stay in. It
is right about its population, and this RFC does not touch it. The hash forms
differ on two counts.

**The forms cannot stand in for a query.** The danger the note names is a port
that rewrites `relation.first` as `records[0]` over a preloaded array: a
plausible edit, valid TypeScript, and it drops a query. The equivalent edit
here would be `delete association[record]` for `association.delete(record)`,
`Object.assign(relation, other)` for `relation.merge(other)`, or
`"id" in relation` for `relation.include?(record)`. None of those is a port
anyone writes, and none does anything on a `Relation`. `.length` and `[0]` are
the natural JS for the dangerous rewrite; `delete x[k]` and `in` are not.

**The receiver is checked anyway.** Each new row sets `receivers: "explicit"`,
so a bare call with no receiver never credits: a bare `merge(other)` inside
`Relation` is `Relation#merge` and keeps flagging. Every Ruby site's receiver
name must also match the name in a mark, so `@options.key?(:x)` is credited by
`"x" in this.options` and not by `"x" in this.other`. `delete`, `merge` and
`merge!` additionally refuse a `const` receiver and stay receiver-keyed on the
ruby-compat side, as they are now, and `include?` / `member?` credit only on a
receiver Ripper proved a hash.

An `ivar` receiver IS admitted, unlike for `.length`
(`LENGTH_READ_UNCREDITED_RECEIVER_KINDS`, `enumerable-idioms.ts:293-297`).
That table refuses ivars because `@records.size` may be a `Relation`. Here the
first point carries it: no port writes `"x" in this.records`. And refusing
ivars would strand every `@options.key?` site on the helper. The gate story
measures the receiver kinds of the Ruby sites behind today's helper calls and
reports any the rows still refuse, so this is checked against the data before
substitution starts.

What the note's two MEASURED re-checks established (2026-08-08 and 2026-09-18)
is that a receiver **token** cannot separate an Array from a Relation. This
RFC does not claim it can. It claims that the TS **form** separates them: a
body containing `delete options[k]` is a body operating on an object.

The note's sentence listing `delete`, `merge`, `fetch` as staying in is
rewritten by the gate story to say what is now true: they stay in the
comparison, and a native form is one of the things that satisfies them.

### Per-name decisions

A helper is replaced at a site only when the native form means the same thing
**at that site**. The helpers were written to carry Ruby semantics JS does not
have, and each difference below is real. "Stays" means the helper keeps its
export and its row, and the site keeps the call.

| Ruby                    | Helper                 | Native form                                                                                                             | Where the helper stays                                                                                                                                                                                                                                                    |
| ----------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key?` / `has_key?`     | `hasKey`               | `k in h` for a literal key on an object the port built or received as options; `Object.hasOwn(h, k)` for a computed key | The receiver may be a `Map`, a `Hash`, or a class answering `isKey` (the helper dispatches, `hash.ts:197-200`). The object can carry `{ name: undefined }` for an absent keyword, which `hasKey` reads as absent and `in` reads as present (`hash.ts:194-196`).           |
| `[]`                    | `hashAref`             | `h[k]`                                                                                                                  | The site depends on a miss answering `null` rather than `undefined`, on a `Hash` default, on a non-Hash receiver's `get`, or reads a computed key that could name an `Object.prototype` member (`hash.ts:406-424`).                                                       |
| `[]=`                   | `hashAset`             | `h[k] = v`                                                                                                              | The key is caller-supplied and could be `"__proto__"`; the receiver may be frozen and a test asserts `FrozenError`; the receiver may be a `Map` or answer `set` (`hash.ts:433-456`).                                                                                      |
| `delete`                | `hashDelete`           | `delete h[k]`                                                                                                           | The removed **value is used**, which is 78 of 97 sites: `delete` in JS answers a boolean, so JS has no expression for Ruby's value-returning delete. Also the block arm and `FrozenError`.                                                                                |
| `merge!` / `update`     | `mergeBang` / `update` | `Object.assign(h, other)`                                                                                               | A conflict block is passed, or either side may be a `Map` (`hash.ts:301-321`).                                                                                                                                                                                            |
| `merge`                 | `merge`                | `{ ...h, ...other }`                                                                                                    | A conflict block is passed; the result must be ancestor-less so `__proto__` stays an ordinary key, which is what the helper returns (`hash.ts:939-941`).                                                                                                                  |
| `each_pair`             | `eachPair`             | `for (const [k, v] of Object.entries(h))`                                                                               | The receiver may be a `Map` or answer its own `each`; the call's return value (the receiver) is used.                                                                                                                                                                     |
| `fetch`                 | `fetch`                | **none**                                                                                                                | Everywhere. See below.                                                                                                                                                                                                                                                    |
| `delete_if` / `keep_if` | `deleteIf` / `keepIf`  | none mandated                                                                                                           | Everywhere. JS has no in-place filter over an object, and the helper applies Ruby truthiness to the block result (`hash.ts:465-486`). `SKELETON_IDIOM_LOWERINGS` already admits a hand-written loop for `delete_if` (`enumerable-idioms.ts:402-407`); `keep_if` joins it. |
| `replace`               | `hashReplace`          | none                                                                                                                    | Everywhere (2 sites). Clear-then-copy with a `FrozenError` has no JS form.                                                                                                                                                                                                |

**`fetch` is not substituted and gets no native form.** `h.fetch(:k, d)`
answers the stored value whenever the key exists, including a stored `nil` or
`false`, and raises `KeyError` with one argument. `h.k ?? d` substitutes the
default for a stored `null`, and `h.k` on a miss answers `undefined` where
Ruby raises. CLAUDE.md § "Ruby idioms that do not translate literally" names
this as a recurring silent divergence. `fetch` is the clearest case of a
feature Ruby has and JS does not, and `h.k ?? d` keeps flagging.

**`in` versus `Object.hasOwn`.** The ruling names `k in obj`. `in` walks the
prototype chain, so `"constructor" in {}` and `"toString" in options` are
true, an answer Ruby never gives (`hash.ts:190-192`). The rule for a port is:
`in` when the key is a literal that is not an `Object.prototype` member name,
`Object.hasOwn(h, k)` when the key is computed or caller-supplied. Both emit
`@in`. The substitution stories apply this per site.

### Workstream 1: gate

Six stories in cluster `gate`. Everything else depends on the second.

1. `native-hash-form-marks-in-ts-extractor`: the five marks.
2. `native-hash-forms-credit-key-delete-merge`: the `NATIVE_FORM_ANALOGUES`
   rows for `key?`, `has_key?`, `include?`, `member?`, `delete`, `merge!`,
   `update`, `merge`; the reverse gate reading a credited form as converged;
   the `compare.ts:303-307` and `:330-331` notes rewritten.
3. `native-hash-each-pair-entries-loop-credit`: `each_pair`, and `keep_if`
   joining the lowering table.
4. `native-hash-element-access-credits-aref-aset`: `[]` and `[]=`.
5. `native-hash-form-marks-carry-literal-key`: the argument gate. A native-form
   row drops the Ruby call from significance, so nothing pairs its arguments.
   `hashDelete(options, "public")` is checked against `:public` today, and
   `delete options.public` would not be. The mark carries a literal key and
   `parity:api:calls:args` compares it.
6. `native-hash-policy-docs-and-table-notes`: the CLAUDE.md bullet, the
   ruby-compat README, and the table comments.

No row leaves `RUBY_COMPAT_EXPORTS` or `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS`
while a call of its helper remains: the residual sites still need the forward
credit. No `SKIP_GROUPS` entry changes. Nothing joins `NO_JS_CALL_FORM`.

### Workstream 2: substitution

Eleven stories in cluster `substitution`, split by helper and package so each
PR stays under the LOC ceiling, plus one that shrinks `hash.ts` afterwards.
Each story:

- Reads the Rails body for every site before changing it and decides native or
  stays from § "Per-name decisions".
- Edits by hand, site by site. No regex sweep (§ "Risks").
- Records the sites it left on the helper, with the reason, in the PR body.
- Carries its packages' test-file sites.

`native-hash-shrink-hash-ts-to-residual` then applies ruby-compat's rule 1,
"only what trails actually calls" (`packages/ruby-compat/README.md:163`): an
arm with no remaining caller is deleted with its tests, and an export with no
remaining caller is deleted with its table row.

### Workstream 3: the `Hash` carrier and HWIA

**The carrier is not the debt.** `Hash` (`hash.ts:985`, `extends Map<K, V>`,
`@noRailsEquivalent PERMANENT`) has 58 non-test construction sites outside
`hash.ts`. Of the 38 bare `new Hash()`, most key on objects (`Base`,
`JoinPart`, `Arel.Attribute`, `unknown[]`:
`associations/join-dependency.ts:103,161,267,276`,
`associations/preloader/association.ts:101,133,354`,
`preloader/through-association.ts:37`, `relation/where-clause.ts:197`,
`actionview/src/renderer/partial-renderer/collection-caching.ts:114,144`,
`connection-adapters/abstract/transaction.ts:451,550`,
`connection-adapters/deduplicable.ts:27`), which a plain object cannot do.
Nine sites call `compareByIdentity`. The rest pass a default or a default
proc. These features are permanent, and
`native-hash-carrier-permanent-features-ratified` writes them down:

- the `default` / `default_proc` seat (`Hash.new(obj)`, `Hash.new { }`);
- `eql?` / `hash` key equality over object keys (`#eqlKeys`, `#stHash`);
- `compare_by_identity` (`#identhash`);
- `FL_FREEZE` on the hash itself (`#frozen`);
- the iteration level that makes a write during `each` raise (`#iterLev`).

Five sites are string-keyed with none of those features and convert to a plain
object in `native-hash-string-keyed-carriers-to-plain-objects`:
`connection-adapters/statement-pool.ts:18`, `persistence.ts:657`,
`actionpack/src/test-helpers/abstract-unit.ts:535`,
`activemodel/src/attribute-mutation-tracker.ts:207` and `:211`. A sixth
candidate, `hash-with-indifferent-access.ts:581` (`HWIA#to_hash`), stays: Rails
copies the receiver's default onto the result (`set_defaults(copy)`,
`hash_with_indifferent_access.rb:376-381`), which needs the default seat.

**HWIA is audited, not changed.** `ActiveSupport::HashWithIndifferentAccess`
is a Rails class and its port stays as it is. `native-hash-hwia-consumer-audit`
checks each of the 20 non-test files that name it against the Rails file it
mirrors and files a story for any consumer where Rails passes a plain `Hash`.
A first pass while writing this RFC checked every construction site and found
each one backed by a Rails HWIA (the table is in the story), so the audit may
well file nothing. The files that only name the type are what is left to
check.

### Existing stories this RFC changes

Open stories in other RFCs that move code toward the helpers or the carrier,
found 2026-10-10 by grepping every non-done story for the helper names. None is
closed by this PR: closing is a `tasks close` verb and waits for this RFC to
be accepted.

| Story (RFC)                                                                                                                                          | Status | Disposition once this RFC is active                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `activesupport-hash-utils-merge-retires-onto-ruby-compat-hash-merge` (the `ruby-compat-surfaced-deviations` RFC)                                     | draft  | **Close as superseded.** It moves importers of activesupport's `{ ...hash, ...otherHash }` spread onto ruby-compat's `merge`. Under this RFC the spread is the port. What is left of it, deleting the activesupport `merge` / `mergeBang` wrappers (`hash-utils.ts:114-121`, 5 importing files), is folded into `native-hash-merge-bang-sites-activerecord-activemodel-activesupport-trailties`. |
| `port-ruby-enumerable-reject-delete-if-and-merge-bang` (the retired `surfaced-deviations` RFC)                                                       | draft  | **Close, premise gone.** It exists to delete four baseline rows for `compact_blank` / `deep_merge!`; no `compact_blank` or `deep_merge` row is left under `call-mismatches-exclude/activesupport/`, and the primitives it asks to port into activesupport are in ruby-compat.                                                                                                                    |
| `statement-pool-includes-enumerable-and-each-delegates-to-cache` (the `activerecord-api-parity-100` RFC)                                             | ready  | **Conflict, needs a ruling.** It relies on the per-pid cache being a `Hash` (trails#8716) so `each` is `this.cache.each(block)`. `native-hash-string-keyed-carriers-to-plain-objects` makes that cache a plain object, where Rails has `{}` (`statement_pool.rb:11`). Whichever is worked second rebases onto the other; see open question 4.                                                    |
| `ruby-hash-each-iterators-on-hash` (the `activesupport-out-of-closure-surface` RFC)                                                                  | draft  | **Keep, minus one paragraph.** `each*` on the `Hash` class is carrier work and stays. Its suggestion that three `Map`-backed sites "could converge if those maps were `Hash` instances" runs against the ruling and should be struck.                                                                                                                                                            |
| `hash-readers-disagree-with-haskey-on-an-undefined-valued-key` (`ruby-compat-surfaced-deviations`)                                                   | draft  | **Keep; it gates open question 1.** Until one rule holds for an `undefined`-valued key, `in` and `hasKey` disagree on exactly the objects the substitution stories have to leave alone.                                                                                                                                                                                                          |
| `hash-block-marker-and-own-method-probe-cost-a-quarter-of-attribute-reads` (`ruby-compat-surfaced-deviations`)                                       | draft  | **Keep, narrower.** Its `ownMethod` half shrinks with every substituted site; re-profile after the `[]` / `[]=` activemodel story before working it.                                                                                                                                                                                                                                             |
| `hash-stand-in-update-assigns-proto-key-and-skips-frozen-check`, `hash-delete-if-keep-if-reject-have-no-map-arm` (`ruby-compat-surfaced-deviations`) | draft  | **Keep.** They harden arms this RFC keeps. `native-hash-shrink-hash-ts-to-residual` should run after them or re-check them.                                                                                                                                                                                                                                                                      |
| `index-name-for-remove-tests-name-by-key-presence` (`activerecord-api-parity-100`)                                                                   | ready  | **Keep.** Its converged shape names `hasKey`; once its callers stop forwarding `name: undefined` it can use `in`.                                                                                                                                                                                                                                                                                |

Stories that ask for a `Hash` because Rails has a default, an identity or an
`eql?` key (`column-alias-tracker-builds-hash-new-zero`,
`join-dependency-instantiate-seen-and-model-cache-are-default-proc-hashes`,
`journey-gtg-builder-identity-hashes-are-plain-maps`,
`attribute-types-default-is-a-proxy-not-a-hash-default`) and those that ask
for an HWIA where Rails returns one
(`mass-assignment-and-where-read-parameters-to-h-as-a-hash`) are earned uses
and are unaffected.

## Non-goals

- **Changing `HashWithIndifferentAccess`.** It is Rails API, ported faithfully.
  Ruled out by the repo owner, 2026-10-10.
- **Removing the `Hash` class.** Its features are the ones JS lacks.
- **Substituting `fetch`.** JS has no form with `fetch`'s stored-`nil` and
  `KeyError` arms.
- **A `NO_JS_CALL_FORM` entry for any hash name.** It would undo RFC 0129's
  discharge of `key?` and blind the gate; the marked form credits without
  blinding.
- **Array and String helpers** (`aryDelete`, `aryIncludes`, `stringSplit`, …).
  The same question applies to them and is a separate RFC if it is asked.
- **`size` / `empty?` / `first` / `last` / `any?`.** `compare.ts:320-402`
  stands as written.
- **`transformValues`, `slice`, `except`, `valuesAt`, `eachKey`, `eachValue`,
  `keys`, `dup`, `reject`, `inspect`.** JS has no single form for most, and
  none was in the ruling. A follow-up can take the ones that do
  (`Object.keys`).
- **`hash.trails.test.ts`'s own 61 helper calls.** They test the helpers.

## Alternatives considered

- **`NO_JS_CALL_FORM` entries for the hash names**, as RFC 0149 did for
  `symbolize_keys`. Rejected: an omission would pass everywhere, including
  where the port dropped the read. RFC 0129 removed `key?` from that set for
  this reason.
- **Leave the helpers and change nothing.** Rejected by the ruling.
- **Substitute everywhere and accept the semantic drift** (`in` for every
  `hasKey`, a discarded value for every `hashDelete`). Rejected: about 80% of
  `hashDelete` sites use the returned value, and `in` answers true for
  `Object.prototype` names. That would trade a naming preference for bugs.
- **Substitute first and baseline the red rows.** Rejected: CLAUDE.md § "A
  documented deviation is debt, not permission" forbids widening a baseline to
  cover new work, and roughly 300 rows would be added.
- **Carrier-only scope, or helpers without the gate change.** These were the
  two smaller options put to the repo owner, who chose this one.

## Rollout

1. **Gate.** `native-hash-form-marks-in-ts-extractor`, then
   `native-hash-forms-credit-key-delete-merge`. After it:
   `native-hash-each-pair-entries-loop-credit`,
   `native-hash-element-access-credits-aref-aset`,
   `native-hash-form-marks-carry-literal-key`,
   `native-hash-policy-docs-and-table-notes`.
2. **Substitution**, each story from `main` once its gate story has merged:
   - `key?`: `native-hash-key-sites-actionpack-rack-i18n`,
     `native-hash-key-sites-activerecord-activemodel`,
     `native-hash-key-sites-trailties-activesupport-actionview`.
   - `merge!`: `native-hash-merge-bang-sites-actionpack-actionview-rack-session`,
     `native-hash-merge-bang-sites-activerecord-activemodel-activesupport-trailties`.
   - `delete`: `native-hash-delete-sites-actionview`,
     `native-hash-delete-sites-actionpack-trailties-rack-test`,
     `native-hash-delete-sites-activerecord-activemodel-activesupport`.
   - `[]` / `[]=`: `native-hash-aref-aset-sites-activemodel`,
     `native-hash-aref-aset-sites-activerecord-actionpack-activesupport-arel`.
   - `each_pair`: `native-hash-each-pair-sites`.
   - Then `native-hash-shrink-hash-ts-to-residual`.
3. **Carrier and audit**, independent of phase 2:
   `native-hash-carrier-permanent-features-ratified`,
   `native-hash-hwia-consumer-audit`, and
   `native-hash-string-keyed-carriers-to-plain-objects` (after
   `native-hash-each-pair-sites`).

The substitution stories are chained by `deps` so that no two that share a
package are open at once: the three `key?` stories have disjoint packages and
run in parallel, each `merge!` story follows the `key?` stories it shares a
package with, `delete` follows `merge!`, `[]` / `[]=` follows `delete`, and
`each_pair`, which touches every package, runs last. The longest chain is five
PRs deep. `native-hash-string-keyed-carriers-to-plain-objects` follows
`each_pair`, because both edit `persistence.ts:657-661`.

## Verification

Measured the same way as § "Motivation", from trails `main`:

- `parity:api:calls`, `parity:api:calls:args` and the ruby-compat reverse gate
  stay green on every PR with **no** new baseline row, `@missingRailsCall` or
  `@missingRailsArgs` receipt added by this RFC.
- `NO_JS_CALL_FORM` has the same nine entries it has today.
- Non-test helper call lines fall from 385. No target count is set per helper,
  because the residual is whatever § "Per-name decisions" keeps; each
  substitution PR states its before and after counts and lists what stayed and
  why. Expected order of magnitude: `hasKey` under 30, `mergeBang` under 15,
  `hashAref` + `hashAset` under 20, `eachPair` under 10, and `hashDelete`
  near 78 (the value-using sites).
- A comparer fixture proves the negative for each form: a Ruby body with
  `options.key?(:x)` paired with a TS body holding no membership test on
  `options` still flags, and one holding `"x" in other` still flags.
- `new Hash` non-test sites outside `hash.ts` fall from 58 to 53.
- `hash.ts` and `hash.trails.test.ts` are shorter than 1,490 and 1,264 lines.
- The HWIA audit table is complete for all 20 files, and every finding is a
  filed story.

## Risks

- **The gate sees less than it did.** A call records a callee and an argument
  list. A form mark records a construct and a receiver name. Until
  `native-hash-form-marks-carry-literal-key` lands, `delete options.public`
  is not checked against `:public`. And a receiver-name match is weaker than a
  callee: a body that tests `"a" in options` credits every `options.key?` site
  in the paired Ruby body, as one `hasKey` call credits them all today. The
  loss is the argument pairing, not the count.
- **This reverses part of RFC 0129.** That RFC moved ports onto `hasKey` to
  make a population measurable. Moving them back onto `in` is only sound
  because the form is now marked. If the mark stories slip and substitution
  starts anyway, the result is the pre-0129 state. The `deps` edges exist to
  prevent that, and no substitution story may be opened against a red gate
  with a baseline row.
- **A mechanical sweep rewrites things it should not.** A regex over
  `hasKey(` also matches `Headers#hasKey`, `Session#hasKey`, and HWIA's own
  member (49 lines are that), and matches identifiers inside test titles,
  which `parity:test` keys on and which CLAUDE.md forbids renaming. Each site
  is edited by hand, and each PR diffs its test titles against `main`.
- **A native form is not always the same operation.** The table in
  § "Per-name decisions" lists the differences: prototype members and
  `undefined`-valued keywords for `in`, the returned value for `delete`,
  `null` against `undefined` for a miss, `FrozenError` against `TypeError`,
  `"__proto__"` as a key. A site converted without reading its Rails body is
  the CLAUDE.md "Ruby idioms that do not translate literally" trap applied 336
  times. Where a site cannot be shown equivalent, it stays on the helper.
  Leaving it is a correct outcome of a substitution story, not a failure of
  one.
- **The residual may be large.** If most sites stay, the RFC delivers a
  smaller change than its framing suggests. `hashDelete` is already known to
  keep about four fifths of its sites. That is the honest result of "unless
  specific features are necessary", and the verification section reports the
  residual rather than a target.
- **Two spellings during the rollout.** Between the first substitution PR and
  the last, the repo has both. The policy story lands before any of them so
  the rule is written down while they coexist.
- **Hot paths.** Replacing `hasKey` on option reads removes three probes per
  call. No story depends on that, and none should cite it without a benchmark
  taken outside vitest.

## Open questions

<!-- Every question here must be resolved or explicitly deferred (to a named
     follow-up RFC/story) before this RFC moves to `status: active`. -->

1. **Does `h[k] !== undefined` credit `key?`?** It is the only native spelling
   that reads `{ name: undefined }` as absent, which is how trails forwards an
   absent keyword, and it is the shape `compare.ts:303-307` says the gate
   cannot tell from a dropped guard. Recommendation: no. Those sites keep
   `hasKey`, which is a feature the helper has and `in` does not.
2. **Do `delete_if`, `keep_if` and `replace` stay on their helpers?** The
   ruling's list of native forms does not name one for them, and
   § "Per-name decisions" keeps all three (16 lines). Recommendation: keep.
   If the answer is a hand-written loop, it is one more substitution story
   and no gate work, since the lowering table already admits the loop.
3. **Should a value-using `delete` be split into a read and a `delete`
   statement?** That would take `hashDelete` from about 78 residual sites to
   near zero, at two statements per site and a changed evaluation order where
   the call sat inside an expression. Recommendation: no. Ruby's `delete`
   returns the value, JS's does not, and that is a feature Ruby has.
4. **`StatementPool`'s inner cache: plain object or `Hash`?** Rails has `{}`
   and `cache.each(&block)`. trails#8716 made it a `Hash`, and
   `statement-pool-includes-enumerable-and-each-delegates-to-cache` builds on
   that. Recommendation: plain object, per the ruling, with `each` as a
   `for…of` over `Object.entries` (`each` is already in `NO_JS_CALL_FORM`).
5. **Activation.** The RFC lands `draft`, and its stories `draft`. Flipping it
   to `active` and promoting the stories is the owner's call once the
   questions above are answered.

## Changelog

- 2026-10-10: initial RFC. Scope ruled by the repo owner the same day (full
  native substitution; HWIA audited, not changed). Counts re-measured at
  trails `ddd629745a`: the 622 figure the request carried includes test files;
  the source population is 385 lines.
- 2026-10-10: self-review pass. Substitution stories re-chained so no two
  sharing a package are open at once; `ivar` receivers admitted for the hash
  forms; line citations corrected; § "Existing stories this RFC changes" added.
