---
title: "port-fixture-set-render-context-binary"
status: draft
updated: 2026-09-09
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-fixture-set-file-and-test-fixtures-cases` ported
`ActiveRecord::FixtureSet::File` and `FixtureSet::RenderContext`
(`packages/activerecord/src/fixture-set/file.ts`,
`fixture-set/render-context.ts`) against
`vendor/rails/activerecord/lib/active_record/fixture_set/file.rb` and
`fixture_set/render_context.rb`.

`RenderContext.create_subclass` defines TWO methods on the anonymous subclass
(`render_context.rb:10-16`): `get_binding`, which is ported, and

```ruby
def binary(path)
  %(!!binary "#{Base64.strict_encode64(File.binread(path))}")
end
```

which is NOT, because neither half of its body has a ruby-compat counterpart:

- There is no `Base64` module in `packages/ruby-compat/src/` at all — grep for
  `strictEncode64` across `packages/*/src` returns nothing.
- `packages/ruby-compat/src/file.ts` has `File.read` (`:369`) and `File.write`
  (`:385`) but no `File.binread`.

Rails uses `binary` from a fixture `.yml` via TSE (`<%= binary "path" %>`) to
inline a blob as a YAML `!!binary` scalar. `fixture_set/file_test.rb` does not
cover it, so the gap is silent today — the method is simply absent from
`render-context.ts` and shows as a missing member on the
`fixture_set/render_context.rb` ↔ `fixture-set/render-context.ts` pair.

## Acceptance criteria

- `Base64.strictEncode64` exists in ruby-compat (mirroring
  `vendor/ruby/lib/base64.rb`'s `strict_encode64`) and is exported from its
  index.
- `File.binread` exists in `packages/ruby-compat/src/file.ts`, mirroring
  Ruby's `IO.binread`.
- `binary(path)` is defined on the subclass `RenderContext.createSubclass()`
  returns, with Rails' exact `!!binary "…"` string shape.
- A trails-only test covers rendering a `<%= binary(...) %>` fixture through
  `FixtureSet::File`, asserting the base64 round-trip.
