---
title: "Collection proxy method_missing delegation (+ Comment.allAsMethod)"
status: claimed
updated: 2026-06-06
rfc: "0000-ar-framework-gaps"
cluster: readonly
deps: []
deps-rfc: []
est-loc: 40
priority: 37
pr: null
claim: "2026-06-06T14:31:11Z"
assignee: "readonly-collection-method-missing"
blocked-by: null
---

## Context

From `readonly-test-framework-gaps.md`. `developer.projects.allAsMethod().first()`
and `(Post.find(1) as project).comments.allAsMethod().first()` require the proxy
to surface `Project.allAsMethod` / `Comment.allAsMethod`. `Project.allAsMethod()`

- `Project.allAsScope()` exist (`project.ts:62-65`); **`Comment.allAsMethod` is
  absent** — `comment.rb:58` has `def self.all_as_method; all; end` but `comment.ts`
  only has the `allAsScope` named scope.

## Acceptance criteria

- [ ] Add `Comment.allAsMethod` static (~3 LOC, mirror `comment.rb:58`).
- [ ] Collection proxy `method_missing` delegates class scopes/methods
      (`.allAsMethod()`) to the target model (~30 LOC).
- [ ] Un-skips: `association collection method missing scoping not readonly` (1).

## Notes

trails: `project.ts:62-65`, `comment.ts`. Rails: `comment.rb:58`.
