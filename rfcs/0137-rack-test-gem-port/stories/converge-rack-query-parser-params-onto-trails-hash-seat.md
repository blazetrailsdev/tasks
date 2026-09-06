---
title: "Give Rack::QueryParser::Params the trails Hash seat so three when-Hash patches delete"
status: ready
updated: 2026-09-06
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 28
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::QueryParser::Params` is `class Params < Hash`
(`vendor/rack/lib/rack/query_parser.rb:260-262`), so every Ruby `when Hash` /
`is_a?(Hash)` arm in the tree matches one. `parse_nested_query`
(`query_parser.rb:110`) returns `params.to_h`, converting only the TOP level, so
a parsed query's NESTED containers are live `Params` instances.

trails' seat for a Ruby Hash is a plain object, and `isPlainObject`
(`packages/activesupport/src/hash-utils.ts:334-340`) tests
`proto === Object.prototype || proto === null` — which a `Params` instance
fails. #7529 made `_normalizeParams` a faithful recursive port, which for the
first time puts real `Params` instances in the nested slots, and three call
sites had to be patched around it:

- `packages/rack/src/query-parser.ts` carries an invented
  `Object.defineProperty(Params.prototype, "__proto__", { value: undefined, ... })`.
  Rack needs no key guard because a Ruby Hash key is an ordinary key; JS
  inherits a `__proto__` ACCESSOR from `Object.prototype` that
  `params["__proto__"] = v` writes through — `__proto__[x]=1` reaches
  `Object.prototype.x` via the `params[k] ||= make_params` arm
  (`query_parser.rb:184`). It is a bare statement, so it can carry no receipt
  tag, and it is the only un-receipted invented line in that file.
- `packages/rack-test/src/utils.ts` carries `isHash` (`@noRailsEquivalent
PERMANENT`), an invented predicate spelling `isPlainObject(v) || v instanceof
Params`, used at the six `when Hash` arms ported from
  `vendor/rack-test/lib/rack/test/utils.rb`.
- `packages/actionpack/src/action-dispatch/request/utils.ts`'s `normalize` has a
  `!(params instanceof Params)` clause bolted onto its prototype check, standing
  in for `when Hash` at `request/utils.rb:54`.

All three are the same root cause: trails has one Hash seat and `Params` is not
in it.

**`make_params` cannot simply return a plain object.** That was tried in #7529
and reverted: `packages/rack/src/multipart.ts:309` calls `params.toParamsHash()`,
the port of `alias_method :to_params_hash, :to_h` (`query_parser.rb:261`), so
the container must really be a `Params`. 103 tests fail otherwise.

## Converged shape

Give `Params` instances the trails Hash seat so all three patches delete. The
likely shape is a `Params` whose instances carry `Object.prototype` (or null) as
their prototype while `to_params_hash` reaches them another way — e.g. a
null-prototype instance plus `toParamsHash` as a static taking the hash, or
teaching `isPlainObject` the one extra shape. Whichever is chosen, the
acceptance is that the three patches above are deleted, not relocated.

## Acceptance criteria

- [ ] The `Object.defineProperty(Params.prototype, "__proto__", ...)` statement
      in `packages/rack/src/query-parser.ts` is gone, and
      `parse_nested_query("__proto__[x]=1")` still does not reach
      `Object.prototype.x`.
- [ ] `isHash` in `packages/rack-test/src/utils.ts` is gone and its six call
      sites read `isPlainObject`, as the ported `when Hash` arms should.
- [ ] `normalize` in `packages/actionpack/src/action-dispatch/request/utils.ts`
      drops its `instanceof Params` clause.
- [ ] `multipart.ts:309`'s `toParamsHash()` call still works; `packages/rack`,
      `packages/rack-test` and `packages/actionpack` suites stay green.
- [ ] `pnpm parity:api` / `parity:test` deltas non-negative; both call gates
      green with no new baseline rows.
