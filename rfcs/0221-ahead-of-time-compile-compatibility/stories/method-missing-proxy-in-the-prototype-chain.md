---
title: "Install method_missing proxies in the prototype chain, not from the constructor"
status: draft
updated: 2026-11-04
rfc: "0221-ahead-of-time-compile-compatibility"
cluster: proxy-install
packages:
  [
    "activesupport",
    "trailties",
    "actionpack",
    "activerecord",
    "i18n",
    "rack",
    "rake",
    "builder",
    "mini-magick",
  ]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

20 non-test sites emulate Ruby's `method_missing` by returning a `Proxy` from a
constructor:

    constructor(value: string) {
      super(value);
      return new Proxy(this, { get(target, prop) { … } });
    }

A base constructor that returns an object makes that object the `this` of every
derived constructor, so a subclass can no longer install a private class field.
`EnvironmentInquirer extends StringInquirer`
(`activesupport/src/string-inquirer.ts:19`) hit exactly this: `this.#local = …`
fails with `TypeError: Cannot initialize #local on this object` under perry.
V8 tolerates it, which is why it shipped — so **the bug is invisible on Node and
no test can assert it there.**

7 sites already use the form that works, installing the handler into the
prototype chain instead:

    Object.setPrototypeOf(X, new Proxy(Object.getPrototypeOf(X), handler))

`activerecord/src/base.ts:2023` and `relation.ts:2202` are the reference
implementations; `collector.ts:30`, `integration.ts:824`,
`assertions/routing.ts:207`, `test-fixtures.ts:493` and
`activestorage/attached/one.ts:68` are the others. A probe
(`examples/perry-native/perry/probe/setproto-proxy.ts`) confirms the
prototype-chain form behaves identically under perry and Node, while the
constructor-returned form does not.

It is also the closer port. Ruby's `method_missing` is defined on the class and
reached through the ancestor chain; it is not swapped in per instance.

The 20 constructor-returned sites: `actionpack` mime-responds.ts:128,
request/session.ts:46, routing/routes-proxy.ts:86; `activerecord`
connection-adapters/abstract/connection-pool.ts:77; `activesupport`
array-inquirer.ts:8, broadcast-logger.ts:26, string-inquirer.ts:19,
ordered-options.ts:18, time-with-zone.ts:152, multibyte/chars.ts:31; `builder`
xmlbase.ts:36; `i18n` backend/key-value.ts:202; `mini-magick` image.ts:150,
tool.ts:98; `rack` body-proxy.ts:11; `rake` task-arguments.ts:27; `trailties`
configuration.ts:131, application/configuration.ts:598,
generators/app-generator.ts:49, trailtie/configuration.ts:35.

8 further sites return a Proxy over a receiver that is not `this`
(mime-type.ts:222 and :432, tag-helper.ts:767, pg/connection.ts:564,
delegation.ts:264, proxy-wrappers.ts:27, option-merger.ts:15,
chainable.ts:154). Those do not have this defect and are listed only so a sweep
does not mistake them for it.

Only a class whose own class or a subclass installs a private field after
`super()` actually breaks today. `StringInquirer` is the one reached so far; the
rest are latent.

Its history is the argument for this story. trails#9724 first fixed it by
**deriving** `local?` from the string instead of storing it, and review reverted
that: `environment_inquirer.rb` stores `@local`, and a fix that drops a field
Rails holds is a divergence bought for a compiler's benefit. The prototype-chain
conversion is what avoids the trade entirely -- `#local` stays stored exactly as
Rails stores `@local`, and the _returned Proxy_ goes instead (trails#9728). So
converting these sites is not merely tidier; for this class of wall it is the
only fix that does not ask trails to hold state differently from Rails.

**`est-loc: 300` is provisional** — roughly 20 sites at ~15 lines, including
tests. Some sites may resist conversion: `time-with-zone.ts` and
`ordered-options.ts` trap more than `get`, and `string-inquirer.ts` extends
`String`, so its traps need `valueOf`/`toString` bound to the target. Those are
the ones to look at first, because they decide whether this is one story or
several.

## Acceptance criteria

- [ ] Each of the 20 `return new Proxy(this, …)` sites either installs its
      handler in the prototype chain, or carries a note saying why it cannot
- [ ] A subclass of each converted class can declare and read a private field,
      with a test per converted package
- [ ] `respond_to?`-style probing is unchanged: the `has` trap moves with the
      `get` trap
- [ ] The dynamic names each class serves are unchanged, and existing tests pass
      unmodified
- [ ] A lint rule forbids new `return new Proxy(this` under `packages/*/src`

## Definition of done

Not closed by converting only `StringInquirer`. Not closed by deleting a Proxy
whose dynamic names are still used. A site that cannot be converted is closed by
the written reason, not by silence.
