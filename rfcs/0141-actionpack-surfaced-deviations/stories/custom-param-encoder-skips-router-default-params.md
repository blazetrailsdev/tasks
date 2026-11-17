---
title: "CustomParamEncoder re-encodes router-default params that Rails skips as frozen (~40 LOC)"
status: draft
updated: 2026-11-17
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `CustomParamEncoder.encode_for_template` skips a frozen param, because a frozen param comes from the router defaults: `next if param.frozen?` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/request/utils.rb:90-91`). `ParamBuilder#store_nested_param` does the same with `!v.frozen?` (`http/param_builder.rb:117`).

trails' `CustomParamEncoder.encodeForTemplate` (`packages/actionpack/lib/action-dispatch/request/utils.ts`) and `ParamBuilder#storeNestedParam` (`http/param-builder.ts`) have no such guard. A JS string is always frozen (root CLAUDE.md § "Ruby Strings are JS string primitives"), so `frozen?` cannot be read off the value. The router-default origin has to be told apart some other way, such as the path-parameters defaults the route set merges.

Found in review of trails#10216.

## Acceptance criteria

- A route default named in a `param_encoding` template is not re-encoded, as in Rails.
- A trails test pins the default staying a string while a request param of the same key is encoded.
