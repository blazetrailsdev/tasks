---
title: "actiontext: credit rich_textarea / rich_text_area at tag_helper.rb"
status: ready
updated: 2026-11-21
rfc: "0255-last-mile-parity"
cluster: small-packages
packages: [actiontext]
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

`parity:api` lists `rich_textarea` and `rich_text_area`
(`vendor/rails/v8.0.2/actiontext/app/helpers/action_text/tag_helper.rb`) as
missing. ActionText's reopen of `FormHelper` / `FormBuilder` writes through to
the recorded includers (CLAUDE.md, the 2026-11-17 widening), so the methods
exist but are not where the extractor looks.

## Acceptance criteria

- [ ] Both methods are credited at `tag_helper.rb` on `parity:api`.
- [ ] actiontext shows 0 API missing; the pattern-matching test stays PERMANENT.

## Verification

```sh
pnpm parity:api --missing --package actiontext  # 0 rows
```
