---
title: "Port Template::Error/SyntaxErrorInTemplate annotated_source_code and line_number"
status: ready
updated: 2026-09-03
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionView::SyntaxErrorInTemplate`
(`vendor/rails/actionview/lib/action_view/template/error.rb:256-273`) has three
members. trails ported the constructor and `message`
(`packages/actionview/src/template/error.ts`) when `Template#compile` gained its
`rescue SyntaxError` arm, but not `annotated_source_code`:

```ruby
def annotated_source_code
  @offending_code_string.split("\n").map.with_index(1) { |line, index|
    indentation = " " * 4
    "#{index}:#{indentation}#{line}"
  }
end
```

The base `Template::Error` in trails is itself still a Phase-1b stub — its
`sourceExtract` is a plain string with no extractor behind it — so the whole
annotated-source cluster (`error.rb:207-254`: `annotated_source_code`,
`line_number`, `source_extract`) is unported, and ActionPack's
`ExceptionWrapper` has nothing to render.

## Converged shape

Port `SyntaxErrorInTemplate#annotatedSourceCode` per `error.rb:267-273`, and
`Template::Error`'s `annotatedSourceCode` / `lineNumber` / `sourceExtract` per
`error.rb:207-254`, so the debug view can show the offending template lines.

## Acceptance criteria

- `SyntaxErrorInTemplate#annotatedSourceCode` returns the 1-indexed,
  4-space-indented lines of `error.rb:267-273`.
- `Template::Error#lineNumber` and `#annotatedSourceCode` match
  `error.rb:223-254`; `sourceExtract` stops being a constructor-supplied stub.
- A test renders a template with a deliberate syntax error and asserts the
  annotated output.
