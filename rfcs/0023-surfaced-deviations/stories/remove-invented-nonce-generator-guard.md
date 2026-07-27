---
title: "Drop the invented no-generator guard in generateContentSecurityPolicyNonce"
status: ready
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`generateContentSecurityPolicyNonce` in
`packages/actionpack/src/action-dispatch/http/content-security-policy.ts`
raises a trails-invented error when no nonce generator is configured:

```ts
const generator = this.contentSecurityPolicyNonceGenerator;
if (!generator) {
  throw new Error("No content_security_policy_nonce_generator configured for this request");
}
return generator(this);
```

Rails has no such guard
(`vendor/rails/actionpack/lib/action_dispatch/http/content_security_policy.rb:123-125`):

```ruby
def generate_content_security_policy_nonce
  content_security_policy_nonce_generator.call(self)
end
```

A nil generator raises `NoMethodError: undefined method 'call' for nil`. The
message, class, and the fact that the check happens at all are all trails
inventions, so any caller rescuing or asserting on this path sees a different
failure than Rails produces.

In practice the guard is unreachable through the public path — the only
in-tree caller is `contentSecurityPolicyNonce`, which returns early when the
generator is falsy — so this is a fidelity cleanup, not a live bug. It predates
PR #5405, which relocated the method into the accessor class without changing
the body.

## Acceptance criteria

- The bespoke `throw new Error(...)` is removed, or converged onto whatever
  the repo's established analogue for Ruby's `NoMethodError` on nil is (check
  how sibling ports spell it before inventing a third shape).
- The resulting failure mode matches Rails: calling the private method with no
  generator configured raises rather than returning `undefined`.
- `contentSecurityPolicyNonce`'s early return for a missing generator is
  unchanged — it mirrors Rails' `if content_security_policy_nonce_generator`.
- No new `@noRailsEquivalent` tags or extra-surface allowlist entries.
