---
title: "Port NokogiriSAX parse's readable-IO and eof? arms"
status: done
updated: 2026-08-13
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6445
claim: "2026-08-12T23:56:50Z"
assignee: "export-dupcoder-dump-value-and-load-value"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while hoisting `HashBuilder` to module scope in PR #6438, which took
`xml_mini/nokogirisax.rb` to 11/11 but left `parse` itself unconverged.

Rails (`vendor/rails/activesupport/lib/active_support/xml_mini/nokogirisax.rb:69-80`):

```ruby
def parse(data)
  if !data.respond_to?(:read)
    data = StringIO.new(data || "")
  end

  if data.eof?
    {}
  else
    document = document_class.new
    parser = Nokogiri::XML::SAX::Parser.new(document)
    parser.parse(data)
    document.hash
  end
end
```

trails' `parse` (`packages/activesupport/src/xml-mini/nokogirisax.ts`) accepts
only `string | null | undefined` and collapses both arms into
`if (!data) return {}`. The readable-IO arm is missing entirely, and the
truthiness test is a bare JS one where Rails tests `eof?` — so a caller passing a
stream gets a wrong answer rather than a parse, and the `data || ""` /
`StringIO` shape has no counterpart.

The same shape is worth checking in the sibling `xml-mini/nokogiri.ts` DOM
backend, whose `parse` has the same Rails signature.

## Converged shape

Port the two arms: wrap a non-readable input the way `StringIO.new(data || "")`
does, and branch on the equivalent of `eof?` rather than on JS truthiness. Take
the readable input through whatever the trails IO analogue is at the call sites
`XmlMini` actually uses; if there is no reader surface in the package yet, the
story should establish the minimum one rather than widening the signature to
`any`.

## Acceptance criteria

- [ ] `parse` handles a readable input as well as a string, mirroring
      nokogirisax.rb:70-72.
- [ ] The empty check mirrors `data.eof?`, not a bare truthiness test — an input
      that is present but empty and one that is absent both yield `{}` by the
      Rails path.
- [ ] `packages/activesupport/src/xml-mini/nokogirisax.test.ts` stays green and
      covers the added arm.
