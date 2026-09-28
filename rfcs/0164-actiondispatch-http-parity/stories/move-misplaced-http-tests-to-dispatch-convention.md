---
title: "Move the misplaced HTTP tests to their dispatch/ convention paths and port the stragglers"
status: draft
updated: 2026-09-27
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --package actiondispatch` reports 36 tests matched by name
but in the wrong file. Each Rails file's convention path is under `dispatch/`;
trails keeps them beside the source:

| Current TS file (`packages/actionpack/src/action-dispatch/`) | Convention path                                 | Tests |
| ------------------------------------------------------------ | ----------------------------------------------- | ----- |
| `request/query-string-parsing.test.ts`                       | `dispatch/request/query-string-parsing.test.ts` | 16    |
| `http/query-parser.test.ts`                                  | `dispatch/query-parser.test.ts`                 | 8     |
| `http/content-disposition.test.ts`                           | `dispatch/content-disposition.test.ts`          | 5     |
| `http/param-builder.test.ts`                                 | `dispatch/param-builder.test.ts`                | 4     |
| `http/content-security-policy.test.ts`                       | `dispatch/content-security-policy.test.ts`      | 3     |

Four Rails tests in those files are missing outright, all under
`vendor/rails/v8.0.2/actionpack/test/dispatch/`:
`request/query_string_parsing_test.rb` ("ambiguous query string returns a bad
request"), `query_parser_test.rb` ("(rack 2) defaults to mixed separators") and
`param_builder_test.rb` ("simple query string", "(rack 2) defaults to ignoring
leading bracket"). The two "(rack 2)" tests sit inside
`if ::Rack::RELEASE.start_with?("2.")` (`param_builder_test.rb:24`,
`query_parser_test.rb:26`), and trails vendors Rack 3.1.14, so under trails'
Rack neither test exists. They should drop out of the denominator as
feature-gated, not be ported; if the extractor does not honour that gate, that
is a gates-RFC extractor bug to file, not a test to write.

## Acceptance criteria

- Whole files move with `git mv` so the diff is a rename; the three CSP tests
  merge into `dispatch/content-security-policy.test.ts`.
- The two ungated missing tests are ported; the two Rack-2 tests are either
  gated out by the extractor or filed against RFC 0167 (gates).
- `pnpm parity:test --package actiondispatch` reports 0 misplaced for these
  five Rails files.
