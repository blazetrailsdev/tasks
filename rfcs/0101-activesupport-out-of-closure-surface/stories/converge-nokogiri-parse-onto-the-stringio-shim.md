---
title: "converge both nokogiri backends' parse off Blob onto the StringIO shim"
status: done
updated: 2026-08-15
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6551
claim: "2026-08-14T23:15:08Z"
assignee: "executor-seam-end-to-end-request-coverage"
blocked-by: null
closed-reason: null
---

## Context

Shipped in PR #6445 (`port-nokogirisax-parse-io-and-eof-arms`), the same
deviation as [[converge-parse-file-onto-a-stringio-shim]] and it should land
with that shim.

```ruby
# activesupport/lib/active_support/xml_mini/nokogirisax.rb:69-80
def parse(data)
  if !data.respond_to?(:read)
    data = StringIO.new(data || "")
  end

  if data.eof?
    {}
  else
    ...
```

`xml_mini/nokogiri.rb:19-31` has the identical two arms. trails has no
`StringIO`, so `packages/activesupport/src/xml-mini/nokogirisax.ts` and
`xml-mini/nokogiri.ts` use `Blob` as the readable stand-in: `instanceof Blob`
for `respond_to?(:read)`, `new Blob([data ?? ""])` for `StringIO.new(data ||
"")`, and `(await blob.text()).length === 0` for `eof?`. That reads the whole
input to answer `eof?`, where Ruby only peeks, and it forces `parse` to accept
`string | Blob` rather than an IO-ish reader — the widened signature is carried
through `XmlMiniBackend` and `XmlMini.parse` in `xml-mini.ts`.

## Converged shape

Once the StringIO shim from [[converge-parse-file-onto-a-stringio-shim]] exists,
take both nokogiri backends' `parse` through it: the shim's `read` predicate for
the wrap arm, and its `eof?` for the empty check, with `XmlMiniBackend.parse`
and `XmlMini.parse` typed against the shim instead of `Blob`.

## Acceptance criteria

- [ ] Both backends' `parse` branch on the shim's `eof?`, not on a full read.
- [ ] `XmlMiniBackend` / `XmlMini.parse` name the shim, not `Blob`.
- [ ] `nokogirisax-readable.trails.test.ts` covers the shim-backed arms.
