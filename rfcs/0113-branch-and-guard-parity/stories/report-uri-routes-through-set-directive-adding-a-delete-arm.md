---
title: "CSP#report_uri routes through set_directive, adding a delete arm and source mapping Rails has not"
status: in-progress
updated: 2026-09-02
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 8
pr: 7413
claim: "2026-09-02T22:05:24Z"
assignee: "fold-the-two-trailtie-ports-into-one"
blocked-by: null
closed-reason: null
---

## Context

`ContentSecurityPolicy#report_uri` assigns the directive DIRECTLY in Rails
(`vendor/rails/actionpack/lib/action_dispatch/http/content_security_policy.rb:238-240`):

```ruby
def report_uri(uri)
  @directives["report-uri"] = [uri]
end
```

It is the one directive writer that does not go through the `DIRECTIVES` loop,
so it applies **no source mapping** and has **no delete-on-nil arm**.

The trails port
(`packages/actionpack/src/action-dispatch/http/content-security-policy.ts:169-171`)
routes it through `setDirective` instead:

```ts
reportUri(uri: CSPSource): this {
  return this.setDirective("report-uri", [uri]);
}
```

`setDirective`
(`content-security-policy.ts:207-218`, mirroring `content_security_policy.rb:189-197`)
does two things Rails' `report_uri` does not:

1. **Deletes the directive** when the first source is `nil`/`false` — so
   `policy.reportUri(null)` removes `report-uri` where Rails stores `[nil]`.
2. **Applies `applyMappings`** — so a report URI that happens to collide with a
   mapped keyword (`self`, `unsafe-inline`, …) is rewritten into its quoted
   form, where Rails emits the URI verbatim.

PR #7211 (RFC 0128) converged the SIGNATURE to Rails' single `uri` argument but
deliberately left the `setDirective` call in place, because removing it would
have added a `parity:api:calls` row in a parameter-name-only PR. This story is
that removal.

## Acceptance criteria

- `reportUri` assigns `this.directives.set("report-uri", [uri])` directly,
  matching content_security_policy.rb:238-240 line for line — no mapping, no
  delete arm.
- The now-absent `setDirective` call does not leave a `parity:api:calls` row:
  Rails' body makes no such call, so the call sets should MATCH after the change.
  If a row appears, it is a comparator finding, not a reason to keep the call.
- A test covers a report URI that collides with a mapping keyword, so the
  verbatim emission is pinned. Test names come from
  `vendor/rails/actionpack/test/dispatch/content_security_policy_test.rb`
  verbatim.
