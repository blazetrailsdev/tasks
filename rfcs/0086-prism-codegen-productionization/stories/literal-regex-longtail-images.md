---
title: "literal-regex-longtail-images"
status: done
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps:
  - codegen-golden-output-snapshots
deps-rfc: []
est-loc: 200
priority: 8
pr: 6112
claim: "2026-08-05T01:59:57Z"
assignee: "i18n-date-rewrite-frags-and-new-by-frags-fast-path"
blocked-by: null
closed-reason: null
---

## Context

Toward 100% node coverage. Literal/regex long tail (~8 sites):
InterpolatedSymbolNode → template literal (same fold as
InterpolatedStringNode in handlers/literals.ts);
InterpolatedRegularExpressionNode → `new RegExp(template)`; SourceFileNode/
SourceLineNode (`__FILE__`/`__LINE__`) → the Rails file path / line number
as literals; MatchWriteNode + BackReferenceReadNode/
NumberedReferenceReadNode (`=~` with captures, `$1`, `$~`) → a `rubyMatch`
runtime helper returning the match object with locals destructured.

## Acceptance criteria

- Each construct emits its decided image; census markers reach zero.
- rubyMatch helper in runtime.ts, unit-tested.
- 0 parse errors invariant holds.
