---
title: 'Association-callback log helpers render a nil id as "undefined", not ""'
status: done
updated: 2026-09-23
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#7998
claim: "2026-09-23T14:33:22Z"
assignee: "activemodel-respond-to-cannot-hide-private-methods"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `associations/callbacks_test.rb` assertions (trails#7918).

Ruby interpolates `nil` as the empty string, so Rails' association-callback log
helpers render a nil id as nothing at all:

- `vendor/rails/activerecord/test/models/author.rb:278-281` —
  `def log_after_adding(object); @post_log << "after_adding#{object.id}"; end`
  → `"after_adding"` when `object.id` is nil.
- `author.rb:282-289` — `log_before_removing` / `log_after_removing`, same bare
  `#{object.id}`.
- `vendor/rails/activerecord/test/models/project.rb:14-15` — the
  `developers_with_callbacks` `before_remove` / `after_remove` procs, same shape.

Note the contrast Rails draws deliberately: `log_before_adding`
(`author.rb:274-276`) and project.rb's `before_add` / `after_add` DO spell
`#{object.id || '<new>'}`, because those fire on an unsaved record. The bare
ones are the arms Rails expects to see an id on.

trails' ports interpolate the same expression into a JS template literal, where
a nil id stringifies as `"null"` / `"undefined"` rather than `""`:

- `packages/activerecord/src/test-helpers/models/author.ts:382` —
  `afterAdd: (owner, r) => owner.postLog.push(\`after_adding${r.id}\`)`
- `author.ts:383-384` — `beforeRemove` / `afterRemove`, same.
- `author.ts:406-407` — `postsWithProcCallbacks`' remove arms.
- `author.ts:415` — `postsWithMultipleCallbacks`' `log_after_adding` arm.
- `author.ts:423` — `unchangeablePosts`' `afterAdd`.
- `packages/activerecord/src/test-helpers/models/project.ts:61-62` —
  `developersWithCallbacks`' remove arms.

`has many callbacks for save on parent` is the test that actually walks the nil
arm: Rails' `callback_log` is `["before_adding<new>", "after_adding"]`, trails'
is `["before_adding<new>", "after_addingundefined"]`. It passes today only
because the test builds its expected array by interpolating the same nil, so
both sides drift together and the assertion is self-fulfilling.

Also in the same models: Rails' `raise_exception` (`author.rb:291-293`) raises
`Exception`, which is why `test_dont_add_if_before_callback_raises_exception`
rescues `Exception` rather than `StandardError`; `author.ts:421` throws a plain
`Error`. Worth converging in the same pass if there is a settled trails spelling
for a non-`StandardError` raise.

## Converged shape

Render a nil id as the empty string wherever Rails' helper does, e.g.

```ts
afterAdd: (owner: any, r: any) => owner.postLog.push(`after_adding${r.id ?? ""}`),
```

for every bare-`#{object.id}` arm listed above, leaving the `?? "<new>"` arms
alone — they mirror Rails' `|| '<new>'`.

Then make `has many callbacks for save on parent`
(`packages/activerecord/src/associations/callbacks.test.ts`) assert the literal
Rails array instead of re-interpolating the id, so the test can no longer drift
with the model:

```ts
const callbackLog = ["before_adding<new>", "after_adding"];
```

which is `callbacks_test.rb:95-101` read literally.

## Acceptance criteria

- Every bare `${r.id}` / `${object.id}` interpolation in the association-callback
  log helpers of `test-helpers/models/author.ts` and
  `test-helpers/models/project.ts` renders `""` for a nil id, matching its Ruby
  counterpart line for line.
- The `|| '<new>'` arms keep `?? "<new>"` — unchanged.
- `has many callbacks for save on parent` asserts the literal
  `["before_adding<new>", "after_adding"]` rather than interpolating an id it
  just read back.
- `pnpm parity:test -- --package activerecord --assertions --missing` keeps
  `associations/callbacks_test.rb` at 0 count/kind/value mismatches.
- No test renames.
