---
title: "Add NOTICE to globalid and pack it"
status: in-progress
updated: 2026-11-23
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: trails#10638
claim: "2026-11-23T13:42:29Z"
assignee: "globalid-notice-file"
blocked-by: null
closed-reason: null
---

## Context

`packages/globalid` ships no LICENSE or NOTICE file. Its siblings `date`,
`did-you-mean` and `i18n` each carry a NOTICE naming the upstream gem and its
license, and pack it via `files` (trails#10626). The upstream globalid gem is
MIT (`vendor/globalid/*/MIT-LICENSE`), so the packed tarball currently carries
no attribution for the ported code.

## Acceptance criteria

1. Add `packages/globalid/NOTICE` in the sibling format, naming
   `https://github.com/rails/globalid` and its MIT license.
2. Add `"NOTICE"` to `packages/globalid/package.json` `files`.
3. `npm pack --dry-run` lists `NOTICE`.
