---
title: "Port ToJsonWithActiveSupportEncoder#to_json and retire the hand-rolled toJSON delegates"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages:
  - activesupport
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6208
claim: "2026-08-07T22:48:41Z"
assignee: "port-c-civil-to-jd-and-c-jd-to-civil-at-their-rails-names"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::ToJsonWithActiveSupportEncoder#to_json`
(`vendor/rails/activesupport/lib/active_support/core_ext/object/json.rb:34-50`)
is the hook that makes `obj.to_json` route through ActiveSupport's encoder
rather than the JSON gem's:

```ruby
def to_json(options = nil)
  if options.is_a?(::JSON::State)
    super(options)          # called from JSON.{generate,dump}
  else
    ActiveSupport::JSON.encode(self, options)
  end
end
```

It is included into `[Enumerable, Object, Array, FalseClass, Float, Hash,
Integer, NilClass, String, TrueClass]` (`json.rb:47-49`).

PR #6205 ported the `as_json` half of this file but not this module. It is one
of the six members `pnpm parity:api` attributes to
`core_ext/object/json.rb` (the file reads 1/6 after #6205), and it is why
several trails classes hand-roll a `toJSON()` that just calls `this.asJson()`
— `activemodel/src/naming.ts:414-417`, `model.ts:2278-2286`,
`actionpack/src/action-dispatch/journey/gtg/transition-table.ts:213-216` — each
a local re-derivation of the same Rails module.

## Converged shape

A `ToJsonWithActiveSupportEncoder` in
`packages/activesupport/src/core-ext/object/json.ts` carrying a
`this`-typed `toJSON(options?)` (the settled mixin idiom — see CLAUDE.md
"Module mixins"), assigned onto the classes that currently hand-roll one, so
the body lives once at the Rails name.

The `::JSON::State` arm has no JS analogue: `JSON.stringify` calls `toJSON(key)`
with a string key, never a state object, so the discriminator is a `typeof
options === "string"` check, not a class test. Establish that before writing
the guard — getting it wrong silently sends every `JSON.stringify` through the
wrong branch.

## Acceptance criteria

- [ ] `ToJsonWithActiveSupportEncoder` exists in `core-ext/object/json.ts` with
      `toJSON` bodied from `json.rb:35-43`, both arms ported.
- [ ] The hand-rolled `toJSON` delegates in `activemodel/src/naming.ts`,
      `activemodel/src/model.ts` and
      `actionpack/.../gtg/transition-table.ts` are replaced by it.
- [ ] `pnpm parity:api --package activesupport` shows
      `core_ext/object/json.rb` above 1/6 and is non-negative overall;
      `pnpm parity:api:extra` clean for every package touched.
- [ ] `json/encoding.test.ts`, activemodel serialization/serializers suites and
      the journey transition-table suite stay green; no test renamed.
