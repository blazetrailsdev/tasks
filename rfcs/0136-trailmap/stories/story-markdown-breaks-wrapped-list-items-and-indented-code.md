---
title: "Story Markdown renders an indented code block as a paragraph"
status: draft
updated: 2026-10-08
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
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

A story page renders an indented code block (four leading spaces after a blank
line) as a plain paragraph with its line breaks collapsed. Seen on
`/story/drop-local-prefixes-override-after-trails-kebab-view-directories` in
the production-mode screenshot taken for trailmap#44 (`screenshots/pr-44`,
`story-show.png`). The story's source has

    static localPrefixes(): string[] {
      return [this.controllerPath().replace(/_/g, "-")];
    }

and the page shows `static localPrefixes(): string[] { return […]; }` as
running text. The renderer is `renderMarkdown` (`app/helpers/markdown-helper.ts`).

`pnpm gate:markdown` reports the document EQUIVALENT to ringo's rendering, so
ringo's renderer (`webhook/markdown.go`) has the same fault and the gate holds
trailmap to it. That is the same position as
`support-lazy-continuation-in-the-markdown-renderer`, which covers the wrapped
list items visible in the same screenshot and is blocked until ringo's renderer
is retired. This story is the indented-code half and shares that block. (The
slug still names both; the list half is that other story.)

Story bodies filed with `pnpm tasks new --body-file` commonly quote code and
error output as indented blocks, so this shows on real pages.

## Acceptance criteria

- Blocked on the same condition as
  `support-lazy-continuation-in-the-markdown-renderer`: ringo's renderer is
  retired, or the fix is made in both and the gate stays byte-equivalent.
- A four-space-indented block after a blank line renders as `<pre><code>` with
  its line breaks and inner indentation kept; an indented continuation of a
  list item is not mistaken for one.
- A test covers it with a real story body.
