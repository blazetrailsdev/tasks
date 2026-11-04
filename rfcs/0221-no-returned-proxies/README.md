---
rfc: "0221-no-returned-proxies"
title: "No returned Proxies: method_missing dispatch lives in the prototype chain"
status: draft
created: 2026-11-04
updated: 2026-11-04
owner: "@deanmarano"
packages:
  - actionpack
  - actionview
  - activemodel
  - activerecord
  - activesupport
  - builder
  - i18n
  - image-processing
  - mini-magick
  - rack
  - rake
  - ruby-compat
  - thor
  - trailties
clusters:
  - gate
  - constructor-returned
  - delegator
  - factory-returned
related-rfcs:
  - "0189-activerecord-surfaced-deviations"
  - "0093-proxy-dynamic-method-consistency"
---

# RFC 0221 — No returned Proxies

## Summary

trails emulates Ruby's `method_missing` with a JS `Proxy` in two shapes. One
installs the handler in the prototype chain and returns nothing:
`Object.setPrototypeOf(X, new Proxy(Object.getPrototypeOf(X), handler))`. The
other wraps an object and hands the wrapper back to the caller: a constructor
ending in `return new Proxy(this, …)`, or a factory returning
`new Proxy(target, …)`. This RFC retires the second shape. Every site that
returns a Proxy gets one story, and a lint gate stops new ones.

## Motivation

A Proxy handed back to a caller does three kinds of damage, and Node hides all
three:

- **Private fields break.** When a base constructor returns an object, that
  object becomes `this` for every derived constructor, so a subclass cannot
  install a `#private` field on it. V8 tolerates this. An ahead-of-time
  runtime does not: compiling the boot graph with perry, `EnvironmentInquirer
extends StringInquirer` failed with `TypeError: Cannot initialize #local on
this object`. trails#9724 worked around that one subclass. The class that
  causes it is the `string-inquirer-method-missing-in-prototype-chain` story.
  `i18n`'s `SubtreeProxy` declares private fields and returns a Proxy today.
- **Identity splits.** A factory Proxy over another receiver (`OptionMerger`
  over its context, `stripThenable`, `pgConnection`) is a second object that
  is `!==` the one it wraps, so a `WeakMap` key, a `===`, or a `#field` read
  through the wrapper does not behave like the original.
- **It is the further port.** Ruby's `method_missing` is defined on the class
  and reached through the ancestor chain after a lookup misses. It is not
  swapped in for each instance. The prototype-chain form is that shape: the
  trap fires only for a name the receiver and its own prototypes do not
  answer.

Seven sites already use the prototype-chain form and are the references:
`activerecord/src/base.ts:2031` and `relation.ts:2200` (class level), and
`abstract-controller/collector.ts:30`, `action-dispatch/testing/integration.ts:824`,
`testing/assertions/routing.ts:288`, `activerecord/src/test-fixtures.ts:493` and
`activestorage/src/attached/one.ts:81` (instance level, with a
`Object.create(parent)` link spliced in so `instanceof` the parent still
holds). trails#9572 is the prior art for an instance-level dispatch that used
to be per-record: it moves record attribute placeholders into a Proxy above
`Model.prototype`, and it is the spike for 0189's
`record-method-missing-moves-into-the-prototype-chain`. That story is about
records, which do not return a Proxy (CLAUDE.md, "Records are not Proxies").
It is related to this RFC and stays where it is.

## Design

### The inventory

`git grep -n "new Proxy(" packages/*/src`, excluding tests and test helpers,
finds 53 sites at `main` `952b938a38`. `docs/method-missing-definers.md` was
used as a cross-check. 37 return the Proxy to a caller, and each has a story:

| Cluster                | Shape                                                                              | Stories |
| ---------------------- | ---------------------------------------------------------------------------------- | ------- |
| `constructor-returned` | `return new Proxy(this, …)` in a constructor (or allocator)                        | 21      |
| `delegator`            | `return methodMissingProxy(this, …)`, plus retiring the helper                     | 5       |
| `factory-returned`     | a function or exported `const` whose value is a `new Proxy(…)` over another object | 11      |
| `gate`                 | the lint rule                                                                      | 1       |

Two files with two sites share a story (`mime-type.ts`, `time-with-zone.ts`).
`delegate.ts` has three. Sizes come from each handler's length (2–38 lines)
plus a subclass test: 40 for a handler under ~15 lines, 60 to ~30, 100 above
that or with several call sites. The 38 stories total about 2,180 lines, and
none exceeds 120. Each story's `## Context` names the trails `file:line`
and the Rails or gem `file:line` it mirrors.

Not in scope, because nothing returns the Proxy:

- **Already in the prototype chain**: the seven reference sites above, plus
  `actionmailer/src/base.ts:235`, `trailties/src/trailtie.ts:217`,
  `trailties/src/engine/lazy-route-set.ts:41`,
  `thor/src/core-ext/hash-with-indifferent-access.ts:25` and
  `mail/src/field.ts:329`.
- **Private to a method or field**: `activemodel/src/serialization.ts:304`
  (local) and `activerecord/src/connection-adapters/pool-manager.ts:9` (a
  private field the class reads itself).
- **Not runtime package code**: `activerecord/src/support/stubs/strong-parameters.ts`
  (a test stub), the template sinks that `trails-tsc` generates
  (`build-templates.ts:48`, `plugins/tse.ts:316`), and `solid-queue/src/semaphore.ts`,
  where `Proxy` is solid_queue's own `Semaphore::Proxy` class.

### The conversion

