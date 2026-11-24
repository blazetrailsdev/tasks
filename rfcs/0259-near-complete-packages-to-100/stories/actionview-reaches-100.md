---
title: "actionview: reach 100% on parity"
status: ready
rfc: "0259-near-complete-packages-to-100"
cluster: rails-core
packages: [actionview]
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Measured 2026-11-24 at trails `4330f807e1`: `actionview` is 41 tests short of
100%. 7 of those are skips without a `PERMANENT-SKIP:` line (list them with
`pnpm parity:test -- --package actionview` and grep the TS files for
`it.skip`). The rest are missing. Paths are under `vendor/rails/v8.0.5.2/`:

- `actionview/test/template/form_helper_test.rb` (actionview):
  - file field with accept attribute
  - form for with namespace with custom label for
- `actionview/test/template/form_helper/form_with_test.rb` (actionview):
  - form with label namespace
- `actionview/test/template/render_test.rb` (actionview):
  - template body written to cache with expiration when expires_in set
  - collection caching with an expires_in set to nil does not expire
  - collection caching without expires_in does not overwrite the default expires_in of the cache store
- `actionview/test/template/asset_tag_helper_test.rb` (actionview):
  - image tag with whitespace attribute name generates valid markup
- `actionview/test/template/tag_helper_test.rb` (actionview):
  - tag options rejects blank key
  - tag options rejects blank data key
  - tag options rejects blank aria key
  - tag with blank attribute name generates valid markup
  - tag with whitespace symbol attribute name generates valid markup
  - tag with whitespace symbol data attribute name is skipped
  - tag with whitespace symbol aria attribute name is skipped
  - tag with attribute name that is blank before conversion is skipped
  - tag with attribute name that changes when converted generates valid markup
- `actionview/test/template/text_helper_test.rb` (actionview):
  - highlight escapes quotes in the highlighted phrase
  - highlight does not escape the highlighted phrase twice
  - highlight with regexp groups in highlighter
  - highlight with html safe highlighter
  - highlight does not replace the end of a tag
  - highlight preserves regexp boundaries after a tag
  - highlight keeps markup inside attribute values inert
  - simple format keeps markup inside attribute values inert
- `actionview/test/template/template_test.rb` (actionview):
  - locals with parentheses
  - locals can spread to multiple lines
  - locals can spread to multiple lines with closing parenthesis on diff line
  - strict locals with non ascii default values
- `actionview/test/template/sanitize_helper_test.rb` (actionview):
  - strip tags returns nil for nil
  - strip tags encodes ampersand
  - strip tags encodes less than
  - strip tags encodes greater than
  - strip tags encodes double quote
  - strip tags encodes single quote

API: 2 members short of 100% on trailmap. List them with `pnpm parity:api --missing --package actionview`.

Apply the triage rule in this RFC's README (§ "Triage rule"). Every item ends
ported, permanent with a citation, listed for an operator ruling, or filed as a
blocking story. Before calling an item permanent, try to disprove its
receipt.

## Acceptance criteria

- [ ] `pnpm parity:test` reports 100.0 for `actionview`.
- [ ] `methodsMissing` is 0 for `actionview` in `package-summary.json` (`pnpm parity:packages`).
- [ ] Every remaining `it.skip` in the package sits under a `PERMANENT-SKIP:`
      line citing a CLAUDE.md section or a dated operator ruling.
- [ ] Items needing a ruling are listed in the PR body with their Rails
      `file:line`, and are not receipted until the operator rules.
- [ ] Work past the LOC ceiling is filed as new stories in this RFC, each
      with a `deps` edge from this one.

## Verification

```sh
pnpm parity:test -- --package actionview
pnpm parity:api --missing --package actionview
pnpm parity:packages
```
