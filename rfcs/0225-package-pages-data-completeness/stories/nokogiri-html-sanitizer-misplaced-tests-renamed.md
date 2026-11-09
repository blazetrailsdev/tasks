---
title: "parity:test: rename misplaced nokogiri, loofah and crass TS test files to the conventional paths"
status: done
updated: 2026-11-09
rfc: "0225-package-pages-data-completeness"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9874
claim: "2026-11-08T17:15:22Z"
assignee: "nokogiri-html-sanitizer-misplaced-tests-renamed"
blocked-by: null
closed-reason: null
---

## Context

trails#9868 enrolled the nokogiri, loofah and crass test suites in `parity:test`. Their existing TS tests credit 0 because the filenames don't follow the convention (`test_foo.rb` → `test-foo.test.ts`), so `parity:test` reports 130 of their tests as misplaced:

- nokogiri: `packages/nokogiri/test/css/{parser,tokenizer,xpath-visitor}.test.ts` → `css/test-{parser,tokenizer,xpath-visitor}.test.ts` (vendor/nokogiri/v1.18.3/test/css/test\_\*.rb)
- loofah: `packages/html-sanitizer/test/loofah/html5/scrub.test.ts` → `html5/test-scrub-css.test.ts` (vendor/loofah/v2.24.0/test/html5/test_scrub_css.rb)
- crass: `packages/html-sanitizer/test/crass/{parse-properties,css-parsing-tests}.test.ts` → `test-parse-properties.test.ts`, `test-css-parsing-tests.test.ts` (vendor/crass/v1.0.6/test/)

Also check `xml/document.test.ts`, `sax/parser.test.ts` and `html5/document.test.ts` against `xml/test_document.rb`, `xml/sax/test_parser.rb` and `html5/test_api.rb`.

## Acceptance criteria

- [ ] The files are renamed (`git mv`) to the paths `parity:test`'s convention expects, with no test names changed.
- [ ] `pnpm parity:test` reports 0 misplaced for nokogiri, loofah and crass, and their implemented counts rise.
