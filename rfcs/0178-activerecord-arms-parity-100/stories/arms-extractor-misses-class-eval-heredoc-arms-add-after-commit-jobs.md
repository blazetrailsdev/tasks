---
title: "arms report: a class_eval heredoc's arms are invisible on the Ruby side (addAfterCommitJobsCallback +or)"
status: in-progress
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8718
claim: "2026-10-09T17:09:43Z"
assignee: "active-record-base-inherited-chain-needs-one-deferred-dispatch"
blocked-by: null
closed-reason: null
---

## Context

Surfaced landing trails#8624, which ported `Builder::Association.add_after_commit_jobs_callback`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/builder/association.rb:145-160`).

Rails defines the reader inside a `class_eval` heredoc:

```ruby
mixin.class_eval <<-CODE, __FILE__, __LINE__ + 1
  def _after_commit_jobs
    @_after_commit_jobs ||= []
  end
CODE
```

The Ruby side of the arms extractor does not read the heredoc body, so the pair's Ruby stream ends at
`ref:class_eval` and carries no `or`. The port
(`packages/activerecord/src/associations/builder/association.ts`, `addAfterCommitJobsCallback`) writes
the same memo as `rbObjIvarGet(this, "@_after_commit_jobs") ?? rbObjIvarSet(this, "@_after_commit_jobs", [])`
inside `mixin.moduleEval`, which the TS side does read. So
`pnpm parity:api:arms:report --package=activerecord --direction=invented` lists
`associations/builder/association.ts#addAfterCommitJobsCallback  +or  1`, a row the port cannot clear:
the arm is Rails' own.

`@inventedArm` takes only `if` / `loop` / `try` / `rescue` / `throw` or a call name, so there is no
receipt shape for `or`, and a receipt would be wrong anyway.

## Acceptance criteria

- [ ] The Ruby arms stream for a method whose body `class_eval`s a heredoc includes the control tokens
      of the heredoc's method bodies (or the TS stream drops those of the matching `moduleEval`
      block), so the two sides are compared like for like.
- [ ] The short-circuit projection shows no row for `addAfterCommitJobsCallback`, with the port's
      `??` memo unchanged.
