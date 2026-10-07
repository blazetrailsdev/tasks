---
rfc: "0000-ruby-ts-codegen"
title: "ruby-ts-codegen: an IR-based Ruby-to-TypeScript generator, piloted on activejob"
status: draft
created: 2026-10-07
updated: 2026-10-07
owner: "@deanmarano"
packages:
  - "scripts"
max-est-loc: 2500
clusters:
  - tooling
related-rfcs:
  - "0169-activejob-package-port"
  - "0065-prism-codegen"
  - "0086-prism-codegen-productionization"
  - "0084-wide-call-set-burndown"
priority: 5
---

# RFC — ruby-ts-codegen

## Summary

A one-shot generator that turns a Rails gem's Ruby into TypeScript that
passes `tsc`, with every statement it cannot resolve declined behind an
explicit marker for an agent to finish. It is the third attempt at code
generation in this repo and differs from the retired second one
(`scripts/prism-codegen`, deleted in trails PR 6168) in three ways that four
measurement spikes showed to be the ones that matter: it has an intermediate
representation with first-class nodes for the Ruby idioms that do not
translate literally; it resolves receivers, member kind and async-ness
through the TypeScript checker over the built `.d.ts` of the ported
packages, never through name sets; and its two inputs that Ruby does not
carry, a schema and a type-hint sidecar, are generated rather than hand
written.

Output is TypeScript, never JavaScript. It is hand-owned the moment it is
emitted: there is no regeneration and no CI gate over generated code. The
pilot corpus is activejob, whose port RFC 0169 owns; this RFC owns only the
tool and the pilot run, and RFC 0169's stories are neither re-filed nor
re-ordered by it.

## Motivation

The second attempt was retired because no generated line ever shipped: its
ten emitted files produced 963 TypeScript errors under `checkJs`, and the
retirement story names three missing pieces: a Ruby core-library shim, a
Ruby-constant to trails-module import map, and a type layer. It also had no
IR. Prism AST went straight to `ts.factory` in one pass, so method-versus-
property and await decisions were taken from name tables (`port-symbols.ts`,
`async-source.ts`) rather than from the receiver.

Four spikes run on 2026-10-06 and 2026-10-07 (audit reports `codegen-ir-plan-*.md` under
`~/.btwhooks/data/github/blazetrailsdev/trails/audits/`) measured whether those
gaps can now be closed:

- **Type layer.** Over the built `.d.ts` of twelve trails packages, a
  checker-backed resolver identified a concrete target for 81.7% of the 208
  call sites in `activestorage/app/models/active_storage/blob.rb` and 70.2%
  of the gem's 2,641 call sites with no hints at all. The unresolved
  remainder was dominated by one cause the checker cannot fix: Ruby values
  with no static type (method parameters, block parameters, `class_attribute`
  registries).
- **Hints.** Types recorded from a `TracePoint` run of Rails' own test
  suite cut `blob.rb`'s unresolved share to 8.2% and the gem's to 19.8%.
  TypeProf and the community RBS collections did not help (28.9% and 30.4%
  gem-wide). A model writing hints from the source alone matched the trace on
  98% of comparable facts and resolved 9.3% unresolved on twenty blind files
  against the trace's 11.0%, and 6.2% against 18.6% on code the tests never
  ran.
- **Import map.** 459 of 467 constant references in activestorage classified
  without ambiguity by three mechanical strategies: a walk of the package's
  namespace object type, the `rubyFileToTs` file convention, and a unique
  export name.
- **Core shim.** ruby-compat now has 437 value exports; only 13 core-method
  sites in activestorage lacked a target.
