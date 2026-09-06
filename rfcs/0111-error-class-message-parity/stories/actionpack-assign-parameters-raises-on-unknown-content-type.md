---
title: "actionpack-assign-parameters-raises-on-unknown-content-type"
status: ready
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Mime::Type#symbol` is now `nil` for the throwaway type `Mime::Type.lookup`
fabricates for an unregistered content type (`mime_type.rb:167-173` —
`LOOKUP[string] || Type.new(string)`, and `Type#initialize(string, symbol = nil,
synonyms = [])` at `mime_type.rb:264`). That convergence landed with the
`generated-app-cannot-render-its-own-views` fix, because `Request#formats`'
`select! { |format| format.symbol || format.ref == "*/*" }`
(`mime_negotiation.rb`) has to drop an unregistered `Accept` type before
`LookupContext#formats=` rejects it.

It surfaced one trails-only behaviour that Rails does not have.
`TestRequest#assign_parameters` (`action_controller/test_case.rb:119-131`) is:

```ruby
case content_mime_type&.to_sym
when nil
  raise "Unknown Content-Type: #{content_type}"
...
else
  @custom_param_parsers[content_mime_type.symbol] = ->(_) { non_path_parameters }
```

so Rails RAISES for an unregistered content type and only reaches the
custom-parser `else` for a registered-but-unhandled one (`:text`, say). trails
instead registers a parser keyed by the content-type string, and
`packages/actionpack/src/action-controller/test-case.test.ts` asserts that in
"assignParameters registers custom parser for unknown content types, wired into
requestParameters".

To keep that behaviour reachable with a nil symbol,
`packages/actionpack/src/action-dispatch/http/parameters.ts`
(`parseFormattedParameters`) indexes with
`this.contentMimeType.symbol ?? this.contentMimeType.toString()` where Rails
indexes with `content_mime_type.symbol` alone. That `toString()` arm carries a
`@missingRailsArgs ... CONVERGEABLE <this story>` receipt.

## Acceptance criteria

- `parseFormattedParameters` indexes `parsers` with `contentMimeType.symbol`
  only, and the `@missingRailsArgs` receipt in `parameters.ts` is deleted.
- `TestRequest#assignParameters` raises `Unknown Content-Type: <content_type>`
  when `contentMimeType?.toSym()` is nil, mirroring
  `test_case.rb:119-121`, and keys `_customParamParsers` by
  `contentMimeType.symbol`.
- The trails-invented "unknown content types" expectation in
  `test-case.test.ts` is replaced by the Rails behaviour (or moved to a
  `.trails.test.ts` if some trails caller genuinely depends on it).
