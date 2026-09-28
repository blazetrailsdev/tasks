---
title: "Port actionpack's view, helper and multipart test fixtures"
status: ready
updated: 2026-09-28
rfc: "0160-actionpack-test-harness-parity"
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

`FIXTURE_LOAD_PATH` (`vendor/rails/v8.0.2/actionpack/test/abstract_unit.rb:67`)
points at `test/fixtures/`, 141 files. Rails' controller tests read templates,
layouts and helper modules from it: `helper_test.rb` loads `fixtures/helpers`,
`helpers1_pack`, `helpers2_pack`, `helpers_typo` and `alternate_helpers`;
`localized_templates_test.rb` reads `fixtures/localized`; `caching_test.rb` reads
`fixtures/functional_caching` and `collection_cache`; `respond_to_test.rb` reads
`fixtures/respond_to`; `render_test.rb` and the `new_base` tests read `layouts/`,
`test/`, `post_test/`, `customers/`, `implicit_render_test/`, `namespaced/`,
`star_star_mime/` and `old_content_type/`.

trails has none of them. Today `mime/respond-to.test.ts` and four
`*.trails.test.ts` files build a `FixtureResolver` inline instead.

`fixtures/multipart/` has two consumers in two RFCs: `test_case_test.rb`
(`self.file_fixture_path = …/fixtures/multipart`, `:13`, read by
`fixture_file_upload` at `:940-948`) and the multipart params-parsing tests in
RFC 0164 (HTTP). It lands here once so neither RFC owns half of it.

Sizes as text: the view and helper groups are about 150 lines; `multipart/` is
about 90 lines of text plus three binaries (`binary_file`, `mixed_files`,
`ruby_on_rails.jpg`), which a diff counts as `Bin`. `fixtures/public/` and
`fixtures/公共/` (826 lines) are not part of this story: their only consumer is
`dispatch/static_test.rb`, owned by RFC 0165 (middleware).

## Acceptance criteria

- `packages/actionpack/src/test-helpers/fixtures/` mirrors every view and helper
  fixture above, file for file, with `.erb` spelled `.tse`
  (`docs/ruby-ts-conventions.md`) and helper `.rb` modules ported as `.ts`
  modules at the Rails module names.
- The harness exports `FIXTURE_LOAD_PATH` pointing at that directory.
- `fixtures/multipart/` is copied byte for byte, binaries included.
- A test renders one layout and one helper fixture through it, and one test
  reads a multipart fixture.
