---
rfc: "0194-ruby-compat-native-first"
title: "ruby-compat native-first: a helper only where it dispatches, credited native forms, and single-caller ports inlined"
status: draft
created: 2026-10-16
updated: 2026-10-16
owner: "@deanmarano"
packages:
  - ruby-compat
  - activemodel
  - activerecord
  - activesupport
  - actionpack
  - actionview
  - arel
  - trailties
  - msgpack
  - "activejob"
  - "rack"
  - "rack-test"
clusters:
  - dispatch-cost
  - gate
  - substitution
  - inline
  - enumerable
  - native-sweep
---

# RFC 0194 — ruby-compat native-first

## Summary

`@blazetrails/ruby-compat` ports Ruby core so a Rails body can make the
call Rails makes. Three things have grown on top of that purpose. First, two
dispatch helpers cost about 1 µs per call on the mass-assignment path.
Second, the call gates credit a native JS form for only some Ruby calls, so
helpers like `isEmpty` exist mainly to satisfy a gate. Third, 62
exports have exactly one importing file outside ruby-compat. This RFC
inlines 24 of them, keeps those that own object-model state or are adapter
seams, and triages the rest. This RFC does
three things, in order:

1. **Dispatch cost.** Make `rbObjRespondTo` / `rbFSend` cheap on a
   class-instance receiver without changing what they answer.
2. **Gate.** Credit the native form wherever it is the same operation on a
   receiver kind Ripper proved. Specifically `empty?` / `size` on a proven
   String or Hash, two-argument `Hash#fetch`, and `Hash#except` over literal
   keys.
3. **Substitution and inlining.** Switch call sites to the native form where
   behavior is identical. Inline single-caller helpers at their caller and
   delete the export.

A 2026-10-19 extension adds two more threads:

- **Native required.** The native form is required, not only credited.
  The gates credit the Array, non-0190 Hash, numeric and String forms, and
  a lint reds a listed helper called on a receiver whose static type makes
  the native form identical.
- **Enumerable as free functions.** Enumerable becomes one free function
  per method, `partition(enum, fn)`, over any Iterable or `each`-answerer.
  The `Enumerable` mixin and ActiveSupport's extensions are built on them.

It extends RFC 0190 (native JS hash forms), which settled
`hasKey` / `hashAref` / `hashAset` / `hashDelete` / `merge` / `eachPair`. Those
helpers are out of scope here.

## Motivation

Evidence is from the 2026-10-16 ruby-compat audit
(`~/.btwhooks/data/github/blazetrailsdev/trails/audits/ruby-compat-native-20261016T142201Z.md`).
The timings come from plain `node` against the built
`packages/ruby-compat/dist/index.js`, never under vitest.

| Call                                       | ns/call | Native           | ns    |
| ------------------------------------------ | ------- | ---------------- | ----- |
| `rbFPublicSend(p, "name=", v)`             | 1077    | `p.name = v`     | 8     |
| `rbObjRespondTo(p, "name=")`               | 1029    | `"name" in p`    | 8     |
| `rbObjRespondTo(p, "title")`               | 248     | —                | —     |
| `rbFSend(p, "title")`                      | 186     | `p.title()`      | 9     |
| regex camelize of `set_name` alone         | 485     | —                | —     |
| `except(h, "a")`                           | 382     | rest-destructure | 159   |
| `hashAref` / `fetch` / `isEmpty` / `rtest` | 21–28   | native           | 21–25 |

- `ActiveModel::AttributeAssignment#_assign_attribute`
  (`packages/activemodel/src/attribute-assignment.ts:66-69`) calls
  `rbObjRespondTo` and then `rbFPublicSend` for each attribute, so it pays
  about 2 µs per attribute. About half of that is `writerSpelling`
  (`packages/ruby-compat/src/object.ts:697-704`). It is an uncached
  `replace(/_(…)/g, fn)` that runs in both `basicObjRespondTo`
  (`object.ts:642-643`) and `sendInternal` (`object.ts:1042-1043`).
- `isEmpty` has 174 calls in 74 files. Its JSDoc says it exists "so a ported
  body emits the call the RFC 0047 call-set gate credits"
  (`packages/ruby-compat/src/ruby-empty.ts:24-26`). The gate credits
  `x.length === 0` only when every Ruby site is a proven `array`
  (`scripts/api-compare/compare.ts:782`, `:808-809`).
- `Hash#fetch` "has no native form" (`scripts/parity/ruby-compat.ts:12-14`,
  `scripts/api-compare/compare.ts:344`). The two-argument arm on a plain object
  with a literal key is exactly `Object.hasOwn(h, "k") ? h.k : d`.
