---
title: "Mapper#addRoute's body is a trails invention; converge onto add_route with path_for_action / name_for_action"
status: draft
updated: 2026-09-26
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8154 gave `Mapper#addRoute` (`packages/actionpack/src/action-dispatch/routing/mapper.ts`) Rails' nine-parameter signature. Its body is still a trails invention.

Rails' `add_route` is at `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:2038-2066`:

```ruby
path = path_for_action(action, _path)
raise ArgumentError, "path is required" if path.blank?
action = action.to_s
default_action = options.delete(:action) || @scope[:action]
if /^[\w\-\/]+$/.match?(action)
  default_action ||= action.tr("-", "_") unless action.include?("/")
else
  action = nil
end
as = if !options.fetch(:as, true) then options.delete(:as) else name_for_action(options.delete(:as), action) end
path = Mapping.normalize_path URI::RFC2396_PARSER.escape(path), formatted
ast = Journey::Parser.parse path
mapping = Mapping.build(@scope, @set, ast, controller, default_action, to, via, formatted, options_constraints, anchor, options)
@set.add_route(mapping, as)
```

The trails body differs in several places:

- It builds the path as `scope path + "/" + path`. Rails has a `path_for_action` (`mapper.rb`), which trails has not ported.
- It infers the route name from path segments. Rails uses `name_for_action`, also not ported.
- It parses `controller#action` from an endpoint string.
- It resolves `__redirect__:` tokens.
- It builds a trails `Route` alongside the `Mapping`.
- It merges URL-option constraints into defaults inline.

## Acceptance criteria

- `addRoute` mirrors `mapper.rb:2038-2066`, including the `path is required` raise and the `default_action` / `as` arms.
- It goes through ported `pathForAction` and `nameForAction`.
- The routing test files stay green.
