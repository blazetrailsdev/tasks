---
title: "Stop reporting a test as misplaced when its name belongs to another package's Rails file"
status: draft
updated: 2026-09-27
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
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

`misplacedLocation` (`scripts/test-compare/compare.ts:297-306`) reports a
missing Rails test as misplaced when a TS test with the same description lives
in another TS file, unless the description is shared by several Rails files
(`descShared`). The caller computes `descShared` from the current package's Rails
files only (`rubyDescToFileCount`, `compare.ts:1072-1077`), while the TS side it
searches reaches other packages' test files. So a name that one actioncontroller
Rails file and one actiondispatch Rails file both use is reported as an
actioncontroller test misplaced into the actiondispatch file:

| actioncontroller Rails test                                            | Reported in (actiondispatch TS file)   | Actually the port of                               |
| ---------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------- |
| `test_case_test.rb` "query string" (`:81`)                             | `request/query-string-parsing.test.ts` | `dispatch/request/query_string_parsing_test.rb:36` |
| `test_case_test.rb` "headers" (`:89`)                                  | `uploaded-file.test.ts`                | `dispatch/uploaded_file_test.rb:42`                |
| `test_case_test.rb` "assert generates" / "assert routing" (`:451,459`) | `routing-assertions.test.ts`           | `dispatch/routing_assertions_test.rb:77,184`       |
| `integration_test.rb` "redirect" (`:367`)                              | `inspector.test.ts`                    | `dispatch/routing/inspector_test.rb:287`           |
| `content_type_test.rb` "content type with charset" (`:139`)            | `request.test.ts`                      | `dispatch/request_test.rb:1040`                    |

(The first two Rails rows are also controller actions, which
`ruby-extractor-counts-controller-test-actions` removes.) Acting on the report
would move correct actiondispatch ports into actioncontroller files.

## Acceptance criteria

- A description is "shared" when any compared package's Rails files share it, or
  misplaced detection only searches TS files in the package's own source root
  (`PKG_SRC_DIRS`, `compare.ts:1526`) — whichever keeps other packages' true
  moves visible. A `scripts/` test pins the actionpack case.
- `pnpm parity:test --package actioncontroller` no longer reports the six rows
  above as misplaced; they are missing (or, for the phantoms, gone).
- Any other package whose misplaced count moves is listed in the PR.
