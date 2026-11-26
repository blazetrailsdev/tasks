---
title: "Burn-down story generator output files cleanly through tasks new"
status: in-progress
updated: 2026-11-26
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10813
claim: "2026-11-26T18:22:28Z"
assignee: "burn-down-stories-file-cleanly"
blocked-by: null
closed-reason: null
---

## Context

On trails#10799, `scripts/parity/bump-dry-run/generate-stories.ts` produced a story that `pnpm tasks new` could not file as written. There were two problems:

- **Interpolated test names.** Rails test names built with interpolation, such as `nokogiri test/xml/test_schema.rb` "local resource > #{...} is #{...}", are extracted with the interpolation dropped. That leaves leading or trailing spaces inside a code span, and markdownlint MD038 rejects the body. The PR worked around it by trimming the spaces by hand.
- **Lost title.** The generator writes the title in frontmatter ("Burn down nokogiri from nokogiri v1.18.3 to v1.19.7"). `tasks new --body-file` takes only the body, so the filed story `nokogiri-1-19-7-nokogiri` ended up titled with its id.

## Acceptance criteria

- [ ] The generator emits test names with no leading or trailing space inside a code span. Either it collapses the gaps left by dropped interpolation, or it renders them as `#{…}`.
- [ ] The filed story keeps the generated title. Either the generator emits a `--title` for `tasks new`, or the runbook in `vendor/README.md` step 6 says to pass one.
- [ ] `nokogiri-1-19-7-nokogiri` is retitled to the generated title.
