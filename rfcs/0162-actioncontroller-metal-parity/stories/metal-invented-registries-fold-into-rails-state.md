---
title: "Replace the invented Flash, Rescue, ParameterEncoding and RateLimit registries with Rails' state"
status: draft
updated: 2026-09-27
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps:
  [
    "action-controller-config-seats-onto-activesupport-primitives",
    "wire-parameter-encoding-onto-metal-action-encoding-template",
    "split-redirect-to-into-redirecting-and-flash",
  ]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package actioncontroller` lists four invented
registries, each standing in for state Rails keeps elsewhere
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/`):

| trails (`packages/actionpack/src/action-controller/metal/`)                   | Rails state                                                                                                                                                                      |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FlashTypeRegistry` (`flash.ts:1`), `extractFlashFromOptions`, `has`, `types` | `class_attribute :_flash_types` (`flash.rb:10`), `add_flash_types` (`:34`)                                                                                                       |
| `RescueRegistry` (`rescue.ts:3`), `findHandler`, `processWithRescue`          | `include ActiveSupport::Rescuable` (`rescue.rb:14`) and `process_action`'s `rescue => exception; rescue_with_handler(exception) \|\| raise` (`:26`)                              |
| `ParameterEncodingRegistry` (`parameter-encoding.ts:1`), `isSkipped`          | `setup_param_encode` / `action_encoding_template` / `skip_parameter_encoding` / `param_encoding` (`parameter_encoding.rb:16-79`) over per-class state set in `inherited` (`:11`) |
| `MemoryRateLimitStore` (`rate-limiting.ts:26`), `isRateLimited` (`:71`)       | `rate_limit(…, store: cache_store, …)` (`rate_limiting.rb:55`) and `rate_limiting` (`:61`), which call `store.increment` on an `ActiveSupport::Cache` store                      |

`permissions-policy.ts` adds `applyPermissionsPolicy` (`:4`) and
`buildPermissionsPolicy` (`:14`); Rails' `PermissionsPolicy::ClassMethods#permissions_policy`
(`permissions_policy.rb:27`) installs a `before_action` that mutates
`request.permissions_policy`.

## Acceptance criteria

- Each registry and helper above is removed; the Rails state and methods replace
  it at the Rails names. `ActiveSupport::Rescuable` comes from
  `@blazetrails/activesupport`, and rate limiting uses a cache store
  (`ActiveSupport::Cache::MemoryStore` in tests, as Rails' tests do).
- `pnpm parity:api:extra --package actioncontroller` lists none of these five
  files.
- The existing matched tests for flash, rescue, parameter encoding, rate
  limiting and permissions policy stay green.
