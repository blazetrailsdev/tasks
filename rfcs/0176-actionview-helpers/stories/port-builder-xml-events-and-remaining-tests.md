---
title: "port-builder-xml-events-and-remaining-tests"
status: draft
updated: 2026-10-22
rfc: "0176-actionview-helpers"
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

# Port Builder::XmlEvents and the remaining builder gem tests

## Context

`port-builder-gem-xml-markup` landed `packages/builder` with `XChar`
(`vendor/builder/v3.3.0/lib/builder/xchar.rb`), `XmlBase`
(`lib/builder/xmlbase.rb`) and `XmlMarkup` (`lib/builder/xmlmarkup.rb`), and
mirrored `test/test_markupbuilder.rb`'s `TestMarkup` (`:18-211`) in
`packages/builder/src/markupbuilder.test.ts`; the 800-LOC ceiling left the
rest of that file. Still unported:

- `TestAttributeEscaping`, `TestNameSpaces`, `TestDeclarations`,
  `TestSpecialMarkup`, `TestIndentedXmlMarkup` and its nested `TestUtfMarkup`
  (`test_markupbuilder.rb:213-546`). They passed locally when written: Ruby
  Symbols are `":name"` strings, a block is `block(...)` from ruby-compat,
  and `"\xE2\x80\x99"` is `"\u2019"`.

- `Builder::XmlEvents` (`lib/builder/xmlevents.rb:1-64`), the `XmlMarkup`
  subclass that sends `start_tag` / `end_tag` / `text` to a handler.
- `test/test_eventbuilder.rb`, `test/test_method_caching.rb`,
  `test/test_namecollision.rb` and `test/test_xchar.rb`, and
  `TestXmlEvents` in `test_markupbuilder.rb`.
- `XmlBase#_escape`'s `raise Exception if encoding.dummy?`
  (`lib/builder/xmlbase.rb:138`): ruby-compat's `Encoding` has no `dummy?`,
  so `packages/builder/src/xmlbase.ts` relies on `encode` raising
  `ConverterNotFoundError` for `UTF-16`. Add `Encoding#isDummy` and call it.

## Acceptance criteria

- `packages/builder/src/xmlevents.ts` ports `XmlEvents` method for method.
- The rest of `test_markupbuilder.rb`, the four test files and `TestXmlEvents` are mirrored with Ruby test names.
- `_escape` calls `encoding.isDummy` as `xmlbase.rb:138` does.
