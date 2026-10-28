---
title: "Crass facade marks an invalid-escape \\ delim error: true, as Crass does"
status: draft
updated: 2026-10-28
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Crass's tokenizer marks a `\` that does not start a valid escape (followed by a newline) as `{node: :delim, raw: "\\", value: "\\", error: true}` (`vendor/crass/v1.0.6/lib/crass/tokenizer.rb:196-210`). Verified with the Ruby gem: `Crass::Tokenizer.tokenize("a\\\nx")[1]` is `{:node=>:delim, :pos=>1, :raw=>"\\", :error=>true, :value=>"\\"}`.

The facade `packages/html-sanitizer/src/crass/tokenizer.ts` maps @csstools' invalid-escape `Delim` through `VALUE_TOKENS` in `createToken`, so it emits the delim without `error: true`. Surfaced during trails#9409.

## Acceptance criteria

- `createToken` emits `error: true` on a `\` delim, matching `tokenizer.rb:196-210`.
- A test in `crass/tokenizer.trails.test.ts` asserts `Tokenizer.tokenize("a\\\nx")[1]` equals Crass's hash.
