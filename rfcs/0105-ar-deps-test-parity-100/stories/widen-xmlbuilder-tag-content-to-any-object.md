---
title: "Widen XmlBuilder#tag content to any object, as Builder::XmlMarkup does"
status: draft
updated: 2026-09-06
rfc: "0105-ar-deps-test-parity-100"
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

`XmlBuilder#tag` in `packages/activesupport/src/xml-mini.ts:194` (and its two
implementations at `:442` and `:485`) types `content` as `string | null`.
The Ruby it stands in for is `Builder::XmlMarkup#tag!` / its `method_missing`
front door, which takes **any** object and stringifies it — that is how Rails'
own test writes the yielded-builder case:

```ruby
# vendor/rails/activesupport/test/core_ext/array/conversions_test.rb:196-208
].to_xml(skip_instruct: true, indent: 0) do |builder|
  builder.count 2
end
assert_includes xml, %(<count>2</count>), xml
```

`2` is an Integer. Porting that case in #7578 could not write
`builder.tag("count", 2)` — it does not typecheck — so the shipped assertion
passes `"2"`, a string the Ruby never constructs. The same narrowing shows up
against `xml-mini.ts:310`'s `builder.tag(renamed, content, attributes)`, where
`content` has already been coerced upstream.

Discovered while porting `to xml with block` in #7578.

## Converged shape

Widen `content` on the `XmlBuilder` interface and both implementations to
accept an arbitrary value and stringify it at the emit site, the way
`Builder::XmlMarkup` does, so a caller can pass an Integer, a BigDecimal or
any `to_s`-able object. Then change the `to xml with block` assertion in
`packages/activesupport/src/core-ext/array/conversions.test.ts` back to
`builder.tag("count", 2)`, matching `conversions_test.rb:204` arg-for-arg.

## Acceptance criteria

- `XmlBuilder#tag` accepts a non-string `content` and emits its string form.
- `to xml with block` passes `2`, not `"2"`.
- `packages/activesupport/src/xml-mini.test.ts` and
  `core-ext/array/conversions.test.ts` pass; `pnpm parity:api:calls` /
  `:args` / `pnpm parity:test` deltas non-negative.
