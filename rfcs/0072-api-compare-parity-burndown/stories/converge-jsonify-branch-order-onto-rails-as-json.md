---
title: "converge-jsonify-branch-order-onto-rails-as-json"
status: done
updated: 2026-08-07
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6205
claim: "2026-08-07T22:00:40Z"
assignee: "converge-jsonify-branch-order-onto-rails-as-json"
blocked-by: null
closed-reason: null
---

## Context

`JSONGemEncoder#jsonify` was ported into
`packages/activesupport/src/json/encoding.ts` by the PR for
`activesupport-json-encoding-jsongemencoder-port`, which relocated trails'
existing `as_json` traversal (previously `asJsonValue` in
`packages/activesupport/src/json.ts`) into the Rails method rather than
rewriting it. The relocation was the story's scope; the branch order was not.

Rails' `jsonify` (`vendor/rails/activesupport/lib/active_support/json/encoding.rb:85-102`)
is a `case` on Ruby type, in this order:

- `String, Integer, Symbol, nil, true, false` → the value unchanged
- `Numeric` → `value.as_json`
- `Hash` → new hash, keys stringified unless already Symbol/String, values recursed
- `Array` → `value.map { |v| jsonify(v) }`
- else → `jsonify value.as_json`

trails' body instead dispatches: nullish → value; an `asJson` method on the
value → call it; a Temporal instance → `temporalAsJson`; Array; `toHash`
(HashWithIndifferentAccess); Map or plain object → key-filtered hash; any other
object without `toJSON` → spread and recurse; else the value.

Two structural differences behind that:

- Rails applies `only`/`except` once, via `value.as_json(options)` in `encode`
  before `jsonify` runs, and `jsonify` itself takes no options. trails threads
  normalized options through every recursion level (`this.normalizedOptions`),
  because it has no `as_json` layer to apply them in.
- The `as_json` layer Rails dispatches through, `core_ext/object/json.rb`, is
  unported — `pnpm parity:api --package activesupport` reads
  `core_ext/object/json.rb -> core-ext/object/json.ts` at 0/6. `Object#as_json`
  (`:62-64`), `Hash#as_json`, `Array#as_json`, and the Time/Date arms
  (`:200-228`) all live inline in `jsonify`/`temporalAsJson` instead.

So converging `jsonify` is gated on porting `core_ext/object/json.rb` first;
doing it in isolation would just move the same inlined logic around. The
deviation is cited in the `jsonify` JSDoc and points at this story.

## Acceptance criteria

- [ ] `core_ext/object/json.rb` is ported to
      `packages/activesupport/src/core-ext/object/json.ts` — at minimum the
      `as_json` arms `jsonify` currently inlines: `Object#as_json`,
      `Hash#as_json` (including its `only`/`except` filtering), `Array#as_json`,
      and the `Time`/`DateTime`/`Date` arms now in `temporalAsJson`.
- [ ] `JSONGemEncoder#jsonify` takes Rails' branch order and arity — a
      single-argument method dispatching on type, with `only`/`except` applied
      once in `encode` via `as_json(options)` as `encoding.rb:53-55` does.
- [ ] `temporalAsJson`, `filterHashKeys`, `isPlainObject` and `normalizeOptions`
      are gone from `json/encoding.ts` — each is an `as_json` arm and belongs in
      the core_ext file.
- [ ] With the guard restored, `encode`'s `unless options.empty?` arm comes back
      too; check that the `asJson` raises the current body relies on (e.g.
      `Type#asJson`, `value.rb:145`) still fire — that is why the guard was
      dropped, and a real `as_json` layer is what makes restoring it safe.
- [ ] `pnpm parity:api --package activesupport` shows `core_ext/object/json.rb`
      above 0/6 and `json/encoding.rb` still at 13/13.
- [ ] `packages/activesupport/src/json/encoding.test.ts`,
      `json/encoding.trails.test.ts`, and the AR `type/json`, `coders/json`,
      `token-for` suites stay green; no test renamed.