For a `method_missing` site the target shape is fixed:

```ts
Object.setPrototypeOf(
  Klass.prototype,
  new Proxy(Object.create(Object.getPrototypeOf(Klass.prototype)), handler),
);
```

The constructor then returns nothing. A `get` trap here sees only names that
missed the instance and `Klass.prototype`, so the "is it defined" check most
handlers start with goes away. A `set` trap fires only for a name the receiver
does not own, which is Ruby's `name=` miss. A `has` trap moves with the `get`
trap, so `rbObjRespondTo` answers as before. The `respond_to_missing?` gate
rules in CLAUDE.md ("Ruby protocol methods with a different JS mechanism")
still apply.

The trap reads per-instance state through `receiver`, not through a closed-over
`this`, which is the one real change in each handler. A trap that cannot reach
some state that way says so in its story.

Five `factory-returned` sites are not `method_missing` at all (a Hash default,
a frozen array, a lazy module, a thenable mask, a binding). Their stories name
the non-Proxy shape that Rails or Ruby uses instead.

### The gate

`no-returned-proxy-lint-gate` lands first. It enrolls today's sites in an
only-shrink list, one row per story, so no new returned Proxy can appear while
the burndown runs. Each story deletes its row. The gate is not a deviation
register for new work: CLAUDE.md, "A documented deviation is debt, not
permission".

## Relationship to the ahead-of-time compile RFC

tasks#318 (draft, `ahead-of-time-compile-compatibility`) proposes one umbrella
story, `method-missing-proxy-in-the-prototype-chain`, with a provisional
`est-loc: 300` over 20 constructor sites. It notes that three of those sites
trap more than `get`, and that this decides whether the work is one story or
several. This RFC is that split. Its 20 sites are 20 of this RFC's 21
`constructor-returned` stories (the 21st is `mime-type.ts`, which the
umbrella's count put with the eight "not `this`" sites). The other six of
those eight sites are this RFC's `factory-returned` stories. tasks#318 should
drop its umbrella story and keep `optional-peer-deps-are-not-reachable`, which
is unrelated. This RFC is justified without perry: a returned Proxy is wrong
on Node too, for the identity and fidelity reasons above.

## Non-goals

- **Records.** They are not Proxies by ratified rule. 0189's
  `record-method-missing-moves-into-the-prototype-chain` (trails#9572) owns
  their dispatch.
- **Removing `Proxy` from the repo.** The prototype-chain form is a Proxy. The
  rule is about where it sits, not whether it exists.
- **Perry's own defects.** These are tracked in `examples/perry-native` and in
  `ahead-of-time-compile-compatibility`, not here.

## Alternatives considered

- **Keep returned Proxies and forbid private fields on their subclasses.** It
  fixes only the AOT symptom and leaves identity split and the per-instance
  shape Ruby does not have. A rule nobody can lint for subclasses in
  application code is not a fix.
- **One umbrella story (tasks#318).** The sites differ: some trap `set` or
  `has`, some extend `String` or `Array`, and five are not dispatch at all.
  One 300-line story would either overrun the PR ceiling or ship half its
  sites. Per-site stories can be claimed in parallel and close one at a time.
- **A shared prototype-chain installer in ruby-compat from day one.** It may
  fall out of the delegator cluster (`retire-method-missing-proxy-helper`),
  but writing it before two sites are converted guesses its shape. Sites
  write the form inline first, as the seven reference sites do.

## Rollout

1. **Gate:** `no-returned-proxy-lint-gate`, so the count can only fall.
   Every other story lists it in `deps`, so the ready queue cannot offer a
   conversion before the gate exists.
2. **The live defect and the subclass-heavy bases first:**
   `string-inquirer-method-missing-in-prototype-chain`,
   `ordered-options-method-missing-in-prototype-chain`,
   `ruby-compat-delegator-delegates-through-prototype-chain`,
   `i18n-subtree-proxy-without-a-returned-proxy`.
3. **Remaining `constructor-returned` and `delegator` stories**, in any
   order; then `retire-method-missing-proxy-helper`, which depends on the
   four delegator stories.
4. **`factory-returned` stories**, in any order. The five non-dispatch
   stories (`database-configuration-…`, `errors-empty-array-…`,
   `psych-adapter-yaml-…`, `strip-thenable-…`, `rb-f-binding-…`) do not
   depend on the prototype-chain form and can run alongside phase 2.

## Verification

- The gate's enrollment list reaches **0 rows** (37 at birth) and is deleted
  with its last story.
- `git grep -nE "return new Proxy\(|return methodMissingProxy\(" packages/*/src`
  outside tests answers nothing.
- Every `Proxy` row in `docs/method-missing-definers.md` reads
  `Proxy (proto chain)`, `Proxy (class chain)` or `Proxy (module chain)`.

## Open questions

1. **Do the five non-dispatch factory stories belong here?** They return a
   Proxy, so they meet the RFC's rule, but none is `method_missing`.
   Recommendation: keep them, since the gate would otherwise need permanent
   rows for them. Resolve before `status: active`.
2. **Where does the frozen-write `FrozenError` for a native Array come from**
   (`errors-empty-array-without-a-proxy`)? If the repo has no convention, that
   story converges on a frozen array raising JS `TypeError` and records the
   difference. Deferred to that story.

## Changelog

- 2026-11-04: review: every story depends on the gate; the gate covers
  helper returns; explicit-member and non-dispatch stories get their own
  criteria.
- 2026-11-04: initial RFC (38 stories), folding tasks#318's
  `method-missing-proxy-in-the-prototype-chain`.
