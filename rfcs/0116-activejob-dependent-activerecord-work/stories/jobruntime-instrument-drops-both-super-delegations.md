---
title: "JobRuntime#instrument drops both super delegations, so the host's instrumentation never runs"
status: draft
updated: 2026-09-04
rfc: "0116-activejob-dependent-activerecord-work"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Railties::JobRuntime#instrument`
(`vendor/rails/activerecord/lib/active_record/railties/job_runtime.rb:9-17`)
wraps `super` — it is a module included into `ActiveJob::Base`, and its whole
job is to delegate to the host's `instrument` while stamping `db_runtime` onto
the payload:

```ruby
def instrument(operation, payload = {}, &block)
  if operation == :perform && block
    super(operation, payload) do
      db_runtime_before_perform = ActiveRecord::RuntimeRegistry.sql_runtime
      result = block.call
      payload[:db_runtime] = ActiveRecord::RuntimeRegistry.sql_runtime - db_runtime_before_perform
      result
    end
  else
    super
  end
end
```

Both arms call `super`. trails' port
(`packages/activerecord/src/trailties/job-runtime.ts`) drops both:

```ts
if (operation === "perform" && block) {
  const runtimeBefore = RuntimeRegistry.stats().sqlRuntime;
  const result = block();
  payload["dbRuntime"] = RuntimeRegistry.stats().sqlRuntime - runtimeBefore;
  return result;
}
return block ? block() : undefined;
```

It invokes the block directly instead of handing it to `super`, and the else
arm calls the block rather than delegating at all. So the host's own
instrumentation — for ActiveJob, the `ActiveSupport::Notifications` event the
real `instrument` publishes — never runs. The measured surface does not catch
this: the file scores 1/1 because the method exists.

Surfaced while porting the trailtie file mapping (PR #7463); the story that
touched it explicitly fenced the body off, so it was never converged.

## Converged shape

Keep the two arms and restore the delegation. `super` in a `this`-typed mixin
function has a settled trails shape — the host's `instrument` reached through
the prototype chain, or an explicit host-supplied callable, whichever the
JobRuntime mixin's eventual host uses. The block must be passed TO the delegate
rather than invoked here, so the payload stamp still brackets the host's call:

```ts
if (operation === "perform" && block) {
  return superInstrument(operation, payload, () => {
    const dbRuntimeBeforePerform = RuntimeRegistry.stats().sqlRuntime;
    const result = block();
    payload["dbRuntime"] = RuntimeRegistry.stats().sqlRuntime - dbRuntimeBeforePerform;
    return result;
  });
}
return superInstrument(operation, payload, block);
```

Also note the local: Ruby's `db_runtime_before_perform` is `dbRuntimeBeforePerform`,
not `runtimeBefore` (CLAUDE.md: a local keeps the Rails identifier, camelCased).

## Blocked-on

trails has no ActiveJob package, so there is no host whose `instrument` this
can delegate to yet. This story is likely gated on
`0116-activejob-dependent-activerecord-work` landing a host; file it now so the
divergence is tracked rather than re-derived, and converge it when a host
exists. If it cannot converge before then, `pnpm tasks block` it with that
blocker rather than closing it.

## Acceptance criteria

- Both arms of `instrument` delegate rather than invoking the block directly.
- The `perform` arm still brackets the delegate's block with the
  `sql_runtime` reads and stamps `payload["dbRuntime"]`.
- The local is named `dbRuntimeBeforePerform`.
- A test proves the host's `instrument` actually runs (a spy on the delegate),
  which the current port would fail.
- `pnpm parity:api:calls` shows the `super` calls present; if a baseline row
  for this method exists it is DELETED, not rewritten.