- **activejob.** With no hints, 43.3% of its 1,539 call sites are
  unresolved, worse than activestorage, because it is framework machinery
  rather than models. Teaching the resolver the trails Concern shape
  (`Module<{...}> & { ClassMethods }`, and `X::ClassMethods` sub-modules
  resolved against `X`'s includers) recovered `set_callback`,
  `define_callbacks` and `run_callbacks` in one step.

What this does not fix is also measured: Ruby is untyped, so without hints
roughly 30% of call sites decline and one unresolved receiver poisons the
chain after it (301 of activestorage's 788 failures were such cascades);
passing `tsc` is not passing the parity gates; and unported dependencies
(Marcel, the cloud SDKs, the external queue adapters) stay unresolved.

## Design

The full design, with the node table, the pass order, the type-resolution
mechanics, the decline marker and the ratified-deviation table, is the first
audit report (`codegen-ir-plan-20261006T181917Z.md`). This section is the
part a story needs to hold in its head.

### The IR

One IR, built once, annotated by passes, lowered once. Nodes are immutable
and carry a stable id and a Ruby `file:line`. Passes write to side tables
keyed by node id: `resolution`, `type`, `async`, `decline`. Lowering reads
the IR plus the tables.

Declarations: `File`, `ClassDecl`, `ModuleDecl{concern}`, `SingletonScope`,
`MethodDef`, `Param{kind}`, `ConstAssign`, `Include`, `Extend`, `Prepend`,
`ConcernIncluded`, `ConcernClassMethods`, `AttrDecl`, `ClassAttributeDecl`,
`MattrDecl`, `DelegateDecl`, `DelegateMissingTo`, `AliasDecl`,
`AutoloadDecl`, `VisibilitySection`. Any other class-body call (`has_many`,
`validates`, a callback macro) is an ordinary `Call` whose `self` is the
class.

Expressions and statements: the ordinary set, plus one node per Ruby
semantic that has exactly one reviewed lowering:

| Node                                          | Ruby                                                                                       | Lowering rule                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Truthy(x)`                                   | every condition position                                                                   | By static type. Boolean: `x`. Excludes `false`, `0`, `""`: `x != null`. Else `x != null && x !== false`. Unknown: ruby-compat `rtest`.                                                                                              |
| `OrValue`, `AndValue`, `OrAssign`             | value-position `\|\|`, `\|\|=`                                                             | `??` only when the left type excludes `false`; otherwise the `Truthy` test with a temp. Never bare `\|\|`.                                                                                                                          |
| `Fetch`                                       | `h.fetch(k, …)`                                                                            | ruby-compat `fetch`. Never `??`.                                                                                                                                                                                                    |
| `Present`, `Blank`, `Presence`                | `present?` etc.                                                                            | activesupport `isPresent`, `isBlank`, `presence`.                                                                                                                                                                                   |
| `KwArgs`, `KwParam`                           | keywords                                                                                   | The settled trails options idiom; "passed as nil" stays distinct from "absent". `**h` via `keywordSplat`.                                                                                                                           |
| `ImplicitReturn`                              | tail position                                                                              | Marked in the build pass through `if`, `case`, `begin` arms. `initialize` and setters exempt.                                                                                                                                       |
| `Yield`, `BlockGiven`, `BlockPass`, `SymProc` | blocks                                                                                     | Trailing `block` parameter; `&:sym` is an arrow whose body the checker resolves as property or call.                                                                                                                                |
| `SafeNav`                                     | `a&.b`                                                                                     | `?.` for member access; a null-guarded conditional for function-style dispatch.                                                                                                                                                     |
| `Tap`, `Then`                                 | `tap`, `then`                                                                              | A temp and the block body, decided **before** member lookup: `then` on a thenable otherwise resolves to the promise `then`.                                                                                                         |
| `BangCall`, `PredicateCall`                   | `save!`, `image?`                                                                          | Names only through `scripts/parity/conventions.ts`.                                                                                                                                                                                 |
| `Sym` vs `Str`                                | `:short`, `"short"`                                                                        | Distinct nodes. `Sym` lowers to a bare string; symbol hash keys to camelCase keys (RFC 0149). A statement that tests `Symbol === x` / `is_a?(Symbol)` / `when Symbol` or calls `symbolize_keys` is declined for the `":name"` rule. |
| `StrMutate`                                   | `<<`, `gsub!`, `replace`, `+""`, `.b`, `.freeze`, `.dup` on a string                       | `freeze`/`dup`/unary plus: identity. Append to a local: rebind. Else declined, citing "Ruby Strings are JS string primitives".                                                                                                      |
| `CaseEq`                                      | `===`, `when`                                                                              | Class operand: `instanceof` or `typeof` image. Range or regex: `rbEqq`. Literal: `===`.                                                                                                                                             |
| `ClassIvar`                                   | `@x` at class level                                                                        | Own-property read and write, never a plain static read (a static field is inherited through the prototype chain; a Ruby class-level ivar is not).                                                                                   |
| `ObjectProtocol`                              | `respond_to?`, `is_a?`, `dup`, `send`, `class`, `instance_variable_get`, `singleton_class` | The matching ruby-compat function. Receiver-agnostic.                                                                                                                                                                               |
| `Raise`, `Rescue`, `Ensure`                   |                                                                                            | `throw new X(m)`; `catch` with `instanceof` arms and a rethrow; `finally`, or `rbEnsure` when the protected body returns an un-awaited promise.                                                                                     |

### Passes, in order

1. Parse and build: a Ruby subprocess dumps Prism (the `prism` gem bundled
   with Ruby 3.3; no npm dependency returns), the builder desugars, resolves
   locals, marks tail positions, inserts `Truthy`, records each block's
   `self` kind.
2. Gem index: every class, module, def, macro, ivar and constant, before any
   body.
3. Constant resolution: lexical nesting and ancestors; then namespace-object
   walk, `rubyFileToTs` convention, unique export name. Ambiguous or missing
   declines its uses. Output is a per-file import plan.
4. Skeleton emission: every gem file as a TypeScript declaration in a virtual
   FS, so every gem class is a real type before any body is lowered.
5. Receiver and call resolution against a live checker: IR intrinsic, then
   member lookup by checker (gem and trails alike), then `operatorSpelling`,
   then the core dispatch table, then decline. Includes the Concern shape.
6. Async propagation: a fixpoint over resolved call edges only. Seeds are
   calls whose resolved signature returns `Promise`/`PromiseLike`. A def
   containing a decline is async-undetermined and emitted as inferred so far.
7. Lowering: one function per node kind; names from `conventions.ts`, paths
   from `rubyFileToTs`.
8. Decline emission and the typecheck loop: emit, run the checker, map every
   diagnostic to its statement, re-emit it as a decline, repeat; a def that
   still fails has its body declined whole. That is what makes "every emitted
   file typechecks" true by construction.

### Types

The checker does the inference. Bodies are lowered statement by statement
into the virtual file and the checker is asked for each receiver's type and
each call's resolved signature. `self` is `this` in a class and a
`this:`-typed host interface in a module. A call whose receiver is `any`,
`unknown`, an uninstantiated type parameter or the error type is declined;
there is no name-based fallback.

The hint sidecar is a small reviewed file per gem: parameter, ivar, attribute
and host types that Ruby does not state. It is produced by a pipeline, not by
hand: a `TracePoint` run of the gem's own tests gives evidence, a model pass
over source plus trace writes the entries, and a validator holds three gates
(every name is in a closed vocabulary; every key names a real def and
parameter; every hint covers what the trace observed). Review is limited to
the disagreements, which were 4 of 232 in the spike.

### Dispatch into ruby-compat

A receiver the checker types as string, number, array, record, range or
`null` is looked up in a reviewed core dispatch table keyed by
`(Ruby class, Ruby method)`, each row one of: ruby-compat function,
activesupport core-ext function, native JS member, IR node. One test per row.
A missing method declines with `core-method-missing` and the Ruby name, and
the run writes a wanted list. The generator never adds to ruby-compat: that
package's rule 1 needs a real call site and rule 2 needs an MRI citation and
a receipt.

### The decline marker

```ts
declined<T = unknown>(site: string, reason: DeclineReason, ruby: string): T
```

A real call, so it typechecks in statement, value and tail position; it
throws at run time; the Ruby source travels as a string argument because
`no-freeform-comments` strips prose comments; the reason is one of a closed
set (`receiver-untyped`, `member-not-found`, `core-method-missing`,
`const-unresolved`, `external-gem`, `string-mutation`,
`symbol-discrimination`, `method-missing`, `module-super`,
`async-in-constructor`, `override-arity`, `tsc-diagnostic`). A declined def
keeps its real signature. The helper lives in one file of the generated
package with no Ruby counterpart, and the package is not done until the
marker count is zero.

### Ratified deviations

Encoded in the lowering table: the idioms list, generated attribute readers
as properties, compile-time-only visibility, Strings as primitives,
`ObjectProtocol`/`CaseEq`, `singleton_class`, `ClassIvar`. Partly encoded:
call-time constant resolution (`autoload` declarations lower to namespace
seats; import cycles are found by the post-emit plain-node import and left to
the agent), `Relation` async (awaits come from signatures; an async def
returning a relation is declined). Left to the agent by declining: the dual
sync/async hash, override arity (TS2416), `method_missing` tables, create
paths awaiting their block. The generator never writes a receipt, a baseline
row or a `@noRailsEquivalent` tag.

## The LOC ceiling is lifted for this RFC

Owner decision, 2026-10-07: this RFC is to be delivered working, not shipped
small. The retired generator was built as ceiling-sized slices and never
produced a running whole. Its stories are therefore cut as working
increments, each ending with a tool that runs end to end over activejob, at
roughly 1,000 to 2,200 lines each. `max-est-loc: 2500` in this README's
frontmatter lifts the validator's cap for them, and the worker prompt's
"Hard rules" `PR_MAX_LOC` must be set to match when these stories are
spawned; a PR for one of them cites this section and is not split to fit the
default ceiling.

## Non-goals

- **Lifting the existing TypeScript port into the IR.** Ruby to TS only
  (owner decision).
- **Regeneration.** Output is hand-owned after one run; no generated-code CI
  gate, no golden snapshots tied to `vendor:fetch`.
- **Autonomous porting.** Typechecks is not correct. Tests are not generated;
  the parity gates are not satisfied by construction.
- **Porting activejob itself.** RFC 0169 owns every port story. This RFC's
  pilot run skips any file whose trails twin already exists, so done 0169
  stories are never overwritten, and a still-open 0169 story may start from
  the generated file for its area if it chooses.
- **Adding exports to ruby-compat.** The wanted list is a report.
- **TypeProf and community RBS** as hint sources. Measured; they do not help.

## Alternatives considered

- **Revive `scripts/prism-codegen`.** It had no IR and no type layer, and its
  963 errors were structural, not coverage gaps. Rejected.
- **JavaScript output with `checkJs`.** The second attempt's choice. Rejected
  by owner decision; output must pass `tsc`.
- **Hand-written hint files.** The second spike showed the trace generates
  most of them and the fourth showed a model generalizes the rest with a
  98% match rate; hand-writing turns the sidecar into a second port.
- **A global raise of the tasks `est-loc` cap.** The constant mirrors the
  worker PR ceiling by design; a per-RFC `max-est-loc` records the decision
  where the stories live instead.

## Rollout

1. `codegen-ir-and-prism-bridge`.
2. `codegen-hint-pipeline`. The recorder, the validator and the model pass
   need only the IR's gem index, so this lands before the resolver and gives
   it the sidecar its checkpoint is measured with.
3. `codegen-resolver-and-resolution-report`. Carries the kill criterion:
   under 85% of activejob call sites resolved with the generated sidecar plus
   review of flagged entries only, and the owner postpones the RFC here.
4. `codegen-lowering-and-first-output`.
5. `codegen-lowering-mixins-super-async`.
6. `codegen-pilot-activejob-generation-run`, which publishes the report and
   the `codegen/activejob` branch RFC 0169's open stories may start from.

## Seed completeness

Six stories, 8,300 est-loc of tool and tests against the 9,173 deleted
with the second attempt. Each is a working increment with its own CLI and its
own measured output. A story added later is a spec miss; note which Rails
construct or trails shape the authoring missed in its Context.

## Verification

- `codegen-ir-and-prism-bridge`: `pnpm codegen:ir` builds a complete IR for every `.rb` under
  `activejob/lib` and `activestorage/{app,lib}` with zero unhandled node
  kinds, asserted by a test.
- `codegen-hint-pipeline`: `pnpm codegen:hints:check activejob` reports zero gate violations
  on the committed sidecar.
- `codegen-resolver-and-resolution-report`: `pnpm codegen:resolve activejob` reports at least 85% of call sites
  resolved with that sidecar; the no-hint baseline is 43.3% unresolved.
- `codegen-lowering-and-first-output`: `tsc` passes on the emitted activejob tree, asserted by a test that
  runs the generator and the checker.
- `codegen-lowering-mixins-super-async`: the marker count on activejob falls by at least the share mixins,
  `super` and awaits held in the previous story's report, recorded before and after.
- `codegen-pilot-activejob-generation-run`: an audit report with per-file decline counts, and zero `declined(`
  on any file whose RFC 0169 story is `done`.

## Open questions

- Whether the `declined` helper file trips `parity:api:extra` in the
  generated package. It has no Rails-matched file, so it should not count;
  `codegen-lowering-and-first-output` confirms.
- Whether per-statement checker queries over 218 defs are fast enough with a
  language-service host. One cold program over twelve packages' declarations
  took about 11 seconds in the spike; `codegen-resolver-and-resolution-report` measures the incremental cost.
