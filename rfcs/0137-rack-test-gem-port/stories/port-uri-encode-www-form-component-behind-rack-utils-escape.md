---
title: "Port URI.encode_www_form_component and make Rack::Utils.escape the one-line delegation"
status: done
updated: 2026-09-06
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 25
pr: 7553
claim: "2026-09-06T13:05:18Z"
assignee: "converge-rack-conditional-get-to-rfc2822-guard"
blocked-by: null
closed-reason: null
---

## Context

`Rack::Utils.escape` (`vendor/rack/lib/rack/utils.rb:40-42`) is a one-line
delegation:

```ruby
def escape(s)
  URI.encode_www_form_component(s)
end
```

`packages/rack/src/utils.ts:84-87` inlines an approximation instead:

```ts
export function escape(s: string | { toString(): string } | null | undefined): string {
  if (s == null) return "";
  return encodeURIComponent(String(s)).replace(/%20/g, "+");
}
```

Two deviations. The delegation itself is gone — `escape` makes no
`encode_www_form_component` call, so the ported body omits the only call Rails'
makes. And the `s == null` arm is a hand-rolled stand-in for
`encode_www_form_component`'s own `nil` handling (`nil.to_s` is `""`, verified:
`ruby -Ilib -e 'require "rack/utils"; p Rack::Utils.escape(nil)'` prints `""`).
That arm was added in #7529 by
`converge-rack-utils-build-nested-query-nil-guard`, because `build_nested_query`'s
`when nil` arm is `escape(prefix)` (`utils.rb:130-131`) and reaches it with a nil
prefix.

trails already has an `RFC2396_PARSER` seat in the same file (used by
`escape_path`, `utils.ts:90-92`), so the URI side is partly present;
`encode_www_form_component` is what is missing.

## Converged shape

Port `URI.encode_www_form_component` into the `ruby-compat` URI surface beside
the RFC2396 parser, and make `escape` the one-line delegation Rails has. The
`nil` handling and the `+`-for-space encoding both move into that function, where
Ruby puts them, and `escape`'s signature narrows back to what Rack declares.

## Acceptance criteria

- [ ] `escape` is `encodeWwwFormComponent(s)` and nothing else, mirroring
      `utils.rb:41`.
- [ ] `encodeWwwFormComponent` handles `nil` as MRI does (`""`), so
      `buildNestedQuery(null)` still answers `""` and the
      `converge-rack-utils-build-nested-query-nil-guard` behaviour is preserved.
- [ ] The `%20` → `+` substitution lives in the new function, not at the
      `escape` call site.
- [ ] `packages/rack/src/utils.test.ts` and `packages/rack-test` stay green with
      no test name reworded.
- [ ] `pnpm parity:api` deltas non-negative; both call gates green — this should
      REMOVE a call-set row rather than add one.
