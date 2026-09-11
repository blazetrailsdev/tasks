---
title: "extractOptionsBang neither mutates nor returns what Array#extract_options! does"
status: ready
updated: 2026-09-11
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 61
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Array#extract_options!`
(`vendor/rails/activesupport/lib/active_support/core_ext/array/extract_options.rb:23-29`)
is a bang method that mutates the receiver:

```ruby
def extract_options!
  if last.is_a?(Hash) && last.extractable_options?
    pop
  else
    {}
  end
end
```

`pop` removes the trailing hash from the array in place and returns it, so a
Rails caller writes

```ruby
components = options.dup
options    = components.extract_options!   # components is now one shorter
```

(`actionview/lib/action_view/routing_url_for.rb:98-99`).

`extractOptionsBang` in `packages/activesupport/src/hash-utils.ts:98-106`
does neither half: it leaves the receiver untouched and returns a
`[rest, options]` tuple instead of the options hash.

```ts
export function extractOptionsBang<T>(args: T[]): [T[], AnyObject] {
  ...
  return [args.slice(0, -1), last as unknown as AnyObject];
}
```

Every call site therefore has to destructure and use the returned `rest`, and a
port that follows the Ruby literally — mutating `components`, then reading it —
silently gets the unshortened array. This was hit while porting
`RoutingUrlFor#url_for`'s Array arm in PR #7649.

## Converged shape

Make the bang method mutate, as Ruby's does, and return the options hash alone:
`extractOptionsBang(args)` pops the trailing extractable hash off `args` and
returns it (or `{}`). Callers that want the non-mutating form should copy first,
which is what Rails' own callers do with `dup`.

## Acceptance criteria

- `extractOptionsBang` removes the trailing extractable hash from the array it
  is given, and returns that hash rather than a tuple.
- Every call site is updated (`activesupport/src/cache.ts:23`,
  `activesupport/src/module-ext.ts`, `actionview/src/routing-url-for.ts`, and
  any others `pnpm parity:api:calls` surfaces).
- `collections.test.ts`'s `extractOptionsBang` tests assert the mutation.
