---
title: "Stop the translations auto-vivification proxy inventing a toJSON entry"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6093
claim: "2026-08-04T21:11:10Z"
assignee: "i18n-date-parse-eu-us-gate-misses-have-digit"
blocked-by: null
closed-reason: null
---

## Context

`Simple#translations` returns a `Proxy` whose `get` trap auto-vivifies any
missing key as `{}` (added by #5988 to port Ruby's default block). Because the
trap answers _every_ property read, it also answers `toJSON` — so
`JSON.stringify(backend.translations())` invokes the trap, and the serialized
output gains a phantom entry:

```js
JSON.stringify(backend.translations());
// => {"en":{"foo":{"bar":"baz"}},"toJSON":{}}
```

`Reflect.ownKeys(store)` is `['en']` and `hasOwnProperty("toJSON")` is false,
so the key exists only through the trap. Found while probing the preload path
on #5995.

Rails has no such artifact. Ruby's default block fires on `[]` only:

```ruby
# vendor/i18n/lib/i18n/backend/simple.rb:93-95
def translations(do_init: false)
  @translations ||= Concurrent::Hash.new { |h, k| h[k] = Concurrent::Hash.new }
end
```

`Hash#to_json` / `inspect` iterate real entries, so a Ruby locale hash never
grows a `toJSON` key. Any trails caller that serializes or diffs the
translations hash — a debug dump, a test snapshot, a cache key — sees a member
Rails does not have.

## Converged shape

The trap must not invent entries for reads that are not locale lookups. Options
to weigh: exclude `Symbol` keys and the JS serialization protocol names
(`toJSON`, `then`, `inspect`, `constructor`) from vivification; or vivify only
on the paths that Ruby's `[]` covers, leaving other property reads to fall
through to the target.

Note Ruby's default block _assigns_ on read (`h[k] = ...`), so a bare read of a
missing locale does mutate the hash — that part is faithful and should stay.

## Acceptance criteria

- `JSON.stringify(backend.translations())` contains only real locale keys.
- Reading a missing locale still auto-vivifies `{}` and stores it, per
  simple.rb:93-95.
- Regression test covers both, and fails on the current behaviour.
