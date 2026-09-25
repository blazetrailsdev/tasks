---
title: "protected-environment-reads-last-stored-environment-once"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#8076
claim: "2026-09-25T02:04:15Z"
assignee: "port-ruby-method-arity-for-globalid-locator"
blocked-by: null
closed-reason: null
---

## Context

`MigrationContext#protected_environment?`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1344-1346`) is

```ruby
def protected_environment? # :nodoc:
  ActiveRecord::Base.protected_environments.include?(last_stored_environment) if last_stored_environment
end
```

— it calls `last_stored_environment` **twice**, once as the trailing `if`
guard and once as the `include?` argument. `last_stored_environment`
(`migration.rb:1348-1357`) reads `current_version` each time, so Rails'
`check_current_protected_environment!`
(`activerecord/lib/active_record/tasks/database_tasks.rb:635-648`) reads
`current_version` three times per configuration: once for its own
`stored` local and twice inside `protected_environment?`.

trails' port (`packages/activerecord/src/migration.ts:1494-1499`) reads it
once into a local:

```ts
async protectedEnvironment(this: MigrationContext): Promise<boolean> {
  const stored = await this.lastStoredEnvironment();
  if (!stored) return false;
  const { Base } = await import("./base.js");
  return (Base.protectedEnvironments ?? ["production"]).includes(stored);
}
```

So trails reads `current_version` twice per configuration where Rails reads
it three times. The call-set gate cannot see this: both bodies call
`lastStoredEnvironment`, only the COUNT differs.

It is measurable from the test side. Rails'
`DatabaseTasksCheckProtectedEnvironmentsTest#test_raises_an_error_when_called_with_protected_environment`
(`activerecord/test/cases/tasks/database_tasks_test.rb:72-95`) wraps its body in
`assert_called_on_instance_of(ActiveRecord::MigrationContext, :current_version,
times: 6, returns: 1)`. The trails port
(`packages/activerecord/src/tasks/database-tasks.test.ts`, the same test name)
passes `times: 4` for that reason — trails#7859 landed the `times:` argument at
the number trails actually produces rather than Rails'.

The second deviation in the same body: Ruby's `x if cond` returns `nil` when
the guard is false, so `protected_environment?` answers `nil`, not `false`
(CLAUDE.md, "Predicates"). trails returns `boolean`.

## Acceptance criteria

- `MigrationContext#protectedEnvironment` calls `lastStoredEnvironment` twice,
  in the same two positions Rails does, with no intervening local.
- Its falsy answer is the Ruby one (`nil` → `null`/`undefined`), not `false`,
  unless a call site is shown to need a boolean.
- `times: 4` in `database-tasks.test.ts`'s
  `raises an error when called with protected environment` becomes Rails'
  `times: 6`, and the test passes.
- `pnpm parity:test -- --package activerecord --assertions` still reports 0
  count / 0 kind / 0 value mismatches for `tasks/database_tasks_test.rb`.
