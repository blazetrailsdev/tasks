---
title: "actionview-reaches-100-remainder"
status: ready
updated: 2026-11-24
rfc: "0259-near-complete-packages-to-100"
cluster: null
packages: []
deps:
  - actionview-reaches-100
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `actionview-reaches-100`, whose PR hit the LOC ceiling after porting
the sanitize, tag, image_tag and highlight tests. Paths under `vendor/rails/v8.0.5.2/`.
Still missing:

- `actionview/test/template/form_helper_test.rb`: file field with accept attribute; form for with namespace with custom label for
- `actionview/test/template/form_helper/form_with_test.rb`: form with label namespace
- `actionview/test/template/render_test.rb`: template body written to cache with expiration when expires_in set; collection caching with an expires_in set to nil does not expire; collection caching without expires_in does not overwrite the default expires_in of the cache store
- `actionview/test/template/template_test.rb`: locals with parentheses; locals can spread to multiple lines; locals can spread to multiple lines with closing parenthesis on diff line; strict locals with non ascii default values
- `actionview/test/template/text_helper_test.rb`: highlight keeps markup inside attribute values inert; simple format keeps markup inside attribute values inert. These two fail in trails: `<a title="x > y" class="<img ...>">` survives sanitize with a raw `<` in the attribute, so `highlight`'s `/<[^>]*|[^<]+/` scan (`actionview/lib/action_view/helpers/text_helper.rb`) splits inside the attribute. Local Ruby (nokogiri 1.19.4, rails-html-sanitizer 1.7.1) also serializes it unescaped, so the Rails side needs re-checking before porting or asking the operator for a ruling.
- The 7 `it.skip`s without a `PERMANENT-SKIP:` line (`pnpm parity:test -- --package actionview`), and the 2 API members from `pnpm parity:api --missing --package actionview`.

## Acceptance criteria

- [ ] `pnpm parity:test` reports 100.0 for `actionview`
- [ ] `methodsMissing` is 0 for `actionview`
- [ ] Every remaining `it.skip` sits under a `PERMANENT-SKIP:` line citing a CLAUDE.md section or operator ruling
