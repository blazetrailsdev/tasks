---
title: "Format::Parameter#escape stops coercing its value"
status: draft
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Format::Parameter#escape` in
`packages/actionpack/src/action-dispatch/journey/visitors.ts:14-17` coerces
before escaping:

```ts
escape(value: unknown): string {
  return this.escaper(globalThis.String(value));
}
```

Rails (`actionpack/lib/action_dispatch/journey/visitors.rb:12-14`) passes the
value straight through:

```ruby
Parameter = Struct.new(:name, :escaper) do
  def escape(value); escaper.call value; end
end
```

The coercion is invented: Rails' escapers reach `UriEncoder#escape`
(`journey/router/utils.rb:52-60`), which calls `component.gsub` and raises
`NoMethodError` for a non-string, so a non-string parameter value fails loud
upstream in Rails and is silently stringified here. The caller is
`Format#evaluate` (`visitors.rb:38-50`, ported at `visitors.ts:45-60`), whose
`hash` is `Record<string, unknown>`; converging the coercion means typing that
hash's values honestly or letting the escaper receive what it is given.

The `@missingRailsCall call — PERMANENT` receipt on the same method is correct
and stays: Ruby's `escaper.call value` is a JS function invocation.

## Acceptance criteria

- `escape` passes its argument to the escaper unchanged, matching
  `visitors.rb:13`.
- The `@missingRailsCall` receipt is untouched.
- `pnpm parity:api:calls` / `:args` green; journey and routing suites pass.
