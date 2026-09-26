---
title: "Port test_rails_local_assigns_and_strict_locals (reserved-word strict local read via local_assigns)"
status: done
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 10
pr: trails#8157
claim: "2026-09-26T18:42:05Z"
assignee: "port-mapping-initialize-and-make-route"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/actionview/test/template/template_test.rb:264-267`:

```ruby
def test_rails_local_assigns_and_strict_locals
  @template = new_template("<%# locals: (class: ) -%>\n<%= local_assigns[:class] %>")
  assert_equal "some-class", render(class: "some-class", implicit_locals: %i[message])
end
```

It is the one strict-locals test in that block that trails has not ported.
Its four siblings (`test_rails_injected_locals_*`, `:253-278`) were ported
into `packages/actionview/src/template/template.test.ts` by trails#8139. The
test covers a strict local whose name is a reserved word, read back through
`local_assigns`. In trails, `Template#compiledSource`
(`packages/actionview/src/template.ts`) binds strict locals into
`__strictLocals` and exposes `localAssigns`. Whether a `class:` keyword
survives `methodParameters`/`kwargsCode`, and `with (__strictLocals)` when
`class` is a JS reserved word, is unverified.

## Acceptance criteria

- `it("rails local assigns and strict locals")` in `template/template.test.ts`,
  using `<%# locals: (class: ) -%>` and `<%= localAssigns["class"] %>`, renders
  `"some-class"` with `implicitLocals: ["message"]`.
- If it fails, fix `Template` (not the test) so a reserved-word strict local
  binds and is readable through `localAssigns`, as in Rails.
