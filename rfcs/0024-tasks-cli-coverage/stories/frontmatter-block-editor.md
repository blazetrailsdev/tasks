---
title: "Array-safe, comment-preserving frontmatter setter"
status: ready
updated: 2026-06-12
rfc: "0024-tasks-cli-coverage"
cluster: frontmatter-editor
deps: []
deps-rfc: []
est-loc: 130
priority: 15
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`editFrontmatter()` in `trails/scripts/tasks/cli.ts` only edits single-line
scalar keys; it explicitly refuses any key whose next line is indented (a YAML
list or nested map), to avoid orphaning children. That is why no command can set
`deps`, `deps-rfc`, `clusters`, `packages`, `related-rfcs`, or `superseded-by`.

This story adds the keystone primitive the rest of the RFC builds on: a
block-aware setter that can replace a key's **scalar value or its entire array
block** while leaving the rest of the file — crucially the template's inline
comments (e.g. `priority: null # LOWER = higher…`) — byte-for-byte unchanged.

A `js-yaml` round-trip is explicitly out of scope: it reflows the document and
strips comments. The implementation must be a targeted block replacement.

## Acceptance criteria

- [ ] New helper (e.g. `setFrontmatterList(file, key, items)`) replaces an
      existing key's value whether it is inline flow (`[a, b]`) or an indented
      block list, and inserts the key in canonical position if absent.
- [ ] Non-target lines (other keys, inline comments, blank lines, body) are
      preserved exactly — verified by a round-trip test on `0000-template`.
- [ ] Rejects nested/multi-level structures deeper than a simple list (consistent
      with the current defensive posture), with a clear error.
- [ ] Existing scalar `editFrontmatter()` behavior is unchanged; both share
      parsing where sensible.
- [ ] Unit tests cover: inline→block, block→inline, empty list, absent key,
      comment preservation.

## Notes

This is the only story with no dependencies and the prerequisite for
[[cli-rfc-edit]] and [[cli-set-deps]]. Source anchor: the scalar-only editor and
its indented-line refusal in `cli.ts` (`editFrontmatter`).