- 62 lowercase exports have exactly one importing non-test file outside
  ruby-compat. A further 88 have none.

## Design

### Policy

This extends CLAUDE.md "Hash calls on a plain object" to every ruby-compat
helper. **Write the native form wherever behavior at the call site is
identical. Keep the helper only where it dispatches or where semantics
observably differ.** "Dispatches" means one of three cases: the receiver may
be a `Map` / `Hash`, the receiver answers the call itself (`isEmpty`, `fetch`,
`isRespondTo`, `respondToMissing`), or the name is computed. The same holds
for single-caller ports. A helper with one importing file is inlined at that
caller, reduced to the subset the caller reaches, unless it owns object-model
state (constant tables, ivar seats, module records) or is a platform-adapter
seam (RFC 0135).

Kept on purpose, with no substitution story:

- `rtest`, `isSymbol` and `symbolToS`. They cost the same as native and are
  the sanctioned spellings.
- The RFC 0190 hash helpers. trails#8903 and trails#8951 kept their remaining
  sites one by one.

**Native is required (owner ruling, 2026-10-19).** Where the native form
is identical at a call site, the helper is not merely optional but wrong,
and `ruby-compat-native-required-lint` enforces that. The helper families
kept on purpose are the object model (`include` / `extend` / `defineModule`,
`rbObjDup` / `rbObjClone`, singleton class, constants, `rbFSend` /
`rbObjRespondTo` for computed names and `method_missing` receivers), the
Hash semantics JS lacks (`fetch`, `deleteIf` / `keepIf` / `hashReplace`,
the `Hash` class for its README features), exceptions and Kernel (error
classes, `excSetupMessage`, `rbFLoad`, `block()` / `rbBlockGivenP`,
`toEnum`), and `rbInspect` for Ruby-rendered messages. Any other helper
survives only at sites where it dispatches or where semantics differ, and
each sweep PR lists those sites.

### Dispatch cost (no semantic change)

- Memoize `writerSpelling`, or skip the regex when `attr` has no `_`.
- `basicObjRespondTo` checks the core-receiver tables (string, array,
  temporal, enumerable, plain hash) before it walks the prototype chain. Move
  those checks behind a receiver-kind test so a class instance goes straight
  to the walk. Every probe stays, in MRI order, for the receivers it can
  match.
- `rb-f-send-cost-on-arel-visit-hot-path` (RFC 0154) already covers the
  `sendInternal` preamble and is not edited here. This RFC only orders it
  next to `basic-obj-respond-to-instance-fast-path`, which shares the cache
  below.
- Cache, per prototype (a `WeakMap`), whether the receiver's chain defines
  `respondToMissing` / `isRespondTo`. A plain class instance without either
  answers by direct property lookup before any core-receiver probe.

### Visibility: one send, one respond-to

