---
rfc: "0000-ruby-compat-native-first"
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
clusters:
  - dispatch-cost
  - gate
  - substitution
  - inline
---

<!-- Unnumbered until merge: `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number at merge. -->

# RFC — ruby-compat native-first

## Summary

`@blazetrails/ruby-compat` ports Ruby core so a Rails body can make the
call Rails makes. Three things have grown on top of that purpose. First, two
dispatch helpers cost about 1 µs per call on the mass-assignment path.
Second, the call gates credit a native JS form for only some Ruby calls, so
helpers like `isEmpty` exist mainly to satisfy a gate. Third, about 25
exports have a single caller that uses a small part of them. This RFC does
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

### Phase 1: dispatch cost (no semantic change)

- Memoize `writerSpelling`, or skip the regex when `attr` has no `_`.
- `basicObjRespondTo` checks the core-receiver tables (string, array,
  temporal, enumerable, plain hash) before it walks the prototype chain. Move
  those checks behind a receiver-kind test so a class instance goes straight
  to the walk. Every probe stays, in MRI order, for the receivers it can
  match.
- Widen the existing `rb-f-send-cost-on-arel-visit-hot-path` to cover the
  `sendInternal` preamble.
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
is removed. The declaration carries
`@missingRailsCall <call> — PERMANENT` against that CLAUDE.md section. The
arm is not kept as dead Rails-shaped code.

Dispatch then follows one rule:

| Receiver                                                                   | Form                                                        |
| -------------------------------------------------------------------------- | ----------------------------------------------------------- |
| trails class, no `respondToMissing` / `isRespondTo` in chain, literal name | `recv.m(...)`, `recv.x = v`, `typeof recv.m === "function"` |
| same, computed name                                                        | `recv[name](...)`, `recv[attr] = v`                         |
| core value, CLAUDE.md Proxy row, or a `respondToMissing` definer           | `rbFSend` / `rbObjRespondTo`                                |

### Phase 2: gate

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

### Phase 3: substitution and inlining

The sweeps are per package and per helper. Each needs the Phase 2 credit for
its helper first. Single-caller inlining needs no gate change, because none of
the candidates is a credited name.

## Non-goals

- **The RFC 0190 hash helpers.** They were already decided site by site.
- **Removing `rbFSend` / `rbObjRespondTo`.** Computed names and
  `method_missing` receivers need them.
  `converge-four-divergent-public-send-ports` moves sites toward them, and
  this RFC does not undo that.
- **A runtime visibility carrier.** CLAUDE.md "Method visibility is
  compile-time only" rules it out.

## Alternatives considered

- **Add `empty?` / `fetch` to `NO_JS_CALL_FORM`.** Rejected. It would hide a
  dropped `Relation#empty?` / `Cache::Store#fetch` (`compare.ts:333-343`).
- **Inline-cache each dispatch helper per call site.** Deferred. Removing
  the regex and the probe order should come first, and the gain should be
  measured before adding cache invalidation.

## Rollout

1. Phase 1: `writer-spelling-camelize-memo`,
   `basic-obj-respond-to-instance-fast-path`,
   `collapse-visibility-variants-of-send-and-respond-to`, plus the existing
   `rb-f-send-cost-on-arel-visit-hot-path`.
2. Phase 2: `call-gate-credits-empty-size-on-proven-string-and-hash`,
   `native-form-analogue-for-two-arg-hash-fetch`,
   `native-form-analogue-for-hash-except-rest-destructure`,
   `ruby-compat-table-drops-kernel-send`.
3. Phase 3: `native-is-empty-sites-activerecord-arel`,
   `native-is-empty-sites-remaining-packages`,
   `native-fetch-two-arg-literal-key-sites`,
   `native-respond-to-and-send-literal-name-sites`,
   `inline-single-use-msgpack-packer-helpers`,
   `inline-single-use-string-byte-helpers`,
   `inline-single-use-numeric-and-array-helpers`,
   `thor-command-visibility-enumerators-collapse`,
   `triage-ruby-compat-exports-with-no-external-importer`,
   `native-first-policy-docs`.

## Verification

- Mass assignment of one `name=` attribute costs under 100 ns in
  `rbObjRespondTo` + `rbFPublicSend` combined, down from about 2100 ns. This
  is measured on dist with the audit's benchmark script.
- `isEmpty` importers fall from 74 files to the receivers that dispatch
  (Map / Set / a class answering `isEmpty`).
- Every helper inlined by Phase 3 is gone from `packages/ruby-compat/src/index.ts`.
- `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green, with
  no new baseline rows.

## Open questions

1. **`keepIf` has one caller (`routing/mapper.ts`).** CLAUDE.md lists
   `keep_if` as "always helper". Recommendation: keep it, since it is a
   CLAUDE.md row, and leave it out of inlining.
2. **Ruby-compat README rule 1 ("only what trails actually calls").** One
   caller satisfies it today. Recommendation: amend the rule to "two or more
   importing files, or object-model state / adapter seam", in
   `native-first-policy-docs`.

## Changelog

- 2026-10-16: initial RFC, from the ruby-compat native audit.
- 2026-10-16: visibility collapse; owner chose the removal path for `include_private` arms.
