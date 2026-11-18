---
title: "Landing walkthrough and code showcase read from the CI-run Quickstart"
status: draft
updated: 2026-11-18
rfc: "0000-website-refresh"
cluster: website-landing
packages: [website]
deps: [website-landing-page-rebuild, website-getting-started-guide]
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § Design 4, "The walkthrough actually runs". `scripts/quickstart/run.sh`
runs the README Quickstart in CI and diffs its output blocks (`:1-36`,
`ci.yml:1304-1316`). `website-getting-started-guide` extends that Quickstart
to the controller step and adds the build-time block extraction. The landing
placeholders from `website-landing-page-rebuild` (the editor frame, the four
"everything you need" blocks and the three getting-started cards) replace
them with real content.

## Acceptance criteria

- [ ] The hero editor frame and the model / controller / view / routes blocks show files the Quickstart generates (or its edits), read at build time through the extraction `website-getting-started-guide` added.
- [ ] The three getting-started cards are the Quickstart's `trails new`, model and controller steps, each linking the Getting Started guide.
- [ ] Editing a Quickstart block changes the landing page on the next build. A test in `packages/website/` asserts that each landing block came from a Quickstart block.
- [ ] No landing code block is hand-written.
