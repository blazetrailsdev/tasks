---
title: "MatchData#[] drops its invented range and zero guards"
status: draft
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`MatchData#at` in
`packages/actionpack/src/action-dispatch/journey/path/pattern.ts:143-148` carries
two guards Rails does not have:

```ts
at(x: number): string | undefined {
  if (x === 0) return this._match[0];
  if (x < 0 || x >= this.length) return undefined;
  const idx = this._offsets[x - 1] + x;
  return this._match[idx];
}
```

Rails' `MatchData#[]`
(`actionpack/lib/action_dispatch/journey/path/pattern.rb:141-144`) is the whole
body:

```ruby
def [](x)
  idx = @offsets[x - 1] + x
  @match[idx]
end
```

An out-of-range `x` raises `NoMethodError` on `nil` in Ruby; trails returns
`undefined`, so a caller that would have blown up in Rails silently reads a
missing capture. The `x === 0` special case has no Rails counterpart either —
`@offsets[-1]` is Ruby's last element, which is a different value, not
`@match[0]`.

Read `captures` (`pattern.rb:133-135`) and `named_captures`
(`pattern.rb:137-139`) before changing the guards: both index from 1, so the
`x === 0` arm exists only for callers outside the Rails population — find them
(`git grep '\.at('` under `journey/`) and converge or justify each.

## Acceptance criteria

- `at` is Rails' three-line body, or each surviving guard carries a call-site
  receipt in one of the two sanctioned shapes.
- Any caller relying on the removed arms is converged to Rails' own indexing.
- `pnpm parity:api:calls` / `:args` green with no new baseline row.
