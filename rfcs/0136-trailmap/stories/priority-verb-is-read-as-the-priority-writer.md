---
title: "trailmap: Story#setPriority is taken for the priority= writer on the next trails pin"
status: done
updated: 2026-10-05
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trailmap#34
claim: "2026-10-05T15:34:44Z"
assignee: "priority-verb-is-read-as-the-priority-writer"
blocked-by: null
closed-reason: null
---

## Context

Found re-vendoring trailmap to trails `5ee5760880`. Since trails#8455 the writer `priority=` is
answered by a `setPriority` method when one exists (`packages/ruby-compat/src/object.ts`,
`writerSpelling`). `Story#setPriority` in `app/models/story.ts` is the `priority` verb: it updates
the row and records an event. On the new pin every `new Story({ priority })`, `create` and `update`
therefore runs the verb, which updates, which assigns, which runs it again. Under vitest that is an
out-of-memory crash in nine test files, not a failure.

It is harmless at the current pin (`9e17ddc98d`) and blocks the next bump.

## Acceptance criteria

- [ ] The verb is not named `set<Attribute>`; the HTTP route and its output are unchanged.
- [ ] A test fails if any model gains a `set<Attribute>` method for one of its columns.
