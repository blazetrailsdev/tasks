---
title: "pass the readable to nokogiri's parser instead of draining it (~80 LOC)"
status: done
updated: 2026-08-15
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6559
claim: "2026-08-15T01:45:06Z"
assignee: "burn-down-result-empty-async-call-rows"
blocked-by: null
closed-reason: null
---

## Context

`XmlMini_Nokogiri#parse` (`activesupport/lib/active_support/xml_mini/nokogiri.rb:19-31`)
and `XmlMini_NokogiriSAX#parse` (`xml_mini/nokogirisax.rb:69-80`) hand the IO
itself to the parser — `Nokogiri::XML(data)` and `parser.parse(data)` — and let
libxml stream from it:

```ruby
doc = Nokogiri::XML(data)
```

After PR #6551 (`converge-nokogiri-parse-onto-the-stringio-shim`) both trails
backends take the `StringIO` shim and branch on its `eof?` as Rails does, but
they then drain it — `packages/activesupport/src/xml-mini/nokogiri.ts` and
`xml-mini/nokogirisax.ts` call `parseXml(data.read() ?? "")` /
`parser.parse(data.read() ?? "")` — because `@blazetrails/nokogiri`'s
`parseXml` and `SAX.Parser#parse` accept only a string.

## Converged shape

Teach `@blazetrails/nokogiri`'s `parseXml` / `SAX.Parser#parse` to accept a
readable (the `StringIO` shim, i.e. anything answering `read`) alongside a
string, then pass `data` through unread from both backends, exactly as the two
Ruby bodies do.

## Acceptance criteria

- [ ] Neither backend calls `read()`; both pass `data` to the parser.
- [ ] `nokogirisax-readable.trails.test.ts` still covers the readable and `eof?`
      arms.
