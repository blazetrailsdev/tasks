---
title: "vendor erubi 1.13.1 as tse-compiler's counterpart and enroll it in parity:api and parity:test"
status: draft
updated: 2026-11-07
rfc: "0000-package-pages-data-completeness"
cluster: pairing
packages: ["tse-compiler", "scripts"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

tse-compiler is trails' ERB compiler (ERB is spelled TSE per
`docs/ruby-ts-conventions.md`). Rails' ERB handler compiles through erubi:
`actionview/lib/action_view/template/handlers/erb/erubi.rb` subclasses
`::Erubi::Engine`, and `vendor/rails/v8.0.2/Gemfile.lock:201` locks
`erubi (1.13.1)`. erubi is not in `vendor/sources.ts`, so `railsCounterpartOf`
returns null and `/packages/tse-compiler` reads "trails-only".
`scripts/parity/package-summary.test.ts:259` pins tse-compiler in the
no-counterpart list. The TS side is `packages/tse-compiler/lib/` (`lexer`,
`parser`, `emit-js`, `parse-locals`, `parse-filename`, `source-map`) and five
tests. erubi's surface is `lib/erubi.rb` (`Erubi::Engine`, `h`) plus
`lib/erubi/capture_block.rb` and `lib/erubi/capture_end.rb`, and its tests are
in `test/`.

## Acceptance criteria

- [ ] erubi v1.13.1 is in `vendor/sources.ts` with `portedBy: "tse-compiler"`,
      fetched by `pnpm vendor:fetch`, and `sources.lock.json` is updated.
- [ ] api and tests are both enrolled. If tse-compiler's files do not mirror
      erubi's, map them with `RUBY_FILE_TS_OVERRIDES` or record unported files.
      Do not rename or restructure the package here. A low percentage is
      expected.
- [ ] `package-summary.test.ts` drops `tse-compiler` from the no-counterpart
      list, and `railsCounterpartOf("tse-compiler")` returns `"erubi"`.
