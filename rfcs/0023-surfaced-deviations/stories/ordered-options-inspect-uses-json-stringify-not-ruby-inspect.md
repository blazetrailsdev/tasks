---
title: "OrderedOptions#to_s renders values with JSON.stringify, not Ruby #inspect"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "merged into retire-remaining-ruby-inspect-copies-onto-the-activesupport-port — this is one of the private partial Object#inspect copies that story retires onto core-ext/object/inspect.ts; retiring the copy IS the fix"
---

## Context

Surfaced porting `ordered_options_test.rb` in #6692.

`OrderedOptions#toString` and `InheritableOptions#toString`
(`packages/activesupport/src/ordered-options.ts`) render each value with
`JSON.stringify`, not Ruby's `#inspect`:

```ts
const pairs = [...this.data.entries()].map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
return `{${pairs.join(", ")}}`;
```

Rails reaches Ruby's own `Hash#inspect` — `OrderedOptions` does not override
`to_s` at all (it inherits it), and `InheritableOptions#to_s` is `to_h.to_s`
(activesupport/lib/active_support/ordered_options.rb:111-117). `inspect` on both
wraps that rendering (ordered_options.rb:68-70, 108-110).

`JSON.stringify` and `#inspect` agree only for Strings. They diverge for:

- **Symbols** — a Ruby Symbol is a JS string carrying its colon (CLAUDE.md), so
  `:bar` is `":bar"` and renders as `":bar"` (quoted) instead of Ruby's `:bar`.
- **nil** — `null` instead of `nil`.
- **nested Hashes/Arrays** — `{"a":1}` instead of `{:a=>1}`.

This is what forced #6692's test to assert the quoted form:

```ts
const hash = `{foo: ":bar", baz: ":quz"}`;
expect(a.inspect()).toBe(`#<ActiveSupport::OrderedOptions ${hash}>`);
```

against Rails' `assert_equal "#<ActiveSupport::OrderedOptions #{{ foo: :bar, baz: :quz }}>", a.inspect`
(activesupport/test/ordered_options_test.rb:138-146). The assertion-value gate
skips that pair only because the Rails side is interpolated; the rendering is
still wrong.

## Converged shape

Render values through the `Object#inspect` trails already has —
`inspect` in `packages/activesupport/src/core-ext/object/inspect.ts:43`, which
handles the Symbol-as-colon-string case (`SYMBOL_RE`, :29-31), `nil`, nested
Arrays and Hashes, and is verified against MRI 3.3. Same package, no new import
edge.

One open question to settle first, because it changes the expected strings:
`inspect.ts` renders a Hash 3.3-style (`{:foo=>:bar}`), while the vendored Rails
tests interpolate a literal that renders 3.4-style (`{foo: :bar}`) — and
`ordered-options.ts` currently emits a third spelling (`{foo: ":bar"}`, bare key

- JSON value). Pick the one the vendored Ruby produces (check
  `vendor/rails/.ruby-version` / run `ruby -e 'p({foo: :bar}.inspect)'`) and make
  `inspect.ts` and `ordered-options.ts` agree.

Then tighten #6692's two `ordered-options.test.ts` sites (the `const hash` /
`const one` / `const all` locals in "ordered option inspect", "inheritable
option inspect", "ordered options to s", "inheritable options to s" and the two
`pp` tests) to the Ruby rendering.

Sibling call sites of the same class, already filed:
`check-constraint-raise-message-uses-json-stringify-not-ruby-hash-inspect`,
`batches-order-inspect-hand-rolls-symbol-rendering`.
