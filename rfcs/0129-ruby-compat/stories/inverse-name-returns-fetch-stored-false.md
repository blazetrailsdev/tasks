---
title: "inverse-name-returns-fetch-stored-false"
status: in-progress
updated: 2026-09-03
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 7435
claim: "2026-09-03T10:51:58Z"
assignee: "port-encryption-properties-encoding-accessor"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record/reflection.rb:749-754`:

```ruby
def inverse_name
  unless defined?(@inverse_name)
    @inverse_name = options.fetch(:inverse_of) { automatic_inverse_of }
  end

  @inverse_name
end
```

`Hash#fetch` returns the STORED value, so `inverse_of: false` makes
`inverse_name` return `false` — Rails never translates it. trails'
`packages/activerecord/src/reflection.ts` `inverseName` types itself
`string | null` and maps that `false` to `null`:

```ts
this._inverseNameCache = inverseOf === false ? null : inverseOf;
```

Flagged by review of #7403, which converged the surrounding body onto
ruby-compat's `fetch` (so the presence test is now Ruby's `Object.hasOwn`
semantics rather than an `undefined` check) but deliberately did NOT touch the
`false → null` translation — that is a return-type change with its own
call-site blast radius, and #7403 was a three-story bundle already at its LOC
ceiling.

Note this is a value-returning predicate ported as a narrowed type, which
CLAUDE.md lists as a standing Ruby-idiom trap: "a value-returning predicate
ported as a `boolean` breaks every call site that used the value."

## Converged shape

`inverseName()` returns what `fetch` gives — `string | false | null` — and the
callers that consume it do the discriminating Rails does. `inverseOf`
(`reflection.ts:747-751`) already guards with `if (!name) return null;`, which
is Ruby's own `if inverse_name` truthiness and needs no change; the audit is of
every OTHER reader of `inverseName`.

## Acceptance criteria

- [ ] `inverseName()`'s return type and body match `reflection.rb:749-754` —
      the stored value, `false` included, with no translation.
- [ ] Every call site is audited; those that relied on `null` standing in for
      `false` handle both, using Ruby-truthiness (`x != null && x !== false`),
      not a bare falsy test.
- [ ] The `ThroughReflection#inverseName` delegation (`reflection.rb:1215`)
      forwards the same value.
- [ ] A test pins `inverse_of: false` returning `false` from `inverseName` while
      `inverseOf` still answers `null`.
- [ ] `pnpm parity:api` arity/params unchanged; `parity:api:calls` no new rows.
