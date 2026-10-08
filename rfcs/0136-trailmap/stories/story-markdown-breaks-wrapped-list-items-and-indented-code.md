---
title: "Story Markdown breaks wrapped list items and indented code blocks"
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

A story page renders two ordinary Markdown shapes wrongly. Seen on
`/story/drop-local-prefixes-override-after-trails-kebab-view-directories` in
the production-mode screenshot taken for trailmap#44 (`screenshots/pr-44`,
`story-show.png`):

1.  An indented code block (four leading spaces after a blank line) renders as
    a plain paragraph with its line breaks collapsed. The story's source has

        static localPrefixes(): string[] {
          return [this.controllerPath().replace(/_/g, "-")];
        }

    and the page shows `static localPrefixes(): string[] { return […]; }` as
    running text.

2.  A list item whose text wraps onto a continuation line indented two spaces
    is cut at the wrap: the first line stays in the `<li>` and the rest becomes
    a separate paragraph after the list. Both bullets under "The same PR changes
    two things" and every bullet under "Acceptance criteria" show it.

`pnpm gate:markdown` reports these documents EQUIVALENT to ringo's rendering,
so ringo's renderer has the same two faults and the gate is holding trailmap to
them. Story bodies are written wrapped at 80 columns and formatted by prettier
in the tasks repo, so wrapped list items are the common case, not an edge.

## Acceptance criteria

- Decide and record whether the fix is made in the shared renderer (so ringo
  and trailmap change together and the gate stays byte-equivalent) or in
  trailmap with the gate's expectation moved; the story page must end up
  correct either way.
- A list item with a two-space-indented continuation line renders as one
  `<li>` holding the whole sentence.
- A four-space-indented block after a blank line renders as `<pre><code>` with
  its line breaks kept.
- Tests cover both shapes, taken from a real story body.