Trails has no runtime privates (CLAUDE.md § "Method visibility is
compile-time only"). The visibility variants therefore collapse:

- `rbFPublicSend` is deleted in favor of `rbFSend`, whose body it already
  shares.
- `rbObjPrivateMethods` / `rbObjProtectedMethods` / `rbObjPublicMethods` /
  `rbModPublicMethodDefined` are deleted in favor of `rbObjMethods` /
  method-defined.
- `rbObjRespondTo` / `basicObjRespondTo` lose the visibility flag.

A Rails override keeps its Rails parameter list and does not read
`include_private`. **Removal path (owner ruling, 2026-10-16):** an arm whose
only difference is `include_private` (`!include_private && super(name, true)`)
is removed. The compare tools learn the shape
(`compare-drops-include-private-only-arms`), so the removal needs no per-site
receipt. `@missingRailsCall <call> — PERMANENT` is the fallback where the
detector cannot prove the arm. The
arm is not kept as dead Rails-shaped code.

Dispatch then follows one rule:

| Receiver                                                                   | Form                                                        |
| -------------------------------------------------------------------------- | ----------------------------------------------------------- |
| trails class, no `respondToMissing` / `isRespondTo` in chain, literal name | `recv.m(...)`, `recv.x = v`, `typeof recv.m === "function"` |
| same, computed name                                                        | `recv[name](...)`, `recv[attr] = v`                         |
| core value, CLAUDE.md Proxy row, or a `respondToMissing` definer           | `rbFSend` / `rbObjRespondTo`                                |

### Gate

Each change adds a credit and never a suppression. No name joins
`NO_JS_CALL_FORM`, and every credit is scoped to a Ripper-proven receiver
kind, as `POSITIONAL_ARRAY_ANALOGUES` already does.

- `empty?` / `size` / `length` are also credited for a `string` or `hash`
  kind. `first` / `last` stay array-only.
- `fetch` gets a `NATIVE_FORM_ANALOGUES` row. It requires a `hasOwn ? h.k : d`
  mark, a `hash` kind, two Ruby arguments and no block.
- `except` gets a `NATIVE_FORM_ANALOGUES` row for a rest-destructure over
  literal keys on a `hash` kind. `slice` stays helper-only, because it skips
  absent keys and an object literal would not.
- `Kernel#send` leaves `RUBY_COMPAT_EXPORTS`. The reverse reading must never
  demand `rbFSend` over `recv[name](...)`, because `send` is not a scored name
  (`compare.ts:419-428`).

- Array forms on a proven `array` kind: `compact`, `uniq`, `union`,
  `take` / `drop`, `to_h`, `zip`, `count` with a block, and `sort` with no
  block (`native-analogues-array-calls`). Their `Array#*` rows leave
  `RECEIVER_KEYED_RUBY_COMPAT_EXPORTS`, so the reverse reading stops
  demanding the helper.
- Hash `keys` / `transform_values` / `each_value` / `values_at` / `dup`, and
  numeric and string `to_i` / `to_f` / `round` / `nan?` / `strip` / `chomp`,
  each scoped to the kind and to the form that is actually identical
  (`native-analogues-hash-and-scalar-calls`).
- `call-args` reads argument 1 of an Enumerable free function as the Ruby
  receiver and a trailing function as its block
  (`call-args-enumerable-free-function-receiver`).
- `blazetrails/ruby-compat-native-required` is a type-aware lint over an
  only-grow helper list. Each sweep enrolls its helpers in its own PR.

### Substitution and inlining

The sweeps are per package and per helper. Each needs the gate credit for
its helper first. Single-caller inlining needs no gate change, because none of
the candidates is a credited name.

### Enumerable as free functions

Enumerable is ported three times today. There is the `Enumerable` mixin in
`ruby-compat/src/enumerable.ts:602`, the Array-only `partition` /
`groupBy` / `first` in `array.ts`, and the Ruby-core `groupBy` / `tally` /
`filterMap` / `inBatchesOf` in `activesupport/src/enumerable-utils.ts`.
The owner chose free functions (2026-10-19). `enumerable.ts` exports one
function per ported method, at its convention name, taking
`Iterable<T> | Each<T>` as argument 1. Array, Set, Map (as pairs),
generators and `each`-answerers all work, and so does an `each` that
answers a promise. The mixin members become one-line this-typed delegations,
and ActiveSupport's `index_by` / `many?` / `pluck` / `maximum` take any
Iterable and call the core functions where Rails' body does. `Enumerable` also becomes a class module whose constructor wraps any
Iterable, so `new Enumerable(xs).partition(fn)` is a second spelling over
the same bodies. The call gates credit it as `xs.partition`
(`enumerable-wrapper-over-any-iterable`). Rule 1 still
holds, so a function lands only with a caller. Hand-rolled loops porting
`each_slice` / `min_by` / `tally` / `each_with_object` are those callers.

## Non-goals

- **The RFC 0190 hash helpers.** They were already decided site by site.
- **Removing `rbFSend` / `rbObjRespondTo`.** Computed names and
  `method_missing` receivers need them.
  `converge-four-divergent-public-send-ports` moves sites toward them, and
  this RFC does not undo that.
- **A runtime visibility carrier.** CLAUDE.md "Method visibility is
  compile-time only" rules it out.
- **Inlining `keepIf`.** It has one caller (`routing/mapper.ts`), but
  CLAUDE.md's hash table lists `keep_if` as "always helper", so it stays.

## Alternatives considered

- **Add `empty?` / `fetch` to `NO_JS_CALL_FORM`.** Rejected. It would hide a
  dropped `Relation#empty?` / `Cache::Store#fetch` (`compare.ts:333-343`).
- **Inline-cache each dispatch helper per call site.** Deferred. Removing
  the regex and the probe order should come first, and the gain should be
  measured before adding cache invalidation.

## Rollout

Gate groundwork lands before anything it credits or excuses is deleted or
substituted. The dependency chain is: gate stories (phase 1), then the
dispatch-cost and visibility-collapse stories (phase 2), then the sweeps and
inlining (phase 3). `native-respond-to-and-send-literal-name-sites` (phase 3)
depends on the collapse (phase 2), which depends on the three visibility
compare stories (phase 1) and on `converge-four-divergent-public-send-ports`
(RFC 0189).

1. Phase 1, gate: `call-gate-credits-empty-size-on-proven-string-and-hash`,
   `native-form-analogue-for-two-arg-hash-fetch`,
   `native-form-analogue-for-hash-except-rest-destructure`,
   `ruby-compat-table-drops-kernel-send`,
   `compare-drops-include-private-only-arms`,
   `compare-visibility-reflection-calls-are-permanent-skips`,
   `call-args-drops-visibility-boolean-argument`.
2. Phase 2, dispatch cost and visibility: `writer-spelling-camelize-memo`,
   `basic-obj-respond-to-instance-fast-path`,
   `collapse-visibility-variants-of-send-and-respond-to`, plus the existing
   `rb-f-send-cost-on-arel-visit-hot-path` (RFC 0154).
3. Phase 3, substitution and inlining: `native-is-empty-sites-activerecord-arel`,
   `native-is-empty-sites-remaining-packages`,
   `native-fetch-two-arg-literal-key-sites`,
   `native-except-literal-key-sites`,
   `native-respond-to-and-send-literal-name-sites`,
   `inline-single-use-msgpack-packer-helpers`,
   `inline-single-use-string-byte-helpers`,
   `inline-single-use-numeric-and-array-helpers`,
   `triage-ruby-compat-exports-with-no-external-importer`,
   `native-first-policy-docs`.

4. Phase 4, native required and Enumerable (2026-10-19): gates
   `native-analogues-array-calls`, `native-analogues-hash-and-scalar-calls`,
   `ruby-compat-native-required-lint` and
   `call-args-enumerable-free-function-receiver` come first. They are
   followed by `enumerable-free-functions-over-iterable`,
   `enumerable-mixin-built-from-free-functions`,
   `enumerable-wrapper-over-any-iterable` and
   `enumerable-free-functions-for-hand-rolled-sites`, and by the sweeps
   `native-array-access-sites`, `native-array-set-op-sites`,
   `native-array-conversion-and-hash-sites` and `native-scalar-sites`.
   Each sweep depends on its gate story and on the lint.

## Verification

- `AttributeAssignment#_assign_attribute` costs under 100 ns per assigned
  `name=` attribute, down from about 2100 ns (`rbObjRespondTo` +
  `rbFPublicSend`). This is measured on dist with the audit's plain-node
  benchmark. `native-respond-to-and-send-literal-name-sites` owns the site.
- `rbObjRespondTo` on a class-instance hit is under 80 ns, and on an `x=`
  name under 550 ns.
- `isEmpty` is imported by at most 20 non-test files outside ruby-compat. Each
  remaining file is listed in its sweep PR with the dispatching receiver
  (Map, Set, or a class answering `isEmpty`).
- `fetch` and `except` keep only the sites their sweep PRs list as dispatching
  or semantically different.
- Every helper inlined by phase 3 is gone from
  `packages/ruby-compat/src/index.ts`, and so are `rbFPublicSend`,
  `rbObjPrivateMethods`, `rbObjProtectedMethods`, `rbObjPublicMethods` and
  `rbModPublicMethodDefined`.
- `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and
  `pnpm parity:api:calls:ruby-compat` stay green with no new baseline rows.

- `ruby-compat-native-required` is green with every helper converted by
  phase 4 enrolled, and each surviving site carries a disable comment that
  names its dispatching receiver or semantic difference.
- `groupBy` / `partition` / `tally` / `filterMap` each have exactly one
  definition, in `ruby-compat/src/enumerable.ts`.

## Open questions

None. Both questions raised in drafting are resolved:

1. **`keepIf`.** It is kept as a helper (see Non-goals).
2. **ruby-compat README rule 1.** It is amended to "two or more importing
   files, or object-model state / adapter seam" by `native-first-policy-docs`.

## Changelog

- 2026-10-16: initial RFC, from the ruby-compat native audit.
- 2026-10-16: visibility collapse; owner chose the removal path for `include_private` arms.
- 2026-10-16: review: reordered phases to follow deps, folded the Thor story into the collapse, added the `except` sweep, numeric verification, resolved open questions.
- 2026-10-19: owner rulings fold in native-required (lint + Array/Hash/scalar credits + sweeps) and Enumerable as free functions; kept helper families listed under Policy.
- 2026-10-19: owner asked for the iterable wrapper too: `Enumerable` is a class module that wraps any Iterable.
