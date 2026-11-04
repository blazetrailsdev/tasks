---
rfc: "0000-no-returned-proxies"
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

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. Never use a `draft-` prefix —
     `draft` is a lifecycle status, not a dir prefix (see top-level README). -->

# RFC — No returned Proxies

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
`delegate.ts` has three. Each story's `## Context` names the trails `file:line`
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
