---
title: "Drop the invented ArgumentError guard from Rack::Utils#build_nested_query's nil arm"
status: draft
updated: 2026-09-04
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Utils#build_nested_query`'s `when nil` arm is `escape(prefix)` and
raises nothing (`vendor/rack/lib/rack/utils.rb`, `def build_nested_query`):

```ruby
when nil
  escape(prefix)
else
  raise ArgumentError, "value must be a Hash" if prefix.nil?
  "#{escape(prefix)}=#{escape(value)}"
```

The `raise ArgumentError` guard belongs to the `else` arm ONLY. trails'
`packages/rack/src/utils.ts:126-132` copies it into the nil arm as well:

```ts
} else if (value === null || value === undefined) {
  if (prefix === undefined) throw new ArgumentError("value must be a Hash");
  return escape(prefix);
```

so `buildNestedQuery(null)` throws where Rails answers `""`. Verified against
the vendored gem:

```console
$ ruby -Ilib -e 'require "rack/utils"; p Rack::Utils.build_nested_query(nil)'
""
```

This is an invented guard in a ported body — the class CLAUDE.md names
directly ("do not ... drop a check you believe is unreachable", and its
inverse). Surfaced while porting `Rack::Test::Utils#build_nested_query`
(`vendor/rack-test/lib/rack/test/utils.rb:11`), which is a DIFFERENT method
that overrides this one; the rack-test port is not affected and this file was
only read for comparison.

Note the same file's Hash arm spells Ruby's `.delete_if(&:empty?)` as
`.filter((s) => s.length > 0)` — that one is equivalent and is not part of this
story.

## Acceptance criteria

- [ ] The nil arm of `buildNestedQuery` (`packages/rack/src/utils.ts`) is
      `escape(prefix)` with no guard, as `utils.rb`'s `when nil` is.
- [ ] The `else` arm keeps its `raise ArgumentError, "value must be a Hash" if
    prefix.nil?`, which Rails does have.
- [ ] `buildNestedQuery(null)` answers `""`, matching MRI.
- [ ] `pnpm parity:api` / `parity:test` deltas non-negative; both call gates
      green with no new baseline rows.
