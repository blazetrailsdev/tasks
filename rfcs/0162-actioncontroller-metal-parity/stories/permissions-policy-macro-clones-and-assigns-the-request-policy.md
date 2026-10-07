---
title: "permissions_policy clones the request's policy and assigns it back; drop buildPermissionsPolicy"
status: in-progress
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8618
claim: "2026-10-07T09:33:13Z"
assignee: "permissions-policy-macro-clones-and-assigns-the-request-policy"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-controller/metal/permissions-policy.ts` does not
mirror `ActionController::PermissionsPolicy::ClassMethods#permissions_policy`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/permissions_policy.rb:27-35`):

```ruby
def permissions_policy(**options, &block)
  before_action(options) do
    if block_given?
      policy = request.permissions_policy.clone
      instance_exec(policy, &block)
      request.permissions_policy = policy
    end
  end
end
```

- `permissionsPolicy` hands the block a fresh `{}` of directives and discards
  it. It never reads `request.permissions_policy`, never clones it, and never
  writes the policy back, so a controller-level override has no effect on the
  response header. `Request#permissionsPolicy` and its setter already exist
  (`packages/actionpack/src/action-dispatch/http/request.ts:399-406`).
- `buildPermissionsPolicy` is invented: Rails has no such method in this file,
  and it has no caller outside `permissions-policy.test.ts`. Header rendering
  is `ActionDispatch::PermissionsPolicy#build`
  (`actionpack/lib/action_dispatch/http/permissions_policy.rb`).
  `pnpm parity:api:extra --package actioncontroller` lists it as the file's one
  novel name.
- The block type `PermissionsPolicyBlock` takes a
  `Record<string, string | string[]>` where Rails yields an
  `ActionDispatch::PermissionsPolicy`.

trails#8556 removed the sibling invented helper `applyPermissionsPolicy` from
the same file.

## Acceptance criteria

- `permissionsPolicy` clones `request.permissionsPolicy` with `rbObjClone`,
  `instance_exec`s the block against the controller with the clone, and assigns
  it back, guarded by the block being given, as `permissions_policy.rb:28-34`.
- `buildPermissionsPolicy` and its tests are deleted.
- `metal/permissions-policy.ts` reports no novel name in
  `pnpm parity:api:extra --package actioncontroller`.
- The Rails controller tests in
  `actionpack/test/dispatch/permissions_policy_test.rb` that override a policy
  per controller pass against the real header.
