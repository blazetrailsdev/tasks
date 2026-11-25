---
title: "Port safe_constantize's LoadError rescue arm"
status: draft
updated: 2026-11-23
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

`ActiveSupport::Inflector#safe_constantize`
(`vendor/rails/v8.0.5.2/activesupport/lib/active_support/inflector/methods.rb:315-324`) has two rescue arms:

```ruby
rescue NameError => e
  raise if e.name && !(camel_cased_word.to_s.split("::").include?(e.name.to_s) ||
    e.name.to_s == camel_cased_word.to_s)
rescue LoadError => e
  message = e.respond_to?(:original_message) ? e.original_message : e.message
  constant_name = camel_cased_word.split("::").find { |part| !part.empty? } || camel_cased_word
  raise unless message.include?("Unable to autoload constant #{constant_name}")
end
```

`packages/activesupport/lib/inflector.ts` `safeConstantize` ports only the `NameError` arm. A `LoadError` raised while autoloading (Zeitwerk's "Unable to autoload constant X") escapes instead of answering `nil`. trails#10665 re-pinned the body against v8.0.5.2, where the arm changed from `const_regexp` to `include?`, but the arm is still unported.

## Acceptance criteria

- [ ] `safeConstantize` gains the `LoadError` arm in Rails' order. It reads `originalMessage` when the error answers it, else `message`, and finds the first non-empty `::` segment. It re-raises unless the message includes `Unable to autoload constant <name>`.
- [ ] A test covers a `LoadError` with the autoload message answering `undefined` (Ruby `nil`), and an unrelated `LoadError` re-raising.
- [ ] `pnpm parity:api:calls` shows no missing call for `safe_constantize`.
