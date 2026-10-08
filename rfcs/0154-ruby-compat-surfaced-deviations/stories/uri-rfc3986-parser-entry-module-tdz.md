---
title: "ruby-compat: uri/rfc3986-parser.js throws a TDZ ReferenceError as an entry module"
status: draft
updated: 2026-10-08
rfc: "0154-ruby-compat-surfaced-deviations"
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

A plain-node import of the built
`packages/ruby-compat/dist/uri/rfc3986-parser.js` as the entry module throws
`ReferenceError: Cannot access 'RFC3986Parser' before initialization`. Seen on
main while verifying trails#8674 (it reproduces from the main checkout's own
`dist`, so it predates that PR).

`packages/ruby-compat/src/uri/rfc3986-parser.ts` imports `URI` and
`InvalidURIError` from `./common.js` and `Generic` from `./generic.js`;
`uri/common.ts` holds `RFC3986_PARSER` (`vendor/ruby/v3.3.11/lib/uri/common.rb`,
`RFC3986_PARSER = RFC3986_Parser.new`) and so imports the parser back. Entering
at the parser evaluates `common.ts` first, with the class still in TDZ.

A vitest run enters through the package index and masks it.

## Acceptance criteria

- `node -e 'import("./packages/ruby-compat/dist/uri/rfc3986-parser.js")'`
  resolves, and so do `uri/common.js` and `uri/generic.js` as entry modules.
- The fix follows CLAUDE.md § "Call-time constant resolution": a plain import
  where no cycle closes, else the constant read at call time. No guard around
  the read.
- `packages/ruby-compat/src/uri*.test.ts` green.
