---
title: "CSP#plugin_types and #sandbox route through set_directive, applying source mappings Rails does not"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `report_uri` in PR #7413
(`report-uri-routes-through-set-directive-adding-a-delete-arm`). `report_uri`
was one of THREE directive writers that assign `@directives` directly instead of
going through the `DIRECTIVES` loop; the other two are still routed through
`setDirective` in trails and carry the same two extra behaviours.

`ContentSecurityPolicy#plugin_types`
(`vendor/rails/actionpack/lib/action_dispatch/http/content_security_policy.rb:223-229`):

```ruby
def plugin_types(*types)
  if types.first
    @directives["plugin-types"] = types
  else
    @directives.delete("plugin-types")
  end
end
```

`ContentSecurityPolicy#sandbox` (`content_security_policy.rb:271-279`):

```ruby
def sandbox(*values)
  if values.empty?
    @directives["sandbox"] = true
  elsif values.first
    @directives["sandbox"] = values
  else
    @directives.delete("sandbox")
  end
end
```

Both assign the raw `types` / `values` array. Neither calls `apply_mappings`.

The trails port
(`packages/actionpack/src/action-dispatch/http/content-security-policy.ts:199-222`)
gets the delete arms and the bare-directive arm right, but both tails hand off to
`setDirective`:

```ts
return this.setDirective("sandbox", values as CSPSource[]);
...
return this.setDirective("plugin-types", types as CSPSource[]);
```

and `setDirective` (`content-security-policy.ts:207-218`, mirroring
`content_security_policy.rb:189-197`) calls `applyMappings`. So a source that
collides with a mapped keyword — `":self"`, `":unsafe-inline"`, … — is rewritten
into its quoted form where Rails emits it verbatim. For `plugin-types`, whose
values are MIME types, and for `sandbox`, whose values are sandbox flag tokens,
Rails never intends a CSP-source mapping at all.

## Converged shape

Assign directly, exactly as `report_uri` now does after #7413:

```ts
this.directives.set("plugin-types", types as CSPSource[]);
return this;
```

and the same for the `sandbox` value arm. No `applyMappings` on either.

Note the delete arms here are Rails' own (`if types.first` / `elsif
values.first`) and must stay — unlike `report_uri`, which has no delete arm.
Only the mapping goes.

## Acceptance criteria

- [ ] `pluginTypes` assigns `this.directives.set("plugin-types", types)`
      directly, matching content_security_policy.rb:223-229 line for line.
- [ ] `sandbox`'s value arm assigns `this.directives.set("sandbox", values)`
      directly, matching content_security_policy.rb:271-279; the empty-args
      `true` arm and the nil/false delete arm are unchanged.
- [ ] Neither writer calls `setDirective` or `applyMappings` any more.
- [ ] Removing the `setDirective` calls leaves no `parity:api:calls` row —
      Rails' bodies make no such call, so the call sets should MATCH after the
      change. A row appearing is a comparator finding, not a reason to keep it.
- [ ] Coverage pins verbatim emission for a mapping-keyword-colliding value on
      both writers. Rails has no such test, so it belongs in
      `content-security-policy.trails.test.ts` beside the `report_uri` pair
      #7413 added.
