---
rfc: "0194-ruby-compat-native-first"
title: "ruby-compat native-first: a helper only where it dispatches, credited native forms, and single-caller ports inlined"
status: active
created: 2026-10-16
updated: 2026-10-22
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
  - "scripts"
clusters:
  - dispatch-cost
  - gate
  - substitution
  - inline
  - enumerable
  - native-sweep
  - ledger
  - deletion
  - send
priority: 1
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

### Burndown ledger (2026-10-22)

The repo owner's 2026-10-22 ruling, "burn ruby-compat down; no `Module`, no
runtime privates, lean towards JS equivalents", extends this RFC to every one of
the 488 value exports of `packages/ruby-compat/src/index.ts`. Each export gets
exactly one bucket ([Appendix A](#appendix-a-the-ledger)), the story that owns
its deletion is named, and five stories are added for the gaps nothing owned.
`Module` itself stays with RFC 0197, and its rows here point there. This
section was first drafted as a separate RFC (tasks#291) and folded in at the
owner's request.

| Bucket                                           | Exports | Owner                                                  |
| ------------------------------------------------ | ------: | ------------------------------------------------------ |
| KEEP · semantic gap (MRI-cited)                  |     231 | —                                                      |
| KEEP · stdlib / platform seam, no JS counterpart |     159 | —                                                      |
| CONVERGE (export stays, an arm or table goes)    |      31 | this RFC, 0197                                         |
| DELETE · JS form is the faithful port            |      28 | this RFC's sweeps (28)                                 |
| UNEXPORT / DELETE · no importer outside the pkg  |      29 | `triage-ruby-compat-exports-with-no-external-importer` |
| DELETE · visibility residue                      |       6 | `collapse-visibility-variants-of-send-and-respond-to`  |
| DELETE · `Module` residue                        |       4 | 0197 (2), this RFC (2)                                 |
| **Total**                                        | **488** |                                                        |

#### How the ledger was measured

Every number in this RFC is reproduced by the commands in
[Appendix B](#appendix-b-measurement-commands), run on trails `637fa04f91`
(2026-10-22):

- **Population.** Named value exports of `packages/ruby-compat/src/index.ts`
  (`export { … } from`; `export type` excluded): **488**. The index has no
  `export *`.
- **Importer count** (`src` / `test` columns). Files under `packages/*/src`,
  ruby-compat excluded, that import the name from `@blazetrails/ruby-compat[/…]`.
  It also counts files that import one of the 25 names activesupport and
  activerecord re-export (`include`, `extend`, `included`, `rbHash`,
  `rbEqual`, `Module`, `BigDecimal`, …) through that re-export. `src` is
  non-`*.test.ts`, so test-helpers and canonical models count as source.
- **Citation.** The first `vendor/ruby/v3.3.11/<file>:<line>` in the export's
  own JSDoc. `ruby-compat-needs-mri-citation` already resolves these against
  the tree. Four exports carried no machine-readable citation and were looked
  up by hand in `vendor/ruby/v3.3.11/`: `kernelCatch` → `vm_eval.c:2342`
  `rb_f_catch`; `stringToSym` → `symbol.c:862` `rb_str_intern`; `classpaths`
  → `variable.c:364` `rb_class_path`; `classModule` is a trails brand that
  CLAUDE.md ratifies.

#### KEEP · semantic gap — 231

The export stays because the JS form answers differently at a call site
trails has. The headline gaps, each read in `vendor/ruby/v3.3.11/`:

| Export                         | Observable difference                                                                                                                                      | MRI                                                                                              |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `fetch`                        | returns a **stored** `nil`/`false` when the key exists; `??` substitutes for it                                                                            | `hash.c:2176` `rb_hash_fetch_m`                                                                  |
| `rtest`                        | only `nil`/`false` are falsy; `0`, `""` and `NaN` are truthy                                                                                               | `include/ruby/internal/special_consts.h:138` `RB_TEST`                                           |
| `isEmpty`                      | `empty?` dispatches by receiver: string, array, `Map`/`Hash` and an object that answers `isEmpty` itself; `.length === 0` answers only the first two       | `string.c:2243` `rb_str_empty`, `array.c:2686` `rb_ary_empty_p`, `hash.c:3023` `rb_hash_empty_p` |
| `strip` / `rstrip`             | strips `\0` plus ASCII whitespace only; `String#trim` strips Unicode spaces (`U+00A0`) and keeps `\0`                                                      | `string.c:9802`, `:9890`                                                                         |
| `succ`                         | alphanumeric carry (`"az".succ == "ba"`)                                                                                                                   | `string.c:4868` `rb_str_succ`                                                                    |
| `Rational`                     | canonicalizes and reduces on construction                                                                                                                  | `rational.c:481` `nurat_s_canonicalize_internal`                                                 |
| `rbObjDup` / `rbObjClone`      | allocate the receiver's class and dispatch `initialize_dup` / `initialize_clone` / `initialize_copy`; `{...o}` / `structuredClone` do neither              | `object.c:591` `rb_obj_dup`, `:536` `rb_obj_clone`, `:634` `rb_obj_init_copy`                    |
| `rbEqual` / `rbHash` / `rbEql` | dispatch to a TS `==` / `hash()` / `eql()`; `===` and `Map` keys call no hook                                                                              | `object.c:147` `rb_equal`, `:160` `rb_eql`, `hash.c:344` `rb_obj_hash`                           |
| `rbCallSuper`                  | resumes the `super` search from the seat the include copied over (CLAUDE.md § "A module included by an open set of classes binds `super` at include time") | `vm_eval.c:366` `rb_call_super`                                                                  |

The other 222 are listed in Appendix A with their citations. They are
ordinary MRI ports (numeric coercion, `sprintf`, `Kernel#Integer`, the error
hierarchy's messages, `Symbol` / `String` conversions, constant lookup). None
has a builtin whose result matches at every trails call site. Where a subset
of call sites does have one, that is one of this RFC's native-form sweeps at the call site
and the export stays. § "Policy" is the rule: native wherever behaviour
is identical, helper only where it dispatches or differs.

#### KEEP · stdlib / platform seam — 159

These have no JS counterpart at all, so the question does not arise. One line
each, by family:

- **Serialization:** `Marshal`, `JSON`, `Base64`, `Zlib` / `GzipWriter`, `PP`
  / `PrettyPrint`. They are Ruby formats or Ruby-rendered output.
- **Text scanning and encoding:** `StringScanner`, `StringIO`, `Encoding` and
  its errors, `MatchData`. They are Ruby objects with Ruby state.
- **Numbers and values:** `BigDecimal` / `toD`, `Rational`, `Complex`, `Range`,
  `Set`, `Struct`. These are Ruby value types.
- **Files and processes:** `File`, `Dir`, `FileUtils`, `Pathname`, `IO` /
  `STDOUT` / `puts`, `Tempfile`, `Process`, `Open3`, `rbFSystem`, `Gem`,
  `RbConfig`. Their API is Ruby's, over the RFC 0135 backend contract.
- **Network and crypto:** `URI` and its parsers / errors, `IPAddr`,
  `TCPSocket`, `OpenSSL` / `Cipher` / `HMAC`, `Digest`, `SecureRandom`.
- **Concurrency:** `Thread`, `Mutex`, `Monitor`, `Queue`, `Fiber`, `Timeout`,
  and the `Concurrent` executors. Ruby's concurrency API, over Node.
- **Platform adapters** (`register*` / `get*` / `*Config` for fs, os, process,
  crypto, http, zlib, child-process, async-context). They are the RFC 0135
  backend seams and are called by applications, not by trails' own source,
  which is why several show 0 importers. They carry the backend contract
  instead of an MRI anchor.
- **The exception hierarchy** (`StandardError` … `FrozenError`, `Errno`).
  These are Ruby class identities that `rescue` matches on.

#### DELETE · JS form — 28

The helper's whole body is the JS builtin on the receivers trails passes, or
it is an identity. 26 are already owned by this RFC's sweeps. Each sweep first needs
its gate credit, which § "Gate" orders before the sweep. Two are owned by
nobody, and this RFC files
**`delete-identity-and-alias-ruby-compat-helpers`** for them:

- **`strUminus`** (`string/support.ts`): its body is `return str`. Ruby's
  `String#-@` (`string.c` `str_uminus`) answers a frozen, deduplicated copy.
  A JS string is already immutable and has no identity (CLAUDE.md § "Ruby
  Strings are JS string primitives"), so `-str` ports as `str`. It has 13
  call sites in `activerecord`: `column.ts:131-136`,
  `sql-type-metadata.ts:76`, `mysql/type-metadata.ts:55` and
  `test-fixtures.ts:99-101`. The call gate needs `-@` on a proven string
  credited as an omitted call, the way `freeze` already is
  (`scripts/api-compare/lint-calls.ts:206`).
- **hash `inspect`** (`hash.ts`): its body is `return rbInspect(hash)`. It is
  a second export name for one function, with 2 importers.

#### UNEXPORT / DELETE · no importer — 29

These names have no importer outside ruby-compat, in source or tests. Most are
used inside the package: `MatchData` has 38 internal references, `succ` 31,
`ConverterNotFoundError` 10. For those the action is to stop exporting them,
not to delete them. `triage-ruby-compat-exports-with-no-external-importer`
already owns this classification. Its measured list is a superset of this
one, since it was taken before the re-export count. This RFC hands that story
the Appendix A rows and files nothing.

#### `Module` is retired — the remaining inventory

**Live sites.** On `637fa04f91`, `rg 'new Module\('` finds 61 sites in 45 package
source files and 96 in tests, outside ruby-compat (`pnpm parity:modules`, the
shipped ratchet, reports OK):

| Package       | Sites (files) | Owning story (RFC 0197 unless noted)                                                                                                                                              |
| ------------- | ------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| actionpack    |       40 (26) | `actionpack-module-super-inlined-into-includers` (claimed), `actionpack-route-set-helper-modules-without-live-include`, `lazy-route-set-url-helpers-without-splice`               |
| actionview    |       12 (10) | `actionview-module-super-remaining-modules`; 0140's `actionview-helper-modules-as-live-modules`                                                                                   |
| activerecord  |         5 (5) | `activerecord-module-super-and-live-include-sites`, `test-fixtures-plain-module-under-active-support-test-case` (in progress), `generated-attribute-methods-without-live-include` |
| activesupport |         3 (3) | `activesupport-callbacks-and-log-subscriber-test-helper-plain-modules`; `current-attributes.ts` under `activemodel-activesupport-module-super-inlined-into-includers`             |
| activemodel   |         1 (1) | `activemodel-activesupport-module-super-inlined-into-includers` (`attribute-methods.ts`)                                                                                          |
| tests         |            96 | `test-files-drop-ruby-compat-module`                                                                                                                                              |

Every site is owned. Each falls under one of the three ratified shapes, which
are the plain-object module, the class module and `@inlinedFrom` inlining,
with the `rbCallSuper` seat for an open includer set. The exceptions are the
two cases CLAUDE.md records as open:

- **A method defined on a module after it is included.** These are the
  route-set url-helper modules and `LazyRouteSet`'s `method_missing_module`,
  owned by `actionpack-route-set-helper-modules-without-live-include` and
  `lazy-route-set-url-helpers-without-splice`. The other is generated
  attribute methods, owned by `generated-attribute-methods-without-live-include`
  (blocked, trails#9056).
- **A `super` that reaches a live-include module.** This is
  `live-include-module-sites-after-module-super-conversion` (blocked behind the
  per-package `super` conversions).

The endgame is `delete-ruby-compat-module-class-final` (blocked on all of the
above). The hold, `module-count-ratchet-blocks-new-ruby-compat-modules`,
shipped in trails#9190. **This RFC files no `Module` conversion story.**

**One residue nothing owns: the `initialize` hook machinery.** RFC 0188 ruled
that trails has no `initialize` methods: a module's `initialize` is inlined
into the constructor. The machinery that predates that ruling is still in
`include.ts`. It is the `initialize` symbol (`include.ts:968`), the
`instanceInitializers` / `prependedInstanceInitializers` registries,
`initializeIncludedModules` (`:1004`), `trackInstanceInitializer` (`:1050`) and
`spliceInstanceInitializer` (`:1070`), about 180 lines. It has **0 source
callers**; `ActionController::Metal`, its one caller when 0138 measured it,
has since converted. Its only callers are three trails-only tests:
`trailties/src/thor/shell.trails.test.ts:19`,
`activerecord/src/trailties/controller-runtime.trails.test.ts:35` and
`actionpack/src/action-dispatch/routing/url-for.trails.test.ts:49,66`. They
reach it through the activesupport re-export (`activesupport/src/index.ts:561`).
This RFC files **`delete-module-initialize-hook-machinery`**. Deleting it
moots two 0154 drafts: `module-initialize-hook-takes-no-constructor-args` and
`spliced-initialize-runs-pre-yield-twice-and-skips-ensure`.

**Carrier-only deviation stories.** Fifteen open RFC 0154 drafts name the
carrier, `new Module` or `superMethod` in their bodies. Once
`delete-ruby-compat-module-class-final` lands, each is either moot (close
`FALSIFIED:`) or restated against the plain-object / class-module shape. This
RFC files the triage **`triage-carrier-only-ruby-compat-deviation-stories`**,
with a `deps` edge on the final deletion, so nobody works one in the meantime.
The fifteen are `concern-class-methods-builds-a-module`,
`free-function-include-on-a-module-target-drops-nested-modules`,
`prepend-copies-onto-the-class-so-super-method-cannot-resume-from-it`,
`module-method-missing-proxy-is-spliced-from-an-included-block`,
`rb-obj-dup-open-codes-kernel-initialize-dup`,
`ruby-compat-rb-define-module-reopens-a-namespace`,
`rb-obj-is-kind-of-misses-module-extend-object`,
`class-copy-does-not-carry-prepend-origin-or-registries`,
`psych-to-ruby-revives-a-mapping-as-a-record-where-marshal-answers-a-map`,
`module-include-drops-class-module-accessors`,
`marshal-class2path-renders-anonymous-module-as-class`,
`rb-mod-ancestors-lists-prepended-module-after-the-class`,
`concern-append-features-into-a-plain-module`,
`module-super-method-resolves-on-every-call` and `marshal-userdef-and-time-dump`.

**How far `include.ts` shrinks.** `include.ts` is 2387 lines and
`include.test.ts` is 2660. The carrier accounts for:

| Span (`include.ts`)                                                                                                                   | Lines | Goes with                                 |
| ------------------------------------------------------------------------------------------------------------------------------------- | ----: | ----------------------------------------- |
| `class Module` and its JSDoc (`:179-801`)                                                                                             |  ~620 | `delete-ruby-compat-module-class-final`   |
| carrier helpers: `carrierOf`, `linksOf`, `relinkIncluders`, `iclassBeneath`, `appendPlainFeatures` / `recordPlainModule` (`:803-903`) |  ~100 | `delete-ruby-compat-module-class-final`   |
| `initialize` hook machinery (`:925-1107`)                                                                                             |  ~180 | `delete-module-initialize-hook-machinery` |
| `instanceof Module` / `carrierOf` arms elsewhere in the file (51 references)                                                          |   ~80 | `delete-ruby-compat-module-class-final`   |

That is about **980 lines, roughly 40% of `include.ts`**. On the test side,
`include.test.ts` has 83 `new Module(` constructions across its 176 `it`s, so
expect a comparable share of it to go. What remains is `include` / `extend` /
`prepend` over plain-object and class modules, `rbModAppendFeatures`,
`rbCallSuper`, the ancestry readers, `defineModule`'s section record (which
CLAUDE.md keeps) and `rbObjDup` / `rbObjClone`. `prepend.ts` (153 lines) holds
no carrier reference and does not shrink.

#### No runtime privates — the residue audit

CLAUDE.md § "Method visibility is compile-time only" is settled, and the audit
proposes no mechanism. It searched `packages/ruby-compat/src` (non-test) for
any parameter, flag, table, `#private` emulation or Proxy that models
visibility at run time:

- **Already owned by `collapse-visibility-variants-of-send-and-respond-to`:**
  - `rbFPublicSend`, which is `sendInternal` exactly as `rbFSend` is;
  - `rbObjPrivateMethods` / `rbObjProtectedMethods`, whose bodies are
    `return []` (`method.ts:195`, `:205`);
  - `rbObjPublicMethods`;
  - `rbModPublicMethodDefined`;
  - the `pub` / `priv` flags on `basicObjRespondTo` (`object.ts:650`, read
    only as `!pub` at `:733`) and `rbObjRespondTo` (`:1329`).
- **Missed by it, and added to that story's acceptance criteria by this RFC's
  PR:**
  - `rbModPublicInstanceMethod` (`include.ts:1414`), whose body is
    `return rbModInstanceMethod(mod, mid)`. Its one caller is
    `activerecord/src/attribute-methods.ts:107`.
  - `checkDefinitionVisibility` (`object.ts:759`). The name says visibility
    but the function checks definition only. It becomes the shared body of
    `rbModMethodDefined` under a definition name.
- **Not residue, and stays:**
  - `objRespondToMissing` (`object.ts:746`) is the port of
    `BasicObject#respond_to_missing?`. A Rails override reaches it through
    `super`, and its `priv` parameter is the Ruby parameter list, which this RFC's
    collapse story keeps.
  - `NoMethodError#isPrivateCall` reports whether the failed call was an
    fcall. That is a fact about the call, not about visibility.
  - `defineModule`'s section record is the load-time mechanism CLAUDE.md names
    and keeps.

There is no `#private` emulation and no visibility Proxy in the package.

#### The send floor

`pnpm parity:api:sends` reports **OK (143, 143 at 637fa04f91)**. That is 143
literal-name sends across **102 files**. The largest are
`activerecord/src/tasks/database-tasks.ts` (8),
`activemodel/src/type/helpers/time-value.ts` (7),
`activerecord/src/connection-adapters/abstract/quoting.ts` (5) and
`actionpack/src/action-dispatch/testing/integration.ts` (4); the full list is
in Appendix B. **63 of the 143 are `"call"`**, Rack apps and middlewares
calling `app.call(env)`, which a typed `app` spells directly. Package source
makes **296** `rbFSend` / `rbFPublicSend` calls in total, so about 153 have a
computed name. `native-respond-to-and-send-literal-name-sites` owns the
literal ones.

**Can the name guessing go?** Of the 143 literal names, exactly one is spelled
in Ruby with a `?`, `=` or operator. The rest are TS spellings. So once the
literal sends are spelled directly, the guessing serves only computed names.
For those, the floor is the three open-set sites CLAUDE.md names:

- `Object#try` (`try.rb:14-15`) and `Channel::Base#dispatch_action`
  (`base.rb:280-286`). Their names come from application code.
- `MimeResponds::Collector#any` (`mime_responds.rb:262-264`). Its names come
  from `Mime::Type.register`.

Of the machinery inside `sendInternal` (`object.ts:1182`):

- **The `x=` → setter / `setX` arm stays.** `_assign_attribute` passes
  `"#{k}="` for application attribute names, and `setX` is the ratified
  spelling of an async Ruby writer (CLAUDE.md § "Fidelity is the job").
- **The `foo?` → `isFoo` arm, `RELOPS` and the operator arms**
  (`object.ts:1187-1205`) stay only if a computed-name caller reaches them.
  Today no literal one does.
- **The core-receiver method tables** (`STRING_METHOD_TABLE`,
  `TEMPORAL_METHOD_TABLE`, `ARRAY_METHOD_TABLE`, `ENUMERABLE_METHOD_TABLE`,
  `CLASS_METHOD_TABLE`, `OBJECT_METHOD_TABLE`) serve sends whose receiver is a
  string, a temporal or an array. Examples are the literal `"downcase"`,
  `"getutc"` and `"isInfinite"`. They shrink as those sites are spelled as
  direct helper calls.

This RFC files **`delete-send-name-guessing-arms`**. It measures, per arm,
which computed-name callers reach it, deletes the arms none reach, and
records the floor with its callers. It depends on the literal-name sweep and on
0154's `triage-send-name-guessing-stories-against-the-direct-call-rule`. It
makes `writer-spelling-camelize-memo` moot wherever the deleted arm is
the one that story would memoize.

#### Holding the burndown

No new gate is needed; four existing ones tighten:

| Holds                                        | Gate                                                                                | State                 |
| -------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------- |
| no new `new Module(` / `superMethod(`        | `module-count-ratchet-blocks-new-ruby-compat-modules`                               | shipped (trails#9190) |
| no new literal-name send                     | `pnpm parity:api:sends` (merge-base is the mark)                                    | live                  |
| no helper where the native form is identical | `ruby-compat-native-required-lint`                                                  | draft                 |
| no export without a caller                   | 0154 `ruby-compat-rule-1-call-site-gate` (only-shrink register of uncalled exports) | draft                 |

**The `parity:api:extra` regime for ruby-compat.** The mark is
`{ novel: 0, total: 52, noCounterpartFiles: 14 }`. `novel` is pinned at 0, and
a `@noRailsEquivalent PERMANENT` receipt subtracts a member from both
dimensions, so a receipted addition is mark-neutral. That gate enforces rule 2
(every export is receipted), not rule 1 (every export is called), as
`ruby-compat-rule-1-call-site-gate` records. For a package meant to shrink, the
mark-neutral receipt is still right _for the extra gate_: a receipt is the
package's citation protocol, not a licence. What holds the size is the rule-1
gate's only-shrink register. This RFC therefore asks for no change to
`extra-surface-mark.json`. It schedules the rule-1 gate last, in Rollout phase
5, so the 488 can only go down once the burndown ends.

#### For the repo owner

You ruled on 2026-10-22 that this RFC's deletion of `rbFPublicSend` stands. Two
passages in trails' CLAUDE.md still describe it as kept:

- § "Method visibility is compile-time only": "a Rails `public_send` that
  survives … keeps its `rbFPublicSend` spelling".
- § "A dispatch by name is spelled directly": its second fallback names
  `rbFSend` / `rbFPublicSend`.

The collapse story already owns amending the first passage. The 2026-10-22
extension adds the second to that story's acceptance criteria, so both change in the PR
that deletes the export. Until then, this RFC stays consistent with the text
as written: it schedules the deletion only through that story.

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

5. Phase 5, burndown ledger (2026-10-22): `ruby-compat-readme-export-ledger`
   comes first, then `delete-identity-and-alias-ruby-compat-helpers` and
   `delete-module-initialize-hook-machinery` (neither needs a gate). After the
   phase 3 literal-name sweep comes `delete-send-name-guessing-arms`, and after
   RFC 0197's `delete-ruby-compat-module-class-final` comes
   `triage-carrier-only-ruby-compat-deviation-stories`. RFC 0154's
   `ruby-compat-rule-1-call-site-gate` holds the result and depends on all of
   them.

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
- The ledger's targets: `index.ts` value exports 488 → ≤ 421, `include.ts`
  2387 → ≤ 1450 lines, `pnpm parity:api:sends` 143 → the computed-name
  floor with `"call"` at 0, and the README export table matching `index.ts`
  row for row.

## Open questions

None open. All three questions raised in drafting are resolved or deferred:

1. **`keepIf`.** It is kept as a helper (see Non-goals).
2. **ruby-compat README rule 1.** It is amended to "two or more importing
   files, or object-model state / adapter seam" by `native-first-policy-docs`.
3. **Should the rule-1 gate also record the export count as an only-shrink
   mark?** The recommendation is yes. It is deferred to the design of RFC
   0154's `ruby-compat-rule-1-call-site-gate`.

## Changelog

- 2026-10-16: initial RFC, from the ruby-compat native audit.
- 2026-10-16: visibility collapse; owner chose the removal path for `include_private` arms.
- 2026-10-16: review: reordered phases to follow deps, folded the Thor story into the collapse, added the `except` sweep, numeric verification, resolved open questions.
- 2026-10-19: owner rulings fold in native-required (lint + Array/Hash/scalar credits + sweeps) and Enumerable as free functions; kept helper families listed under Policy.
- 2026-10-19: owner asked for the iterable wrapper too: `Enumerable` is a class module that wraps any Iterable.
- 2026-10-22: burndown ledger: every export bucketed, five stories added (owner ruling; first drafted as tasks#291).

## Appendix A: the ledger

`src` / `test` are importing files outside ruby-compat. Owner is the story that
deletes or converges the row; KEEP rows have none.

| bucket                        | module                        | export                                     | src | test | MRI citation (`vendor/ruby/v3.3.11/`)                                  | owner                                                                |
| ----------------------------- | ----------------------------- | ------------------------------------------ | --: | ---: | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| DELETE · visibility           | `include`                     | `rbModPublicInstanceMethod`                |   1 |    0 | `proc.c:2207`                                                          | `collapse-visibility-variants-of-send-and-respond-to (amended here)` |
| DELETE · visibility           | `method`                      | `rbObjPrivateMethods`                      |   1 |    0 | `class.c:2027`                                                         | `collapse-visibility-variants-of-send-and-respond-to`                |
| DELETE · visibility           | `method`                      | `rbObjProtectedMethods`                    |   1 |    0 | `class.c:2012`                                                         | `collapse-visibility-variants-of-send-and-respond-to`                |
| DELETE · visibility           | `method`                      | `rbObjPublicMethods`                       |   1 |    0 | `class.c:2042`                                                         | `collapse-visibility-variants-of-send-and-respond-to`                |
| DELETE · visibility           | `object`                      | `rbFPublicSend`                            |  40 |    3 | `vm_eval.c:1350`                                                       | `collapse-visibility-variants-of-send-and-respond-to`                |
| DELETE · visibility           | `object`                      | `rbModPublicMethodDefined`                 |   3 |    0 | `vm_method.c:2098`                                                     | `collapse-visibility-variants-of-send-and-respond-to`                |
| DELETE · Module               | `include`                     | `Module`                                   |  67 |    3 | `object.c:1950`                                                        | `delete-ruby-compat-module-class-final`                              |
| DELETE · Module               | `include`                     | `initialize`                               |   0 |    0 | `class.c:1179`                                                         | `delete-module-initialize-hook-machinery`                            |
| DELETE · Module               | `include`                     | `initializeIncludedModules`                |   0 |    3 | `class.c:1281`                                                         | `delete-module-initialize-hook-machinery`                            |
| DELETE · Module               | `include`                     | `rbCModule`                                |   1 |    0 | `object.c:4202`                                                        | `delete-ruby-compat-module-class-final`                              |
| DELETE · JS form              | `array`                       | `aryCount`                                 |   4 |    0 | `array.c:6275`                                                         | `native-array-set-op-sites`                                          |
| DELETE · JS form              | `array`                       | `aryIncludes`                              |   2 |    0 | `array.c:5222`                                                         | `native-array-set-op-sites`                                          |
| DELETE · JS form              | `array`                       | `aryJoin`                                  |   6 |    0 | `array.c:2806`                                                         | `native-array-set-op-sites`                                          |
| DELETE · JS form              | `array`                       | `compact`                                  |  26 |    0 | `array.c:6240`                                                         | `native-array-set-op-sites`                                          |
| DELETE · JS form              | `array`                       | `drop`                                     |   2 |    0 | `array.c:7594`                                                         | `native-array-access-sites`                                          |
| DELETE · JS form              | `array`                       | `each`                                     |   2 |    0 | `array.c:2532`                                                         | `enumerable-free-functions-over-iterable`                            |
| DELETE · JS form              | `array`                       | `first`                                    |  34 |    1 | `array.c:1901`                                                         | `native-array-access-sites`                                          |
| DELETE · JS form              | `array`                       | `isIntersect`                              |   1 |    0 | `array.c:5680`                                                         | `inline-single-use-numeric-and-array-helpers`                        |
| DELETE · JS form              | `array`                       | `last`                                     |  22 |    1 | `array.c:1914`                                                         | `native-array-access-sites`                                          |
| DELETE · JS form              | `array`                       | `sort`                                     |   5 |    1 | `array.c:3473`                                                         | `enumerable-free-functions-for-hand-rolled-sites`                    |
| DELETE · JS form              | `array`                       | `take`                                     |   3 |    0 | `array.c:7532`                                                         | `native-array-access-sites`                                          |
| DELETE · JS form              | `array`                       | `union`                                    |  16 |    0 | `array.c:5600`                                                         | `native-array-set-op-sites`                                          |
| DELETE · JS form              | `array`                       | `zip`                                      |  10 |    0 | `array.c:4422`                                                         | `native-array-conversion-and-hash-sites`                             |
| DELETE · JS form              | `hash`                        | `dup`                                      |  12 |    2 | `object.c:591`                                                         | `native-array-conversion-and-hash-sites`                             |
| DELETE · JS form              | `hash`                        | `eachKey`                                  |   5 |    1 | `hash.c:3098`                                                          | `native-analogues-hash-and-scalar-calls`                             |
| DELETE · JS form              | `hash`                        | `eachValue`                                |   6 |    1 | `hash.c:3060`                                                          | `native-array-conversion-and-hash-sites`                             |
| DELETE · JS form              | `hash`                        | `inspect`                                  |   2 |    2 | `hash.c:3483`                                                          | `delete-identity-and-alias-ruby-compat-helpers`                      |
| DELETE · JS form              | `hash`                        | `keys`                                     |  14 |    5 | `hash.c:3584`                                                          | `native-array-conversion-and-hash-sites`                             |
| DELETE · JS form              | `hash`                        | `size`                                     |   3 |    0 | `hash.c:3002`                                                          | `native-analogues-hash-and-scalar-calls`                             |
| DELETE · JS form              | `hash`                        | `transformValues`                          |  14 |    0 | `hash.c:3366`                                                          | `native-array-conversion-and-hash-sites`                             |
| DELETE · JS form              | `hash`                        | `valuesAt`                                 |   6 |    0 | `hash.c:2713`                                                          | `native-array-conversion-and-hash-sites`                             |
| DELETE · JS form              | `numeric`                     | `isFinite`                                 |   1 |    0 | `numeric.c:2022`                                                       | `inline-single-use-numeric-and-array-helpers`                        |
| DELETE · JS form              | `numeric`                     | `isNan`                                    |   2 |    0 | `numeric.c:1961`                                                       | `native-scalar-sites`                                                |
| DELETE · JS form              | `numeric`                     | `round`                                    |   5 |    0 | `numeric.c:2505`                                                       | `native-scalar-sites`                                                |
| DELETE · JS form              | `numeric`                     | `toF`                                      |   7 |    4 | `nilclass.rb:22`                                                       | `native-scalar-sites`                                                |
| DELETE · JS form              | `string/method-table`         | `center`                                   |   1 |    0 | `string.c:10560`                                                       | `inline-single-use-string-byte-helpers`                              |
| DELETE · JS form              | `string/support`              | `strUminus`                                |   4 |    0 | `string.c:3059`                                                        | `delete-identity-and-alias-ruby-compat-helpers`                      |
| DELETE · JS form              | `string/support`              | `strlen`                                   |   4 |    0 | `string.c:2211`                                                        | `native-scalar-sites`                                                |
| UNEXPORT/DELETE · no importer | `comparable`                  | `cmpint`                                   |   0 |    0 | `compar.c:91`                                                          | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `concurrent/atomic-fixnum`    | `AtomicFixnum`                             |   0 |    0 | `thread_sync.c:697`                                                    | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `converter-not-found-error`   | `ConverterNotFoundError`                   |   0 |    0 | `transcode.c:4507`                                                     | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `delegate`                    | `Delegator`                                |   0 |    0 | `lib/delegate.rb:39-246`                                               | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `digest`                      | `DigestInstance`                           |   0 |    0 | `ext/digest/lib/digest.rb:60`                                          | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `exc-detailed-message`        | `excDetailedMessage`                       |   0 |    0 | `error.c:1657`                                                         | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `exc-detailed-message`        | `rbDecorateMessage`                        |   0 |    0 | `eval_error.c:128`                                                     | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `fiber-error`                 | `FiberError`                               |   0 |    0 | `cont.c:3532`                                                          | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `hash`                        | `reject`                                   |   0 |    0 | `hash.c:2626`                                                          | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `include`                     | `prepended`                                |   0 |    0 | `eval.c:1215`                                                          | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `include`                     | `rbModGe`                                  |   0 |    0 | `object.c:1862`                                                        | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `invalid-byte-sequence-error` | `InvalidByteSequenceError`                 |   0 |    0 | `transcode.c:4506`                                                     | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `match-data`                  | `MatchData`                                |   0 |    0 | `re.c:4724`                                                            | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `monitor`                     | `monEnter`                                 |   0 |    0 | `ext/monitor/lib/monitor.rb:169`                                       | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `monitor`                     | `monExit`                                  |   0 |    0 | `ext/monitor/lib/monitor.rb:176`                                       | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `openssl`                     | `HMAC`                                     |   0 |    0 | `ext/openssl/lib/openssl/hmac.rb:4`                                    | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `pretty-print`                | `PrettyPrint`                              |   0 |    0 | `lib/prettyprint.rb:34`                                                | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `socket`                      | `BasicSocket`                              |   0 |    0 | `ext/socket/basicsocket.c:746`                                         | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `string/byte-methods`         | `rbStrByteslice`                           |   0 |    0 | `string.c:6330`                                                        | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `struct`                      | `rbStructInitialize`                       |   0 |    0 | `struct.c:795`                                                         | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `struct`                      | `rstructGet`                               |   0 |    0 | `internal/struct.h:115`                                                | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `temporal-tag`                | `temporalTag`                              |   0 |    0 | `ext/date/date_core.c:6902`                                            | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `thread-pool-executor`        | `RejectedExecutionError`                   |   0 |    0 | `error.c:3264`                                                         | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `thread-pool-executor`        | `globalIoExecutor`                         |   0 |    0 | `thread.c:897`                                                         | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `undefined-conversion-error`  | `UndefinedConversionError`                 |   0 |    0 | `transcode.c:4505`                                                     | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `uri`                         | `DEFAULT_PARSER`                           |   0 |    0 | —                                                                      | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `uri`                         | `HTTP`                                     |   0 |    0 | —                                                                      | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `uri`                         | `RFC3986_PARSER`                           |   0 |    0 | —                                                                      | `triage-ruby-compat-exports-with-no-external-importer`               |
| UNEXPORT/DELETE · no importer | `variable`                    | `rbPathToClass`                            |   0 |    0 | `variable.c:432-474`                                                   | `triage-ruby-compat-exports-with-no-external-importer`               |
| CONVERGE                      | `array`                       | `ARRAY_METHOD_TABLE`                       |   6 |    0 | `array.c:8606`                                                         | `delete-send-name-guessing-arms`                                     |
| CONVERGE                      | `hash`                        | `eachPair`                                 |  18 |    0 | `hash.c:3149`                                                          | RFC 0190 (closed; sites kept)                                        |
| CONVERGE                      | `hash`                        | `except`                                   |  31 |    3 | `hash.c:2683`                                                          | `native-except-literal-key-sites`                                    |
| CONVERGE                      | `hash`                        | `fetch`                                    |  89 |    3 | `hash.c:2176`                                                          | `native-fetch-two-arg-literal-key-sites`                             |
| CONVERGE                      | `hash`                        | `hasKey`                                   |  20 |    3 | `hash.c:3671`                                                          | RFC 0190 (closed; sites kept)                                        |
| CONVERGE                      | `hash`                        | `hashAref`                                 |  43 |   21 | `hash.c:2121`                                                          | RFC 0190 (closed; sites kept)                                        |
| CONVERGE                      | `hash`                        | `hashAset`                                 |  21 |    2 | `hash.c:2018`                                                          | RFC 0190 (closed; sites kept)                                        |
| CONVERGE                      | `hash`                        | `hashDelete`                               |  58 |    3 | `hash.c:2441`                                                          | RFC 0190 (closed; sites kept)                                        |
| CONVERGE                      | `hash`                        | `merge`                                    |  12 |    1 | `hash.c:4144`                                                          | RFC 0190 (closed; sites kept)                                        |
| CONVERGE                      | `hash`                        | `mergeBang`                                |   7 |    1 | `hash.c:7247`                                                          | RFC 0190 (closed; sites kept)                                        |
| CONVERGE                      | `hash`                        | `slice`                                    |  15 |    1 | `hash.c:2651`                                                          | `native-analogues-hash-and-scalar-calls`                             |
| CONVERGE                      | `hash`                        | `update`                                   |   7 |    1 | `hash.c:4028`                                                          | RFC 0190 (closed; sites kept)                                        |
| CONVERGE                      | `include`                     | `extend`                                   | 132 |   41 | `eval.c:1778`                                                          | `delete-ruby-compat-module-class-final`                              |
| CONVERGE                      | `include`                     | `include`                                  | 222 |  199 | `eval.c:1139`                                                          | `delete-ruby-compat-module-class-final`                              |
| CONVERGE                      | `include`                     | `includedModules`                          |   2 |    6 | `class.c:1508`                                                         | `delete-ruby-compat-module-class-final`                              |
| CONVERGE                      | `include`                     | `isModuleIncluded`                         |  22 |   12 | `class.c:1538`                                                         | `delete-ruby-compat-module-class-final`                              |
| CONVERGE                      | `include`                     | `publicInstanceMethods`                    |   5 |   12 | `class.c:1942`                                                         | `delete-ruby-compat-module-class-final`                              |
| CONVERGE                      | `include`                     | `rbModAncestors`                           |   3 |    5 | `class.c:1570`                                                         | `delete-ruby-compat-module-class-final`                              |
| CONVERGE                      | `object`                      | `CLASS_METHOD_TABLE`                       |   1 |    0 | `class.c:2134`                                                         | `delete-send-name-guessing-arms`                                     |
| CONVERGE                      | `object`                      | `ENUMERABLE_METHOD_TABLE`                  |   1 |    0 | `array.c:8606`                                                         | `delete-send-name-guessing-arms`                                     |
| CONVERGE                      | `object`                      | `OBJECT_METHOD_TABLE`                      |   1 |    0 | `class.c:2134`                                                         | `delete-send-name-guessing-arms`                                     |
| CONVERGE                      | `object`                      | `TEMPORAL_METHOD_TABLE`                    |   8 |    0 | `ext/date/date_core.c:10054`                                           | `delete-send-name-guessing-arms`                                     |
| CONVERGE                      | `object`                      | `basicObjRespondTo`                        |   9 |    3 | —                                                                      | `collapse-visibility-variants-of-send-and-respond-to`                |
| CONVERGE                      | `object`                      | `rbFSend`                                  | 136 |   51 | `vm_eval.c:1330`                                                       | `delete-send-name-guessing-arms`                                     |
| CONVERGE                      | `object`                      | `rbObjRespondTo`                           | 170 |   28 | `vm_method.c:2934`                                                     | `collapse-visibility-variants-of-send-and-respond-to`                |
| CONVERGE                      | `prepend`                     | `prepend`                                  |  20 |    7 | `eval.c:1196`                                                          | `delete-ruby-compat-module-class-final`                              |
| CONVERGE                      | `ruby-empty`                  | `isEmpty`                                  |  76 |    8 | `array.c:2686`                                                         | `native-is-empty-sites-remaining-packages`                           |
| CONVERGE                      | `string/method-table`         | `STRING_METHOD_TABLE`                      |   5 |    0 | `string.c:12119`                                                       | `delete-send-name-guessing-arms`                                     |
| CONVERGE                      | `string/method-table`         | `rbStrRespondTo`                           |   2 |    0 | `vm_method.c:2977`                                                     | `delete-send-name-guessing-arms`                                     |
| CONVERGE                      | `string/method-table`         | `rbStrSend`                                |  14 |    1 | `vm_eval.c:1330`                                                       | `delete-send-name-guessing-arms`                                     |
| CONVERGE                      | `symbol`                      | `rbMethodName`                             |   1 |    0 | —                                                                      | `delete-send-name-guessing-arms`                                     |
| KEEP · semantic gap           | `array`                       | `aryDelete`                                |  13 |    0 | `array.c:3973`                                                         |                                                                      |
| KEEP · semantic gap           | `array`                       | `aryDeleteIf`                              |   5 |    0 | `array.c:4330`                                                         |                                                                      |
| KEEP · semantic gap           | `array`                       | `aryFetch`                                 |   1 |    0 | `array.c:1962`                                                         |                                                                      |
| KEEP · semantic gap           | `array`                       | `aryPop`                                   |   1 |    0 | `array.c:1437`                                                         |                                                                      |
| KEEP · semantic gap           | `array`                       | `aryReject`                                |   2 |    0 | `array.c:4301`                                                         |                                                                      |
| KEEP · semantic gap           | `array`                       | `arySlice`                                 |   5 |    0 | `array.c:1827`                                                         |                                                                      |
| KEEP · semantic gap           | `array`                       | `compactBang`                              |   2 |    0 | `array.c:6207`                                                         |                                                                      |
| KEEP · semantic gap           | `array`                       | `deleteAt`                                 |   2 |    0 | `array.c:4072`                                                         |                                                                      |
| KEEP · semantic gap           | `array`                       | `flatten`                                  |  11 |    1 | `array.c:6476`                                                         |                                                                      |
| KEEP · semantic gap           | `array`                       | `groupBy`                                  |  10 |    1 | `enum.c:1157`                                                          |                                                                      |
| KEEP · semantic gap           | `array`                       | `insert`                                   |   1 |    0 | `array.c:2454`                                                         |                                                                      |
| KEEP · semantic gap           | `array`                       | `pack`                                     |   6 |    3 | `pack.c:197`                                                           |                                                                      |
| KEEP · semantic gap           | `array`                       | `partition`                                |   7 |    0 | `enum.c:1102`                                                          |                                                                      |
| KEEP · semantic gap           | `array`                       | `rbCheckArrayType`                         |   6 |    1 | `array.c:975`                                                          |                                                                      |
| KEEP · semantic gap           | `array`                       | `rbFArray`                                 |  13 |    1 | `object.c:3825`                                                        |                                                                      |
| KEEP · semantic gap           | `array`                       | `toA`                                      |   1 |    0 | `array.c:2952`                                                         |                                                                      |
| KEEP · semantic gap           | `array`                       | `toH`                                      |   7 |    1 | `array.c:2988`                                                         |                                                                      |
| KEEP · semantic gap           | `array`                       | `uniq`                                     |  18 |    2 | `array.c:6177`                                                         |                                                                      |
| KEEP · semantic gap           | `array`                       | `unpack`                                   |   3 |    1 | `pack.c:1611`                                                          |                                                                      |
| KEEP · semantic gap           | `array`                       | `unpack1`                                  |   3 |    0 | `pack.c:1125`                                                          |                                                                      |
| KEEP · semantic gap           | `comparable`                  | `cmp`                                      |  17 |    4 | `object.c:1665`                                                        |                                                                      |
| KEEP · semantic gap           | `comparable`                  | `equals`                                   |   5 |    0 | `compar.c:79`                                                          |                                                                      |
| KEEP · semantic gap           | `comparable`                  | `greaterThan`                              |   2 |    0 | `compar.c:105`                                                         |                                                                      |
| KEEP · semantic gap           | `comparable`                  | `greaterThanOrEqual`                       |   2 |    0 | `compar.c:119`                                                         |                                                                      |
| KEEP · semantic gap           | `comparable`                  | `isBetween`                                |   2 |    0 | `compar.c:168`                                                         |                                                                      |
| KEEP · semantic gap           | `comparable`                  | `lessThan`                                 |   2 |    0 | `compar.c:133`                                                         |                                                                      |
| KEEP · semantic gap           | `comparable`                  | `lessThanOrEqual`                          |   2 |    0 | `compar.c:147`                                                         |                                                                      |
| KEEP · semantic gap           | `comparable`                  | `max`                                      |   8 |    0 | `array.c:5848`                                                         |                                                                      |
| KEEP · semantic gap           | `comparable`                  | `min`                                      |   1 |    0 | `array.c:6016`                                                         |                                                                      |
| KEEP · semantic gap           | `comparable`                  | `rbCmpint`                                 |   6 |    0 | `bignum.c:2959`                                                        |                                                                      |
| KEEP · semantic gap           | `comparable`                  | `rubyClass`                                |   3 |    0 | `compar.c:28`                                                          |                                                                      |
| KEEP · semantic gap           | `concurrent/map`              | `Concurrent`                               |  10 |    6 | `class.c:1087`                                                         |                                                                      |
| KEEP · semantic gap           | `concurrent/timer-task`       | `TimerTask`                                |   1 |    0 | `thread_sync.c:626`                                                    |                                                                      |
| KEEP · semantic gap           | `ensure`                      | `rbEnsure`                                 |  16 |    1 | `eval.c:995`                                                           |                                                                      |
| KEEP · semantic gap           | `enumerable`                  | `AsyncEnumerable`                          |   1 |    0 | `enum.c:5047`                                                          |                                                                      |
| KEEP · semantic gap           | `enumerable`                  | `Enumerable`                               |  11 |    3 | `enum.c:5076`                                                          |                                                                      |
| KEEP · semantic gap           | `enumerable`                  | `reduce`                                   |   1 |    0 | `enum.c:1005`                                                          |                                                                      |
| KEEP · semantic gap           | `enumerator`                  | `Enumerator`                               |   6 |    4 | `enumerator.c:411`                                                     |                                                                      |
| KEEP · semantic gap           | `enumerator`                  | `toEnum`                                   |   9 |    0 | `enumerator.c:383`                                                     |                                                                      |
| KEEP · semantic gap           | `exc-to-s`                    | `excToS`                                   |   3 |    0 | `error.c:1463`                                                         |                                                                      |
| KEEP · semantic gap           | `exception`                   | `Exception`                                |  10 |    1 | `error.c:3294`                                                         |                                                                      |
| KEEP · semantic gap           | `exception`                   | `excSetupMessage`                          |   6 |    1 | `eval.c:506`                                                           |                                                                      |
| KEEP · semantic gap           | `file-utils`                  | `FileUtils`                                |  28 |   28 | `lib/fileutils.rb:1`                                                   |                                                                      |
| KEEP · semantic gap           | `hash`                        | `Hash`                                     | 100 |   61 | `hash.c:7182`                                                          |                                                                      |
| KEEP · semantic gap           | `hash`                        | `block`                                    |  53 |   23 | `eval.c:866`                                                           |                                                                      |
| KEEP · semantic gap           | `hash`                        | `deleteIf`                                 |   4 |    0 | `hash.c:2564`                                                          |                                                                      |
| KEEP · semantic gap           | `hash`                        | `hashReplace`                              |   4 |    0 | `hash.c:2967`                                                          |                                                                      |
| KEEP · semantic gap           | `hash`                        | `isInclude`                                |   3 |    0 | `hash.c:7255`                                                          |                                                                      |
| KEEP · semantic gap           | `hash`                        | `keepIf`                                   |   1 |    0 | `hash.c:2844`                                                          |                                                                      |
| KEEP · semantic gap           | `hash`                        | `rbBlockGivenP`                            |  13 |    0 | `eval.c:866`                                                           |                                                                      |
| KEEP · semantic gap           | `hash`                        | `rbHashSRuby2KeywordsHash`                 |   2 |    1 | `hash.c:1974`                                                          |                                                                      |
| KEEP · semantic gap           | `hash`                        | `rbHashSRuby2KeywordsHashP`                |   1 |    2 | `hash.c:1952`                                                          |                                                                      |
| KEEP · semantic gap           | `hash`                        | `transformValuesBang`                      |   1 |    0 | `hash.c:3398`                                                          |                                                                      |
| KEEP · semantic gap           | `include`                     | `Kernel`                                   |   3 |    2 | `object.c:654`                                                         |                                                                      |
| KEEP · semantic gap           | `include`                     | `classModule`                              |  10 |    4 | brand: CLAUDE.md § "A Ruby module is a plain object or a class module" |                                                                      |
| KEEP · semantic gap           | `include`                     | `defineModule`                             |  23 |    6 | `object.c:1950`                                                        |                                                                      |
| KEEP · semantic gap           | `include`                     | `extended`                                 |   6 |    0 | `eval.c:1795`                                                          |                                                                      |
| KEEP · semantic gap           | `include`                     | `included`                                 |  57 |    2 | `eval.c:1160`                                                          |                                                                      |
| KEEP · semantic gap           | `include`                     | `moduleVisibility`                         |   2 |    1 | `class.c:1927`                                                         |                                                                      |
| KEEP · semantic gap           | `include`                     | `rbCallSuper`                              |  39 |    5 | `vm_eval.c:366`                                                        |                                                                      |
| KEEP · semantic gap           | `include`                     | `rbClassInheritedP`                        |   6 |    2 | `object.c:1778`                                                        |                                                                      |
| KEEP · semantic gap           | `include`                     | `rbClassNewInstance`                       |   1 |    0 | `object.c:2158`                                                        |                                                                      |
| KEEP · semantic gap           | `include`                     | `rbDefineAllocFunc`                        |   4 |    1 | `vm_method.c:1270`                                                     |                                                                      |
| KEEP · semantic gap           | `include`                     | `rbModConstDefined`                        |   3 |    2 | `object.c:2596`                                                        |                                                                      |
| KEEP · semantic gap           | `include`                     | `rbModConstSet`                            | 338 |   37 | `object.c:2545`                                                        |                                                                      |
| KEEP · semantic gap           | `include`                     | `rbModGt`                                  |   1 |    0 | `object.c:1885`                                                        |                                                                      |
| KEEP · semantic gap           | `include`                     | `rbModInstanceMethod`                      |   2 |    0 | `proc.c:2190`                                                          |                                                                      |
| KEEP · semantic gap           | `include`                     | `rbObjClone`                               |  23 |   11 | `object.c:536`                                                         |                                                                      |
| KEEP · semantic gap           | `include`                     | `rbObjDup`                                 |  40 |   24 | `object.c:591`                                                         |                                                                      |
| KEEP · semantic gap           | `include`                     | `rbObjIsKindOf`                            |  35 |    3 | `object.c:889`                                                         |                                                                      |
| KEEP · semantic gap           | `kernel-catch`                | `UncaughtThrowError`                       |   0 |    1 | `vm_eval.c:2588-2591`                                                  |                                                                      |
| KEEP · semantic gap           | `kernel-catch`                | `kernelCatch`                              |   8 |    8 | `vm_eval.c:2342`                                                       |                                                                      |
| KEEP · semantic gap           | `kernel-catch`                | `kernelThrow`                              |  20 |   20 | `vm_eval.c:2244-2251`                                                  |                                                                      |
| KEEP · semantic gap           | `kernel-catch`                | `throwDataP`                               |   3 |    0 | `internal/imemo.h:118`                                                 |                                                                      |
| KEEP · semantic gap           | `kernel-float`                | `kernelFloat`                              |   7 |    0 | `object.c:3605`                                                        |                                                                      |
| KEEP · semantic gap           | `kernel-format`               | `format`                                   |  16 |    0 | `sprintf.c:212`                                                        |                                                                      |
| KEEP · semantic gap           | `kernel-format`               | `sprintf`                                  |   9 |    1 | `sprintf.c:206`                                                        |                                                                      |
| KEEP · semantic gap           | `kernel-integer`              | `kernelInteger`                            |   7 |    0 | `object.c:3257`                                                        |                                                                      |
| KEEP · semantic gap           | `kernel-rand`                 | `kernelRand`                               |   1 |    1 | `random.c:1684`                                                        |                                                                      |
| KEEP · semantic gap           | `kernel-warn`                 | `warn`                                     |  15 |    3 | `warning.rb:50-52`                                                     |                                                                      |
| KEEP · semantic gap           | `keyword-splat`               | `coreHashMergeKwd`                         |   3 |    0 | `vm.c:3696`                                                            |                                                                      |
| KEEP · semantic gap           | `keyword-splat`               | `keywordSplat`                             |   1 |    0 | `vm_args.c:435`                                                        |                                                                      |
| KEEP · semantic gap           | `keyword-splat`               | `rbGetKwargs`                              |   2 |    0 | `class.c:2413`                                                         |                                                                      |
| KEEP · semantic gap           | `keyword-splat`               | `rbScanArgs`                               |   2 |    0 | `include/ruby/internal/scan_args.h:400-407`                            |                                                                      |
| KEEP · semantic gap           | `method-missing-proxy`        | `KERNEL_METHODS`                           |   5 |    0 | `object.c:4360`                                                        |                                                                      |
| KEEP · semantic gap           | `method-missing-proxy`        | `PROTOCOL_PROBES`                          |  12 |    0 | `vm_eval.c:2570`                                                       |                                                                      |
| KEEP · semantic gap           | `method-missing-proxy`        | `methodMissingProxy`                       |   4 |    1 | `vm_eval.c:2570`                                                       |                                                                      |
| KEEP · semantic gap           | `method`                      | `Method`                                   |   3 |    1 | `proc.c:1657`                                                          |                                                                      |
| KEEP · semantic gap           | `method`                      | `iseqLocationSetup`                        |   2 |    2 | `iseq.c:550`                                                           |                                                                      |
| KEEP · semantic gap           | `method`                      | `rbCheckArity`                             |   2 |    0 | `vm_args.c:800`                                                        |                                                                      |
| KEEP · semantic gap           | `method`                      | `rbObjMethod`                              |  13 |    6 | `proc.c:2079`                                                          |                                                                      |
| KEEP · semantic gap           | `method`                      | `rbObjMethods`                             |   1 |    1 | `class.c:1993`                                                         |                                                                      |
| KEEP · semantic gap           | `numeric`                     | `FLOAT_DIG`                                |   3 |    0 | `numeric.c:6283`                                                       |                                                                      |
| KEEP · semantic gap           | `numeric`                     | `anybits`                                  |   2 |    0 | `numeric.c:3647`                                                       |                                                                      |
| KEEP · semantic gap           | `numeric`                     | `fixDiv`                                   |   2 |    0 | `numeric.c:4164`                                                       |                                                                      |
| KEEP · semantic gap           | `numeric`                     | `fixMod`                                   |   3 |    0 | `numeric.c:4268`                                                       |                                                                      |
| KEEP · semantic gap           | `numeric`                     | `intXor`                                   |   1 |    0 | `numeric.c:5055`                                                       |                                                                      |
| KEEP · semantic gap           | `numeric`                     | `numStep`                                  |   1 |    0 | `numeric.c:3034`                                                       |                                                                      |
| KEEP · semantic gap           | `numeric`                     | `numericMinus`                             |   3 |    0 | `numeric.c:3995`                                                       |                                                                      |
| KEEP · semantic gap           | `numeric`                     | `numericModulo`                            |   2 |    0 | `numeric.c:4268`                                                       |                                                                      |
| KEEP · semantic gap           | `numeric`                     | `numericMul`                               |   3 |    0 | `numeric.c:4045`                                                       |                                                                      |
| KEEP · semantic gap           | `numeric`                     | `numericPlus`                              |   2 |    0 | `numeric.c:3942`                                                       |                                                                      |
| KEEP · semantic gap           | `numeric`                     | `numericPow`                               |   1 |    0 | `numeric.c:4521`                                                       |                                                                      |
| KEEP · semantic gap           | `numeric`                     | `numericUminus`                            |   1 |    0 | `numeric.c:1156`                                                       |                                                                      |
| KEEP · semantic gap           | `numeric`                     | `rbAbsintSize`                             |   1 |    0 | `bignum.c:3283`                                                        |                                                                      |
| KEEP · semantic gap           | `numeric`                     | `rbBigNorm`                                |   4 |    0 | `bignum.c:3188`                                                        |                                                                      |
| KEEP · semantic gap           | `numeric`                     | `rbDbl2num`                                |   3 |    0 | `include/ruby/internal/arithmetic/double.h:29`                         |                                                                      |
| KEEP · semantic gap           | `numeric`                     | `rbFloatTypeP`                             |   5 |    1 | `include/ruby/internal/value_type.h:263`                               |                                                                      |
| KEEP · semantic gap           | `numeric`                     | `rbIntegerTypeP`                           |   2 |    1 | `include/ruby/internal/value_type.h:94`                                |                                                                      |
| KEEP · semantic gap           | `numeric`                     | `rbPlus`                                   |   2 |    0 | `enum.c:4583`                                                          |                                                                      |
| KEEP · semantic gap           | `numeric`                     | `toI`                                      |  38 |    4 | `object.c:4414`                                                        |                                                                      |
| KEEP · semantic gap           | `object`                      | `classpaths`                               |   1 |    0 | `variable.c:364`                                                       |                                                                      |
| KEEP · semantic gap           | `object`                      | `defineAccessorHalf`                       |   1 |    0 | `vm_method.c:1146`                                                     |                                                                      |
| KEEP · semantic gap           | `object`                      | `isAbsentHalf`                             |   1 |    1 | `vm_method.c:1146`                                                     |                                                                      |
| KEEP · semantic gap           | `object`                      | `isNil`                                    |   8 |    0 | `object.c:4425`                                                        |                                                                      |
| KEEP · semantic gap           | `object`                      | `isPlainHash`                              |   5 |    1 | `include/ruby/internal/value_type.h:122`                               |                                                                      |
| KEEP · semantic gap           | `object`                      | `objRespondToMissing`                      |   2 |    0 | `vm_method.c:3009`                                                     |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbAnyToS`                                 |   2 |    0 | `object.c:693-701`                                                     |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbBuiltinClassName`                       |   1 |    0 | `error.c:1216`                                                         |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbCArray`                                 |   1 |    0 | `array.c:8605`                                                         |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbCBasicObject`                           |   1 |    1 | `object.c:4200`                                                        |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbCClass`                                 |   0 |    1 | `object.c:4203`                                                        |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbCDate`                                  |   3 |    2 | `ext/date/date_core.c:9604`                                            |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbCDateTime`                              |   2 |    2 | `ext/date/date_core.c:9984`                                            |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbCFalseClass`                            |   2 |    0 | `object.c:4510`                                                        |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbCFloat`                                 |   3 |    0 | `numeric.c:6259`                                                       |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbCInteger`                               |   5 |    4 | `numeric.c:6190`                                                       |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbCNilClass`                              |   2 |    0 | `object.c:4412`                                                        |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbCNumeric`                               |   9 |    0 | `numeric.c:6156`                                                       |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbCString`                                |   4 |    6 | `string.c:12121`                                                       |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbCSymbol`                                |   7 |    4 | `string.c:12290`                                                       |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbCTime`                                  |   2 |    1 | `time.c:5832`                                                          |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbCTrueClass`                             |   2 |    0 | `object.c:4498`                                                        |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbClassAttachedObject`                    |   1 |    0 | `class.c:1707-1714`                                                    |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbClassOf`                                |   1 |    0 | `include/ruby/internal/globals.h:172`                                  |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbClassSuperclass`                        |  15 |    2 | `object.c:2191`                                                        |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbDeclareIvar`                            |  18 |    0 | `variable.c:1923`                                                      |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbDefineInspectCustom`                    |   3 |    0 | `io.c:9023`                                                            |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbInspect`                                | 122 |   44 | `object.c:704`                                                         |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbModAttrReader`                          |   6 |    0 | `object.c:2279`                                                        |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbModAttrWriter`                          |   5 |    0 | `object.c:2335`                                                        |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbModDefineMethod`                        |  13 |    0 | `proc.c:2325`                                                          |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbModMethodDefined`                       |   8 |    0 | `vm_method.c:2055`                                                     |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbModName`                                |  41 |   16 | `variable.c:122-127`                                                   |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbModSingletonP`                          |   8 |    0 | `object.c:3050`                                                        |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbModToS`                                 |  10 |    4 | `object.c:1710-1742`                                                   |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbObjAsString`                            |  89 |    5 | `string.c:1653`                                                        |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbObjClass`                               |  36 |   12 | `object.c:265`                                                         |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbObjClassname`                           |  53 |    8 | `variable.c:498`                                                       |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbObjFrozenP`                             |   1 |    2 | `object.c:1296`                                                        |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbObjId`                                  |   9 |    3 | `gc.c:4975`                                                            |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbObjInspect`                             |   2 |    1 | `object.c:783-795`                                                     |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbObjInstanceVariables`                   |   3 |    3 | `variable.c:2259`                                                      |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbObjIsProc`                              |   6 |    0 | `proc.c:120`                                                           |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbObjIvarDefined`                         |   1 |    0 | `object.c:2942`                                                        |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbObjIvarGet`                             |  13 |   15 | `object.c:2880`                                                        |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbObjIvarSet`                             |  10 |   12 | `object.c:2914`                                                        |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbObjSingletonClass`                      |  11 |   23 | `object.c:288`                                                         |                                                                      |
| KEEP · semantic gap           | `object`                      | `rbSetClassPathString`                     |   4 |    0 | `variable.c:407`                                                       |                                                                      |
| KEEP · semantic gap           | `object`                      | `rtest`                                    | 107 |    0 | `include/ruby/internal/special_consts.h:138`                           |                                                                      |
| KEEP · semantic gap           | `object`                      | `toS`                                      |  50 |    1 | `string.c:11734`                                                       |                                                                      |
| KEEP · semantic gap           | `object`                      | `toSym`                                    |   8 |    0 | `symbol.c:862`                                                         |                                                                      |
| KEEP · semantic gap           | `rb-equal`                    | `rbEql`                                    |   6 |    4 | `object.c:159`                                                         |                                                                      |
| KEEP · semantic gap           | `rb-equal`                    | `rbEqq`                                    |  14 |    0 | `vm_insnhelper.c:2445-2446`                                            |                                                                      |
| KEEP · semantic gap           | `rb-equal`                    | `rbEqual`                                  |  96 |   22 | `object.c:147`                                                         |                                                                      |
| KEEP · semantic gap           | `rb-hash`                     | `rbHash`                                   |  45 |    7 | `object.c:4375`                                                        |                                                                      |
| KEEP · semantic gap           | `rb-hash`                     | `rbObjHash`                                |   1 |    0 | `hash.c:344`                                                           |                                                                      |
| KEEP · semantic gap           | `regexp`                      | `rbRegEqual`                               |   0 |    1 | `re.c:3486`                                                            |                                                                      |
| KEEP · semantic gap           | `regexp`                      | `rbRegInitStr`                             |   2 |    0 | `re.c:3360`                                                            |                                                                      |
| KEEP · semantic gap           | `regexp`                      | `rbRegMatchP`                              |  11 |    0 | `re.c:3811`                                                            |                                                                      |
| KEEP · semantic gap           | `regexp`                      | `rbRegSUnion`                              |   2 |    0 | `re.c:4192`                                                            |                                                                      |
| KEEP · semantic gap           | `regexp`                      | `rbRegToS`                                 |   3 |    0 | `re.c:565`                                                             |                                                                      |
| KEEP · semantic gap           | `regexp`                      | `regexpEscape`                             |  27 |   21 | `re.c:4144`                                                            |                                                                      |
| KEEP · semantic gap           | `string/b`                    | `b`                                        |  20 |   16 | `string.c:10955`                                                       |                                                                      |
| KEEP · semantic gap           | `string/byte-methods`         | `byteslice`                                |   4 |    0 | `string.c:6330`                                                        |                                                                      |
| KEEP · semantic gap           | `string/byte-methods`         | `rbStrGetbyte`                             |   2 |    0 | `string.c:6141`                                                        |                                                                      |
| KEEP · semantic gap           | `string/byte-methods`         | `rbStrSetbyte`                             |   1 |    0 | `string.c:6166`                                                        |                                                                      |
| KEEP · semantic gap           | `string/bytes`                | `bytes`                                    |   8 |    2 | `string.c:9253`                                                        |                                                                      |
| KEEP · semantic gap           | `string/bytes`                | `strNew`                                   |   7 |    1 | `string.c:907`                                                         |                                                                      |
| KEEP · semantic gap           | `string/case-mapping`         | `capitalize`                               |   3 |    0 | `string.c:7760`                                                        |                                                                      |
| KEEP · semantic gap           | `string/case-mapping`         | `casecmp`                                  |   2 |    0 | `string.c:3844`                                                        |                                                                      |
| KEEP · semantic gap           | `string/chomp`                | `chomp`                                    |  11 |    2 | `string.c:9682`                                                        |                                                                      |
| KEEP · semantic gap           | `string/convert`              | `rbStrDump`                                |   3 |    0 | `string.c:6901`                                                        |                                                                      |
| KEEP · semantic gap           | `string/convert`              | `rbStrHex`                                 |   1 |    0 | `string.c:10183`                                                       |                                                                      |
| KEEP · semantic gap           | `string/convert`              | `rbStrToF`                                 |   2 |    0 | `string.c:6633`                                                        |                                                                      |
| KEEP · semantic gap           | `string/convert`              | `rbStrToI`                                 |   4 |    0 | `string.c:6602`                                                        |                                                                      |
| KEEP · semantic gap           | `string/delete`               | `stringDelete`                             |   5 |    0 | `string.c:8341`                                                        |                                                                      |
| KEEP · semantic gap           | `string/each`                 | `rbStrEnumerateLines`                      |   2 |    0 | `string.c:9037`                                                        |                                                                      |
| KEEP · semantic gap           | `string/encode`               | `encode`                                   |   5 |    0 | `transcode.c:2906`                                                     |                                                                      |
| KEEP · semantic gap           | `string/inspect`              | `stringInspect`                            |   3 |    0 | `string.c:6825`                                                        |                                                                      |
| KEEP · semantic gap           | `string/method-table`         | `deleteSuffix`                             |   1 |    0 | `string.c:10878`                                                       |                                                                      |
| KEEP · semantic gap           | `string/method-table`         | `lastMatchGetter`                          |   1 |    0 | `re.c:1989`                                                            |                                                                      |
| KEEP · semantic gap           | `string/method-table`         | `matchOperator`                            |   3 |    0 | `object.c:4419`                                                        |                                                                      |
| KEEP · semantic gap           | `string/method-table`         | `rbDefineMethod`                           |   1 |    0 | `class.c:2134`                                                         |                                                                      |
| KEEP · semantic gap           | `string/method-table`         | `rbObjNotMatch`                            |   3 |    0 | `object.c:1639`                                                        |                                                                      |
| KEEP · semantic gap           | `string/method-table`         | `rbStrInclude`                             |   1 |    0 | `string.c:6558`                                                        |                                                                      |
| KEEP · semantic gap           | `string/method-table`         | `rbStrMatch`                               |   2 |    0 | `string.c:4523`                                                        |                                                                      |
| KEEP · semantic gap           | `string/method-table`         | `rbStrPlus`                                |   3 |    0 | `string.c:2259`                                                        |                                                                      |
| KEEP · semantic gap           | `string/method-table`         | `rstrip`                                   |   1 |    0 | `string.c:9952`                                                        |                                                                      |
| KEEP · semantic gap           | `string/method-table`         | `stringSuperclass`                         |   3 |    0 | `string.c:12119`                                                       |                                                                      |
| KEEP · semantic gap           | `string/method-table`         | `strip`                                    |   6 |    0 | `string.c:10020`                                                       |                                                                      |
| KEEP · semantic gap           | `string/scrub`                | `scrub`                                    |   2 |    0 | `string.c:11354`                                                       |                                                                      |
| KEEP · semantic gap           | `string/slice`                | `sliceBang`                                |   2 |    0 | `string.c:5588`                                                        |                                                                      |
| KEEP · semantic gap           | `string/split`                | `stringSplit`                              |  18 |    3 | `string.c:8757`                                                        |                                                                      |
| KEEP · semantic gap           | `string/sub`                  | `rbStrPartition`                           |   1 |    0 | `string.c:10574`                                                       |                                                                      |
| KEEP · semantic gap           | `string/sub`                  | `rbStrRpartition`                          |   1 |    0 | `string.c:10611`                                                       |                                                                      |
| KEEP · semantic gap           | `string/sub`                  | `rbStrScanSubexpCall`                      |   1 |    0 | `string.c:10131`                                                       |                                                                      |
| KEEP · semantic gap           | `string/sub`                  | `rbStrStartWith`                           |   4 |    1 | `string.c:10651`                                                       |                                                                      |
| KEEP · semantic gap           | `string/sub`                  | `rbStrSub`                                 |   1 |    0 | `string.c:5884`                                                        |                                                                      |
| KEEP · semantic gap           | `string/succ`                 | `succ`                                     |   0 |    1 | `string.c:4868`                                                        |                                                                      |
| KEEP · semantic gap           | `string/support`              | `rbCheckStringType`                        |   1 |    0 | `string.c:2690`                                                        |                                                                      |
| KEEP · semantic gap           | `string/support`              | `stringValue`                              |   5 |    0 | `string.c:2551`                                                        |                                                                      |
| KEEP · semantic gap           | `string/tr`                   | `strCount`                                 |   2 |    0 | `string.c:8590`                                                        |                                                                      |
| KEEP · semantic gap           | `string/tr`                   | `trTrans`                                  |   1 |    0 | `string.c:7924`                                                        |                                                                      |
| KEEP · semantic gap           | `symbol`                      | `isSymbol`                                 |  54 |    2 | `symbol.c:954`                                                         |                                                                      |
| KEEP · semantic gap           | `symbol`                      | `stringToSym`                              |   8 |    1 | `symbol.c:862`                                                         |                                                                      |
| KEEP · semantic gap           | `symbol`                      | `symbolToS`                                |  55 |    4 | `symbol.c:954`                                                         |                                                                      |
| KEEP · semantic gap           | `variable`                    | `isRegisteredConstant`                     |   3 |    1 | `variable.c:3527`                                                      |                                                                      |
| KEEP · semantic gap           | `variable`                    | `rbConstGet`                               |   7 |    3 | `variable.c:3210`                                                      |                                                                      |
| KEEP · semantic gap           | `variable`                    | `rbConstMissing`                           |   1 |    0 | `variable.c:3120`                                                      |                                                                      |
| KEEP · semantic gap           | `variable`                    | `rbFBinding`                               |   2 |    0 | `proc.c:376`                                                           |                                                                      |
| KEEP · semantic gap           | `variable`                    | `rbGvGet`                                  |   3 |    3 | `variable.c:984`                                                       |                                                                      |
| KEEP · semantic gap           | `variable`                    | `rbGvSet`                                  |   2 |    3 | `variable.c:970`                                                       |                                                                      |
| KEEP · semantic gap           | `variable`                    | `rbModConstGet`                            |   8 |    1 | `object.c:2423`                                                        |                                                                      |
| KEEP · semantic gap           | `variable`                    | `rbModConstMissing`                        |   1 |    0 | `variable.c:2391`                                                      |                                                                      |
| KEEP · semantic gap           | `variable`                    | `rbModConstants`                           |   1 |    0 | `variable.c:3471`                                                      |                                                                      |
| KEEP · semantic gap           | `variable`                    | `rbModRemoveConst`                         |   1 |    2 | `variable.c:3302`                                                      |                                                                      |
| KEEP · semantic gap           | `variable`                    | `registerConstant`                         | 156 |  102 | `variable.c:3674`                                                      |                                                                      |
| KEEP · semantic gap           | `variable`                    | `registeredConstant`                       |   9 |    8 | `variable.c:3674`                                                      |                                                                      |
| KEEP · semantic gap           | `variable`                    | `resetConstants`                           |   0 |    8 | `variable.c:3674`                                                      |                                                                      |
| KEEP · semantic gap           | `variable`                    | `unregisterConstant`                       |   0 |   31 | `variable.c:3313`                                                      |                                                                      |
| KEEP · stdlib                 | `argument-error`              | `ArgumentError`                            | 131 |  108 | `error.c:3323`                                                         |                                                                      |
| KEEP · stdlib                 | `async-context-adapter`       | `asyncContextAdapterConfig`                |   1 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `async-context-adapter`       | `getAsyncContext`                          |   1 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `async-context-adapter`       | `registerAsyncContextAdapter`              |   0 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `backtrace-location`          | `Location`                                 |   3 |    1 | `vm_backtrace.c:1345`                                                  |                                                                      |
| KEEP · stdlib                 | `backtrace-location`          | `excBacktrace`                             |  11 |    2 | `error.c:1741`                                                         |                                                                      |
| KEEP · stdlib                 | `backtrace-location`          | `excBacktraceLocations`                    |   6 |    3 | `error.c:1789`                                                         |                                                                      |
| KEEP · stdlib                 | `backtrace-location`          | `excSetBacktrace`                          |   5 |    1 | `error.c:1833`                                                         |                                                                      |
| KEEP · stdlib                 | `backtrace-location`          | `rbFCaller`                                |   9 |    0 | `vm_backtrace.c:1233`                                                  |                                                                      |
| KEEP · stdlib                 | `base64`                      | `Base64`                                   |   5 |    4 | `lib/base64.rb:184`                                                    |                                                                      |
| KEEP · stdlib                 | `big-decimal`                 | `BigDecimal`                               |  30 |   50 | `ext/bigdecimal/bigdecimal.c:4392`                                     |                                                                      |
| KEEP · stdlib                 | `big-decimal`                 | `toD`                                      |   3 |    2 | `ext/bigdecimal/lib/bigdecimal/util.rb:72`                             |                                                                      |
| KEEP · stdlib                 | `cgi`                         | `CGI`                                      |   2 |    3 | `lib/cgi/util.rb:5`                                                    |                                                                      |
| KEEP · stdlib                 | `child-process-adapter`       | `childProcessAdapterConfig`                |   1 |    7 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `child-process-adapter`       | `getChildProcess`                          |   6 |    5 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `child-process-adapter`       | `getChildProcessAsync`                     |   4 |    4 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `child-process-adapter`       | `registerChildProcessAdapter`              |   0 |    7 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `complex`                     | `Complex`                                  |   1 |    3 | `complex.c:2529`                                                       |                                                                      |
| KEEP · stdlib                 | `complex`                     | `complex`                                  |   1 |    3 | `complex.c:2359`                                                       |                                                                      |
| KEEP · stdlib                 | `crypto-adapter`              | `cryptoAdapterConfig`                      |   1 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `crypto-adapter`              | `getCrypto`                                |   5 |    5 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `crypto-adapter`              | `getCryptoAsync`                           |   2 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `crypto-adapter`              | `pbkdf2Async`                              |   0 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `crypto-adapter`              | `registerCryptoAdapter`                    |   0 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `delegate`                    | `DelegateClass`                            |  12 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `delegate`                    | `SimpleDelegator`                          |   1 |    1 | `lib/delegate.rb:318-343`                                              |                                                                      |
| KEEP · stdlib                 | `digest`                      | `Digest`                                   |   3 |    0 | `ext/digest/lib/digest.rb:8`                                           |                                                                      |
| KEEP · stdlib                 | `digest`                      | `DigestClass`                              |   5 |    2 | `ext/digest/lib/digest.rb:20`                                          |                                                                      |
| KEEP · stdlib                 | `dir`                         | `Dir`                                      |  32 |   33 | `dir.c:3632`                                                           |                                                                      |
| KEEP · stdlib                 | `encoding-error`              | `EncodingError`                            |   1 |    0 | `error.c:3371`                                                         |                                                                      |
| KEEP · stdlib                 | `encoding`                    | `Encoding`                                 |  24 |   10 | `encoding.c:1368`                                                      |                                                                      |
| KEEP · stdlib                 | `eof-error`                   | `EOFError`                                 |   6 |   10 | `io.c:15343`                                                           |                                                                      |
| KEEP · stdlib                 | `errno`                       | `Errno`                                    |   6 |    4 | `error.c:2666-2694`                                                    |                                                                      |
| KEEP · stdlib                 | `errno`                       | `SystemCallError`                          |   1 |    0 | `error.c:3380`                                                         |                                                                      |
| KEEP · stdlib                 | `fiber`                       | `Fiber`                                    |   7 |    5 | `cont.c:3530`                                                          |                                                                      |
| KEEP · stdlib                 | `file`                        | `File`                                     | 114 |   86 | `file.c:7354`                                                          |                                                                      |
| KEEP · stdlib                 | `float-domain-error`          | `FloatDomainError`                         |   1 |    0 | `numeric.c:6155`                                                       |                                                                      |
| KEEP · stdlib                 | `frozen-error`                | `FrozenError`                              |   6 |   12 | `error.c:3366`                                                         |                                                                      |
| KEEP · stdlib                 | `fs-adapter`                  | `fsAdapterConfig`                          |   1 |    6 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `fs-adapter`                  | `getFs`                                    |  25 |   24 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `fs-adapter`                  | `getPath`                                  |  23 |   20 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `fs-adapter`                  | `registerFsAdapter`                        |   1 |    6 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `gem`                         | `Gem`                                      |  14 |    9 | `lib/rubygems.rb:11`                                                   |                                                                      |
| KEEP · stdlib                 | `http-adapter`                | `getHttpAsync`                             |   2 |    1 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `http-adapter`                | `httpAdapterConfig`                        |   1 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `http-adapter`                | `registerHttpAdapter`                      |   0 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `immediate-executor`          | `ImmediateExecutor`                        |   1 |    0 | `proc.c:990`                                                           |                                                                      |
| KEEP · stdlib                 | `index-error`                 | `IndexError`                               |   1 |    2 | `error.c:3324`                                                         |                                                                      |
| KEEP · stdlib                 | `io-error`                    | `IOError`                                  |   1 |    2 | `io.c:15342`                                                           |                                                                      |
| KEEP · stdlib                 | `io`                          | `IO`                                       |   9 |    2 | `io.c:15371`                                                           |                                                                      |
| KEEP · stdlib                 | `io`                          | `STDOUT`                                   |   3 |    3 | `io.c:9338`                                                            |                                                                      |
| KEEP · stdlib                 | `io`                          | `print`                                    |   3 |    0 | `io.c:8715`                                                            |                                                                      |
| KEEP · stdlib                 | `io`                          | `printf`                                   |   1 |    0 | `io.c:8589`                                                            |                                                                      |
| KEEP · stdlib                 | `io`                          | `puts`                                     |  14 |    3 | `io.c:8947`                                                            |                                                                      |
| KEEP · stdlib                 | `ipaddr`                      | `IPAddr`                                   |   4 |    7 | `lib/ipaddr.rb:42`                                                     |                                                                      |
| KEEP · stdlib                 | `json`                        | `JSON`                                     |   6 |    3 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `kernel-system`               | `rbFSystem`                                |   4 |    0 | `process.c:4841`                                                       |                                                                      |
| KEEP · stdlib                 | `key-error`                   | `KeyError`                                 |  11 |    9 | `error.c:3325`                                                         |                                                                      |
| KEEP · stdlib                 | `load-error`                  | `LoadError`                                |  25 |   10 | `error.c:3342`                                                         |                                                                      |
| KEEP · stdlib                 | `load`                        | `rbFLoad`                                  |   3 |    4 | `load.c:903`                                                           |                                                                      |
| KEEP · stdlib                 | `local-jump-error`            | `LocalJumpError`                           |   2 |    0 | `error.c:3225`                                                         |                                                                      |
| KEEP · stdlib                 | `marshal`                     | `Marshal`                                  |   5 |   21 | `marshal.c:2555`                                                       |                                                                      |
| KEEP · stdlib                 | `monitor`                     | `Monitor`                                  |   2 |    2 | `ext/monitor/lib/monitor.rb:256`                                       |                                                                      |
| KEEP · stdlib                 | `monitor`                     | `MonitorConditionVariable`                 |   1 |    0 | `ext/monitor/lib/monitor.rb:98`                                        |                                                                      |
| KEEP · stdlib                 | `monitor`                     | `isMonOwned`                               |   1 |    0 | `ext/monitor/lib/monitor.rb:191`                                       |                                                                      |
| KEEP · stdlib                 | `monitor`                     | `monSynchronize`                           |   1 |    0 | `ext/monitor/lib/monitor.rb:200`                                       |                                                                      |
| KEEP · stdlib                 | `monitor`                     | `newCond`                                  |   1 |    0 | `ext/monitor/lib/monitor.rb:209`                                       |                                                                      |
| KEEP · stdlib                 | `monitor`                     | `synchronize`                              |   4 |    1 | `ext/monitor/lib/monitor.rb:203`                                       |                                                                      |
| KEEP · stdlib                 | `mutex`                       | `Mutex`                                    |   8 |    4 | `thread_sync.c:1650`                                                   |                                                                      |
| KEEP · stdlib                 | `name-error`                  | `NameError`                                |  15 |   18 | `error.c:3348`                                                         |                                                                      |
| KEEP · stdlib                 | `nil-class`                   | `NilClass`                                 |   1 |    0 | `object.c:4415-4425`                                                   |                                                                      |
| KEEP · stdlib                 | `no-method-error`             | `NoMethodError`                            |  42 |   39 | `error.c:3360`                                                         |                                                                      |
| KEEP · stdlib                 | `not-implemented-error`       | `NotImplementedError`                      |  44 |   28 | `error.c:3346`                                                         |                                                                      |
| KEEP · stdlib                 | `object-space`                | `ObjectSpace`                              |   2 |    2 | `gc.c:4364`                                                            |                                                                      |
| KEEP · stdlib                 | `open3`                       | `Open3`                                    |   1 |    0 | `lib/open3.rb:81`                                                      |                                                                      |
| KEEP · stdlib                 | `openssl`                     | `Cipher`                                   |   3 |    0 | `ext/openssl/lib/openssl/cipher.rb:16`                                 |                                                                      |
| KEEP · stdlib                 | `openssl`                     | `OpenSSL`                                  |  15 |   10 | `ext/openssl/lib/openssl.rb:16`                                        |                                                                      |
| KEEP · stdlib                 | `os-adapter`                  | `getOs`                                    |   2 |    4 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `os-adapter`                  | `getOsAsync`                               |   4 |   17 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `os-adapter`                  | `osAdapterConfig`                          |   1 |    2 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `os-adapter`                  | `registerOsAdapter`                        |   0 |    2 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `pathname`                    | `Pathname`                                 |   7 |    5 | `ext/pathname/pathname.c:1511`                                         |                                                                      |
| KEEP · stdlib                 | `pp`                          | `PP`                                       |   5 |    5 | `lib/pp.rb:64`                                                         |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `SystemExit`                               |   1 |    4 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `__INTERNAL_resetProcessAdapter_TEST_ONLY` |   0 |    1 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `abort`                                    |   4 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `argv`                                     |   2 |    0 | `process.c:1729`                                                       |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `chdir`                                    |   0 |    1 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `env`                                      |  20 |   29 | `process.c:1729`                                                       |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `exec`                                     |   1 |    0 | `process.c:3015`                                                       |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `exit`                                     |   4 |    0 | `process.c:4467`                                                       |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `getProcessAdapter`                        |   2 |    6 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `isRubyTzUptodate`                         |   1 |    0 | `time.c:702`                                                           |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `onSignal`                                 |   0 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `processAdapterConfig`                     |   2 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `rbArgv`                                   |   5 |    1 | `ruby.c:2980`                                                          |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `rbProgname`                               |   2 |    1 | `ruby.c:2970-2971`                                                     |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `registerProcessAdapter`                   |   2 |    2 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `setArg0`                                  |   1 |    0 | `ruby.c:2842-2849`                                                     |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `setEnv`                                   |  15 |   43 | `hash.c:4975-4985`                                                     |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `setExitCode`                              |   2 |    2 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `setRubyTzUptodate`                        |   1 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `setSourceMapsSupport`                     |   1 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `stderr`                                   |  12 |   19 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `stdin`                                    |   1 |    2 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `process-adapter`             | `stdout`                                   |  19 |   16 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `process`                     | `Process`                                  |  14 |    3 | `process.c:9129`                                                       |                                                                      |
| KEEP · stdlib                 | `queue`                       | `Queue`                                    |   1 |    0 | `thread_sync.c:1677`                                                   |                                                                      |
| KEEP · stdlib                 | `queue`                       | `SizedQueue`                               |   1 |    1 | `thread_sync.c:1696`                                                   |                                                                      |
| KEEP · stdlib                 | `range-error`                 | `RangeError`                               |   3 |    1 | `error.c:3329`                                                         |                                                                      |
| KEEP · stdlib                 | `range`                       | `Range`                                    |  43 |   55 | `range.c:31`                                                           |                                                                      |
| KEEP · stdlib                 | `rational`                    | `Rational`                                 |  27 |   40 | `rational.c:481`                                                       |                                                                      |
| KEEP · stdlib                 | `rational`                    | `ZeroDivisionError`                        |   0 |    2 | `numeric.c:206`                                                        |                                                                      |
| KEEP · stdlib                 | `rational`                    | `rational`                                 |   5 |    9 | `rational.c:2691`                                                      |                                                                      |
| KEEP · stdlib                 | `rb-config`                   | `RbConfig`                                 |   5 |    2 | `tool/mkconfig.rb:21`                                                  |                                                                      |
| KEEP · stdlib                 | `ruby-platform`               | `RUBY_ENGINE`                              |   1 |    1 | `version.c:120`                                                        |                                                                      |
| KEEP · stdlib                 | `ruby-platform`               | `RUBY_PLATFORM`                            |   4 |    0 | `version.c:103`                                                        |                                                                      |
| KEEP · stdlib                 | `runtime-error`               | `RuntimeError`                             |  77 |   40 | `error.c:3365`                                                         |                                                                      |
| KEEP · stdlib                 | `scheduled-task`              | `ScheduledTask`                            |   1 |    0 | `thread_sync.c:626`                                                    |                                                                      |
| KEEP · stdlib                 | `secure-random`               | `SecureRandom`                             |  15 |   10 | `lib/securerandom.rb:41`                                               |                                                                      |
| KEEP · stdlib                 | `set`                         | `Set`                                      |   6 |    0 | `lib/set.rb:228`                                                       |                                                                      |
| KEEP · stdlib                 | `signal-exception`            | `Interrupt`                                |   0 |    1 | `error.c:3319`                                                         |                                                                      |
| KEEP · stdlib                 | `signal-exception`            | `SignalException`                          |   1 |    0 | `error.c:3318`                                                         |                                                                      |
| KEEP · stdlib                 | `socket`                      | `TCPSocket`                                |   2 |    2 | `ext/socket/tcpsocket.c:108`                                           |                                                                      |
| KEEP · stdlib                 | `standard-error`              | `StandardError`                            |  45 |   21 | `error.c:3319`                                                         |                                                                      |
| KEEP · stdlib                 | `stop-iteration`              | `StopIteration`                            |   0 |    1 | `enumerator.c:4578`                                                    |                                                                      |
| KEEP · stdlib                 | `string-io`                   | `StringIO`                                 |  22 |   76 | `ext/stringio/stringio.c:1539`                                         |                                                                      |
| KEEP · stdlib                 | `string-scanner`              | `StringScanner`                            |   3 |    0 | `ext/strscan/strscan.c:1667`                                           |                                                                      |
| KEEP · stdlib                 | `string/force-encoding`       | `forceEncoding`                            |  11 |    3 | `string.c:11005`                                                       |                                                                      |
| KEEP · stdlib                 | `string/force-encoding`       | `isValidEncoding`                          |   4 |    1 | `string.c:10999`                                                       |                                                                      |
| KEEP · stdlib                 | `string/force-encoding`       | `rbObjEncoding`                            |   5 |    3 | `encoding.c:1147`                                                      |                                                                      |
| KEEP · stdlib                 | `struct`                      | `Struct`                                   |   9 |    7 | `struct.c:2166`                                                        |                                                                      |
| KEEP · stdlib                 | `struct`                      | `isStruct`                                 |   1 |    0 | `struct.c:1403`                                                        |                                                                      |
| KEEP · stdlib                 | `tempfile`                    | `Tempfile`                                 |   9 |   18 | `lib/tempfile.rb:89`                                                   |                                                                      |
| KEEP · stdlib                 | `thread-error`                | `ThreadError`                              |   2 |    2 | `thread.c:5451`                                                        |                                                                      |
| KEEP · stdlib                 | `thread-pool-executor`        | `CachedThreadPool`                         |   1 |    0 | `thread.c:897`                                                         |                                                                      |
| KEEP · stdlib                 | `thread-pool-executor`        | `ThreadPoolExecutor`                       |   4 |    2 | `thread.c:897`                                                         |                                                                      |
| KEEP · stdlib                 | `thread`                      | `Thread`                                   |  17 |   47 | `vm.c:4043`                                                            |                                                                      |
| KEEP · stdlib                 | `thread`                      | `rbIterBreakValue`                         |   1 |    0 | `vm.c:2058`                                                            |                                                                      |
| KEEP · stdlib                 | `timeout`                     | `Timeout`                                  |   1 |    2 | `lib/timeout.rb:25`                                                    |                                                                      |
| KEEP · stdlib                 | `type-error`                  | `TypeError`                                |  18 |   22 | `error.c:3322`                                                         |                                                                      |
| KEEP · stdlib                 | `uri`                         | `BadURIError`                              |   1 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `uri`                         | `Error`                                    |   3 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `uri`                         | `Generic`                                  |   9 |    1 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `uri`                         | `HTTPS`                                    |   2 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `uri`                         | `InvalidComponentError`                    |   1 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `uri`                         | `InvalidURIError`                          |   3 |    1 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `uri`                         | `RFC2396Parser`                            |   3 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `uri`                         | `RFC2396_PARSER`                           |   6 |    2 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `uri`                         | `URI`                                      |  17 |    8 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `uri`                         | `Util`                                     |   1 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `verbose`                     | `setVerbose`                               |   3 |    3 | `ruby.c:2916-2920`                                                     |                                                                      |
| KEEP · stdlib                 | `verbose`                     | `verbose`                                  |   5 |    4 | `ruby.c:2910-2913`                                                     |                                                                      |
| KEEP · stdlib                 | `zlib-adapter`                | `GzipWriter`                               |   1 |    1 | `ext/zlib/zlib.c:3841`                                                 |                                                                      |
| KEEP · stdlib                 | `zlib-adapter`                | `getZlib`                                  |   1 |    2 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `zlib-adapter`                | `getZlibAsync`                             |   1 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `zlib-adapter`                | `registerZlibAdapter`                      |   0 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `zlib-adapter`                | `zlibAdapterConfig`                        |   1 |    0 | —                                                                      |                                                                      |
| KEEP · stdlib                 | `zlib`                        | `Zlib`                                     |   6 |    3 | `ext/zlib/zlib.c:4659`                                                 |                                                                      |

## Appendix B: measurement commands

Run from a trails worktree root. The two scripts are kept verbatim so the ledger can be regenerated.

Value exports of `index.ts` (`exports.mjs`):

```js
import fs from "fs";
const src = fs.readFileSync(process.argv[2], "utf8");
const re = /export\s+(type\s+)?\{([^}]*)\}\s*from\s*"([^"]+)"/g;
let m;
while ((m = re.exec(src))) {
  if (m[1]) continue;
  for (let n of m[2].split(",")) {
    n = n.trim();
    if (!n || n.startsWith("type ")) continue;
    const as = n.split(/\s+as\s+/);
    console.log(`${as[as.length - 1]}\t${m[3]}`);
  }
}
```

Importers per export, direct imports (`uses.mjs`; the re-export pass adds importers of the 25 names activesupport and activerecord re-export, through those packages):

```js
// usage: node uses.mjs exports.tsv <repoRoot>  -> name \t module \t importingFiles(src) \t importingFiles(test) \t refs(src)
import fs from "fs";
import path from "path";
const [tsv, root] = process.argv.slice(2);
const exp = fs
  .readFileSync(tsv, "utf8")
  .trim()
  .split("\n")
  .map((l) => l.split("\t"));
const files = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (["node_modules", "dist"].includes(e.name)) continue;
      walk(p);
    } else if (/\.(ts|tsx|mts)$/.test(e.name) && !e.name.endsWith(".d.ts")) files.push(p);
  }
};
for (const pk of fs.readdirSync(path.join(root, "packages"))) {
  if (pk === "ruby-compat") continue;
  const d = path.join(root, "packages", pk, "src");
  if (fs.existsSync(d)) walk(d);
}
const stat = new Map(exp.map(([n, m]) => [n, { m, src: 0, test: 0, refs: 0 }]));
const imre = /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*"@blazetrails\/ruby-compat[^"]*"/g;
for (const f of files) {
  const t = fs.readFileSync(f, "utf8");
  const isTest = /\.test\.ts$/.test(f);
  let m;
  const names = new Set();
  while ((m = imre.exec(t))) {
    for (let n of m[1].split(",")) {
      n = n.trim().replace(/^type\s+/, "");
      if (!n) continue;
      names.add(n.split(/\s+as\s+/)[0]);
    }
  }
  for (const n of names) {
    const s = stat.get(n);
    if (!s) continue;
    isTest ? s.test++ : s.src++;
    if (!isTest) {
      const local = n;
      s.refs += (t.match(new RegExp(`\\b${local}\\b`, "g")) || []).length - 1;
    }
  }
}
for (const [n, s] of stat) console.log([n, s.m, s.src, s.test, s.refs].join("\t"));
```

Other counts:

```sh
# Module carrier sites (source, then tests)
rg -n --type ts 'new Module\(' packages/*/src -g '!packages/ruby-compat/**' -g '!*.test.ts' | wc -l   # 61
rg -n --type ts 'new Module\(' packages/*/src -g '!packages/ruby-compat/**' -g '*.test.ts' | wc -l    # 96
# literal-name sends: gate verdict, then per file
pnpm parity:api:sends                                                                                # OK (143, 143 at 637fa04f91)
npx tsx -e "import('./scripts/parity/send-count.ts').then(async m=>{for(const [f,n] of Object.entries(await m.measure()).sort((a,b)=>b[1]-a[1]))console.log(n,f)})"
# literal send names (63 x "call")
rg -o --type ts 'rbF(Public)?Send\([^,]+,\s*"[^"]*"' packages/*/src -g '!*.test.ts' | grep -o '"[^"]*"$' | sort | uniq -c | sort -rn
# all send calls in package source (296)
rg -c --type ts 'rbF(Public)?Send\(' packages/*/src -g '!*.test.ts' -g '!packages/ruby-compat/**' | awk -F: '{s+=$2} END{print s}'
# README rule-1 table rows (118) vs exports (488)
grep -c '^| `' packages/ruby-compat/README.md
```
