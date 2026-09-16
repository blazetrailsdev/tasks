---
title: "Port Hash#each/each_key/each_value/each_pair onto ruby-compat Hash and converge subclasses"
status: draft
updated: 2026-09-16
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#7832 added `eachKey` / `eachValue` / `eachPair` / `each` to
`packages/activesupport/src/ordered-hash.ts` with `@noRailsEquivalent PERMANENT`
receipts, because OrderedHash inherits them from `::Hash` in Rails
(`activesupport/lib/active_support/ordered_hash.rb:24`). Their real home is
ruby-compat's `Hash` (`packages/ruby-compat/src/hash.ts:397`), mirroring
`vendor/ruby/hash.c:3060` (`rb_hash_each_value`), `:3098` (`rb_hash_each_key`),
`:3149` (`rb_hash_each_pair`), `:7219` (`each` = `each_pair`): yield, return self;
blockless returns an enumerator.

Putting them on `Hash` failed the build because subclasses diverge from Ruby's
shape:

- `packages/rack/src/headers.ts:68-84` `each`/`eachKey`/`eachValue` return `void`
  (Rack::Headers < Hash — should return self).
- `packages/activesupport/src/hash-with-indifferent-access.ts` `each(fn(pair))`
  yields a single pair and returns `this`; Ruby's yields key, value.

Also three Map-backed sites carry `@missingRailsCall each_value — PERMANENT`
(`current-attributes.ts` resetAll, `deprecation/deprecators.ts` each,
`testing/time-helpers.ts` unstubAllBang) that could converge if those maps
were `Hash` instances.

## Acceptance criteria

- `Hash` in ruby-compat defines `eachKey`/`eachValue`/`eachPair`/`each` per hash.c.
- `OrderedHash` drops its own copies and inherits them.
- `rack` Headers and HWIA `each*` converge to the Ruby signature (return self, key/value yield).
- `parity:api:calls`, `calls:args`, `extra:gate` stay green.
