---
title: "tse-compiler: mirror erubi's files so parity:api and parity:test credit erubi"
status: in-progress
updated: 2026-11-08
rfc: "0225-package-pages-data-completeness"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#9874
claim: "2026-11-08T17:15:22Z"
assignee: "nokogiri-html-sanitizer-misplaced-tests-renamed"
blocked-by: null
closed-reason: null
---

## Context

trails#9864 enrolled erubi 1.13.1 (`vendor/erubi/1.13.1/`) as tse-compiler's counterpart. `pnpm parity:api` reports `erubi — 0/23 methods (0%) | files: 0/3`: erubi's files are `lib/erubi.rb` (`Erubi::Engine#initialize`, `#add_text`, `#add_code`, `#add_expression`, `#add_postamble`, `#flush_newline_if_pending`, `Erubi.h`), `lib/erubi/capture_block.rb` and `lib/erubi/capture_end.rb`, while `packages/tse-compiler/lib/` is `lexer.ts`, `parser.ts`, `emit-js.ts`, `parse-locals.ts`, `parse-filename.ts`, `source-map.ts`. No file pairs, so no method can credit. `parity:test` pairs erubi's single `test/test.rb` (39 tests) against nothing by file.

## Acceptance criteria

- [ ] Converge tse-compiler toward erubi's layout: an `erubi.ts` (Engine, `h`) carrying erubi's methods at their Rails names, with `capture-block.ts` / `capture-end.ts` where ported; or, if a file genuinely cannot mirror, a `RUBY_FILE_TS_OVERRIDES` row in `scripts/parity/conventions.ts` naming the TS file that ports it.
- [ ] `pnpm parity:api` reports erubi files > 0/3 and methods > 0.
- [ ] erubi's `test/test.rb` cases pair with a TS test file (`erubi.test.ts` or an override) and port by verbatim name.
