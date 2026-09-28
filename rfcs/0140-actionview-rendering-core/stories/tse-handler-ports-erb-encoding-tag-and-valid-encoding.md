---
title: "Tse#call ports ERB's ENCODING_TAG strip and valid_encoding (WrongEncodingError for invalid bytes)"
status: draft
updated: 2026-09-28
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionView::Template::Handlers::ERB#call`
(`vendor/rails/v8.0.2/actionview/lib/action_view/template/handlers/erb.rb:63-75`) owns
the encoding half of a template, because `handles_encoding?` (`:37-39`) is true and
`Template#encode!` (`template.rb:342-343`) then hands it the source untouched:

- it converts to BINARY (`source.b`) and strips an `ENCODING_TAG` magic comment (`:25`)
  (`<%# encoding: NAME %>`), keeping `$2`;
- `valid_encoding` (`:95-107`) force-encodes a dup to that encoding when one was found,
  and raises `WrongEncodingError.new(string, string.encoding)` when the bytes are invalid;
- it `force_encoding`s and `encode!`s the ERB source.

trails' `Tse#call` (`packages/actionview/src/template/handlers/tse.ts`) does none of this.
It only chomps and compiles. So:

- a `<%# encoding: ISO-8859-1 %>` tag in a `.tse` file is ignored, and the bytes are decoded as `Encoding.default_external`;
- invalid UTF-8 in a `.tse` file is decoded with U+FFFD replacement characters and never raises.

`Template#encodeBang` (trails#8232) now passes the handler a `default_external`-decoded
string. It does this because `forceEncoding` decodes where Ruby only tags. So `Tse#call`
would need the undecoded bytes, or re-derive them, to port `valid_encoding`.

Rails tests that depend on it, all unported in
`packages/actionview/src/template/template.test.ts` (`TestTSETemplate`):

- `test_encoding_can_be_specified_with_magic_comment_in_erb` (`actionview/test/template/template_test.rb:290-296`)
- `test_encoding_and_arguments_can_be_specified_with_magic_comment_in_erb` (`:298-304`)
- `test_error_when_template_isnt_valid_utf8` (`:306-315`)
- `test_lying_with_magic_comment` (`:283-288`)

## Acceptance criteria

- [ ] `Tse#call` strips the `ENCODING_TAG` magic comment and ports `valid_encoding`, raising `WrongEncodingError` for invalid bytes, as in `erb.rb:63-107`.
- [ ] The four tests above are ported into `TestTSETemplate` under their Rails names.
