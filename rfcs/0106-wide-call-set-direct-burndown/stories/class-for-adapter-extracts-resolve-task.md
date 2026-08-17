---
title: "class_for_adapter extracts resolveTask where Rails inlines detect"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6666
claim: "2026-08-17T19:47:58Z"
assignee: "class-for-adapter-extracts-resolve-task"
blocked-by: null
closed-reason: null
---

# class_for_adapter extracts resolveTask where Rails inlines `detect`

## Context

Surfaced converging the `tasks/*` call-set rows in #6664. The row
`class_for_adapter | detect` in
`scripts/api-compare/call-mismatches-exclude/activerecord/tasks/database-tasks.json`
is baselined with a per-site reason rather than converged, because the fix is
an extraction removal rather than a one-line call swap.

Rails, `vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:574-580`:

```ruby
def class_for_adapter(adapter)
  _key, task = @tasks.reverse_each.detect { |pattern, _task| adapter[pattern] }
  unless task
    raise DatabaseNotSupported, "Rake tasks not supported by '#{adapter}' adapter"
  end
  task.is_a?(String) ? task.constantize : task
end
```

One Rails method, one body. trails splits it across two
(`packages/activerecord/src/tasks/database-tasks.ts`):
`DatabaseTasks.resolveTask(adapter)` walks `_registeredTasks` newest-first and
`classForAdapter` only raises on its miss. `resolveTask` has no Rails
counterpart — it is exactly the "no extra abstraction" case CLAUDE.md names,
and it is why the comparator sees no `detect` in `class_for_adapter`.

Related but distinct: `database-tasks-registry-holds-singletons-not-task-classes`
(0023) covers `@tasks` holding handler singletons rather than class-name
strings, which is why `task.is_a?(String) ? task.constantize : task` has no
analogue. This story is only about the extraction.

## Converged shape

Inline the reverse-order `detect` into `classForAdapter` so one Rails method is
one TS method, keeping the newest-first walk and the `DatabaseNotSupported`
message verbatim. `resolveTask` goes away unless another caller needs it — check
`grep -rn "resolveTask" packages/` first; if there is one, that caller is the
next thing to converge, not a reason to keep the helper.

## Acceptance criteria

- [ ] `classForAdapter` contains the lookup inline; `resolveTask` is deleted (or
      its remaining callers are converged first and it is deleted after).
- [ ] Delete the `class_for_adapter | detect` row from the exclude shard by hand
      via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten activerecord/tasks/database-tasks.json`.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and
      `pnpm parity:api:extra --package activerecord` green / non-growing.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
