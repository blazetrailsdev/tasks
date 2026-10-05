---
title: "Thor convert_encoded_instructions: %file_name% does not resolve against a camelCase trails method"
status: draft
updated: 2026-10-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Thor::Actions::EmptyDirectory#convert_encoded_instructions`
(`vendor/thor/v1.3.2/lib/thor/actions/empty_directory.rb:103-108`) turns `%file_name%` in a
destination into `base.send("file_name")`. The port
(`packages/trailties/src/thor/actions/empty-directory.ts`, `convertEncodedInstructions`, landed in
trails#8514) sends the name exactly as written: `rbObjRespondTo(this.base, method, true)` then
`rbFSend(this.base, method)`. A trails method is camelCase (`fileName`), so a template path
copied from Rails as `%file_name%.rb` answers `respond_to?` false and is left unconverted, where
Thor would have substituted it. Today a trails template has to spell it `%fileName%`.

`Thor::Actions#directory` (`vendor/thor/v1.3.2/lib/thor/actions/directory.rb`) is the main caller,
over on-disk template trees whose file names come from railties.

## Acceptance criteria

- [ ] Decide where the Ruby name → trails name translation lives (in `rbFSend` /
      `rbObjRespondTo` for a snake_case `mid`, or in the template file names), and converge on
      one spelling so a railties template path needs no renaming to resolve.
- [ ] `%file_name%.rb` resolves against a base defining `fileName`, with a test beside
      `thor/actions/create-file.trails.test.ts`.
- [ ] An unknown `%name%` is still left as it is (`empty_directory.rb:106`).
