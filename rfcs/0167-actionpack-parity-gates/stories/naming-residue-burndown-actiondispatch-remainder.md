---
title: "Burn actiondispatch's remaining naming-class call-argument rows to zero"
status: done
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#9026
claim: "2026-10-18T13:07:02Z"
assignee: "rb-inspect-of-plain-object-is-rb-obj-inspect"
blocked-by: null
closed-reason: null
---

## Context

`naming-residue-burndown-actiondispatch` took actiondispatch's burndown-class naming rows in `pnpm parity:api:calls:args:report` from 64 to 26 (2026-10-17). The rest need more than a local rename: a Ruby core method spelled with its JS equivalent (`downcase` / `upcase` / `tr` / `chomp` / `each_line` / `Regexp.quote`), a delegator's `__getobj__`, an ivar the Rails body reads through a reader (`scope`, `set`, `regexp_visitor`), a `this`-typed mixin receiver, or a `respond_to?` / `public_send` dispatch the port inlined. Rows, as `tsFile: rubyCall ruby=… ts=…` (paths under `packages/actionpack/src/action-dispatch/`, Ruby under `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/`):

```text
http/filter-parameters.ts:  filter ruby=["ref:parameters"] ts=["ref:params"] [burndown]
http/mime-negotiation.ts:  lookup ruby=["ref:downcase"] ts=["ref:toLowerCase"] [burndown]
http/mime-type.ts:  new ruby=["ref:quote"] ts=["ref:regexpEscape"] [burndown]
http/request.ts:  set_header ruby=["ref:envKey","ref:dup"] ts=["ref:envKey","ref:jsObjDup"] [burndown]
journey/path/pattern.ts:  new ruby=["ref:regexpVisitor","ref:separators","ref:requirements"] ts=["ref:_separators","ref:requirements","ref:names"] [burndown]
journey/route.ts:  new ruby=["ref:upcase"] ts=["ref:toUpperCase"] [burndown]
middleware/debug-locks.ts:  blocked_by? ruby=["ref:info","ref:binfo","ref:values"] ts=["ref:info","ref:binfo","ref:allInfos"] [burndown]
middleware/debug-locks.ts:  blocked_by? ruby=["ref:binfo","ref:info","ref:values"] ts=["ref:binfo","ref:info","ref:allInfos"] [burndown]
middleware/exception-wrapper.ts:  extract_source_fragment_lines ruby=["ref:eachLine","ref:line"] ts=["ref:split","ref:line"] [burndown]
middleware/exception-wrapper.ts:  spot ruby=["ref:__getobj__"] ts=["ref:location"] [burndown]
middleware/exception-wrapper.ts:  translate_location ruby=["ref:__getobj__","ref:location"] ts=["ref:location","ref:location"] [burndown]
middleware/executor.ts:  new ruby=["ref:pop"] ts=["ref:body"] [burndown]
middleware/public-exceptions.ts:  render_format ruby=["ref:status","ref:contentType","ref:publicSend"] ts=["ref:status","ref:contentType","ref:stringify"] [burndown]
middleware/static.ts:  join ruby=["ref:root","ref:b"] ts=["ref:root","ref:path"] [burndown]
middleware/static.ts:  unescape_path ruby=["ref:chomp"] ts=["ref:replace"] [burndown]
routing/mapper.ts:  normalize_name ruby=["ref:tr"] ts=["ref:replace"] [burndown]
routing/mapper.ts:  check_via ruby=["ref:array"] ts=["ref:kernelArray"] [burndown]
routing/mapper.ts:  using_match_shorthand? ruby=["ref:pathWithoutFormat"] ts=["ref:stripped"] [burndown]
routing/mapper.ts:  build ruby=["ref:scope","ref:set","ref:ast","ref:controller","ref:defaultAction","ref:to","ref:via","ref:formatted","ref:optionsConstraints","ref:anchor","ref:options"] ts=["ref:_scope","ref:_set","ref:ast","ref:controller","ref:defaultAction","ref:to","ref:kernelArray","ref:formatted","ref:optionsConstraints","ref:anchor","ref:options"] [burndown]
routing/polymorphic-routes.ts:  get_method_for_string ruby=["ref:name"] ts=["ref:keyStrategy"] [burndown]
routing/polymorphic-routes.ts:  handle_list ruby=["ref:recordOrHashOrArray"] ts=["ref:compact"] [burndown]
routing/url-for.ts:  handle_string_call ruby=["ref:this","ref:options"] ts=["ref:target","ref:options"] [module-mixin-receiver]
routing/url-for.ts:  handle_class_call ruby=["ref:this","ref:options"] ts=["ref:target","ref:options"] [module-mixin-receiver]
routing/url-for.ts:  handle_model_call ruby=["ref:this","ref:options"] ts=["ref:target","ref:options"] [module-mixin-receiver]
testing/assertions/response.ts:  assert_equal ruby=["ref:code","ref:responseCode","ref:message"] ts=["ref:code","ref:status","ref:message"] [burndown]
testing/integration.ts:  merge! ruby=["ref:wrappedHeaders"] ts=["ref:headers"] [burndown]
```

## Acceptance criteria

- Every row above is renamed to the Rails identifier (pass what Rails passes, call the ported method Rails calls) or, where `classifyPair` files the pair permanent, receipted with `@missingRailsName … — PERMANENT`.
- `pnpm parity:api:calls:args:report` shows 0 burndown-class naming rows for actiondispatch.
