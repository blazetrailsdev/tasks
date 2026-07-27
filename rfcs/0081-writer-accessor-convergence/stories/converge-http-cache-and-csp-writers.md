---
title: "Converge ActionDispatch cache/CSP writers onto accessors"
status: closed
updated: 2026-07-27
rfc: "0081-writer-accessor-convergence"
cluster: extra-surface
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "out of scope: data layer only (arel/activemodel/activerecord per compare.ts:2351); these writers are actionpack/actionview/rack/globalid/activesupport"
---

## Context

Shape 3 of the RFC (class slot, no accessor yet) for the ActionDispatch HTTP
request/response mixins — 7 writers whose Rails counterparts are `foo=` on the
same objects:

| helper                                    | file                                              | Rails writer                                |
| ----------------------------------------- | ------------------------------------------------- | ------------------------------------------- |
| `setDate`                                 | `action-dispatch/http/cache.ts`                   | `date=`                                     |
| `setEtag`                                 | `action-dispatch/http/cache.ts`                   | `etag=`                                     |
| `setLastModified`                         | `action-dispatch/http/cache.ts`                   | `last_modified=`                            |
| `setContentSecurityPolicy`                | `action-dispatch/http/content-security-policy.ts` | `content_security_policy=`                  |
| `setContentSecurityPolicyNonceDirectives` | same                                              | `content_security_policy_nonce_directives=` |
| `setContentSecurityPolicyNonceGenerator`  | same                                              | `content_security_policy_nonce_generator=`  |
| `setContentSecurityPolicyReportOnly`      | same                                              | `content_security_policy_report_only=`      |

Rails source: `vendor/rails/actionpack/lib/action_dispatch/http/cache.rb` and
`.../http/content_security_policy.rb`. The readers already carry the Rails names
(`date`, `etag`, `contentSecurityPolicy`, ...), so only the writer half deviates.

`http/cache.ts` also shows the same pattern in its `hasDate`/`hasEtag`
predicates, which are NOT in scope here.

## Acceptance criteria

- Each pair becomes a real `get x()` / `set x(v)` accessor on the host class
  (Request / Response), per `scripts/api-compare/conventions.ts:638`; the
  exported `setX` helper is deleted or made module-private.
- Call sites switch to assignment (`response.etag = value`), matching how Rails
  writes it.
- Tests keep their Rails-verbatim names and pass unchanged.
- `pnpm api:compare` matches the `foo=` writers; `pnpm api:extra` shows 7 fewer
  extras for actionpack and no stale entries.
