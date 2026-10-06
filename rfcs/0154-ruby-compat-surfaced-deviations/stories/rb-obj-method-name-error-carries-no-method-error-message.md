---
title: "ruby-compat: rbObjMethod's NameError carries the NoMethodError message, not rb_method_name_error's"
status: draft
updated: 2026-10-06
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rbObjMethod` (`packages/ruby-compat/src/method.ts:106-128`), the port of
`Kernel#method`, raises its `NameError` with a message MRI does not produce:

```text
undefined method 'nope' for an instance of Class
```

MRI raises it from `rb_method_name_error`
(`vendor/ruby/v3.3.11/proc.c:1995-2023`), whose format is
``undefined method `%1$s' for class `%2$s'`` (`for module` when the owner is a
Module), with `%2$s` the class the lookup ran on. For a class receiver that is
the singleton class, rendered `#<Class:A>`. Read off `ruby` 3.3.11:

```ruby
class A; end
A.method(:nope)      # NameError: undefined method `nope' for class `#<Class:A>'
A.new.method(:nope)  # NameError: undefined method `nope' for class `A'
```

The trails message is the `NoMethodError` shape (`for an instance of X`), which
is a different MRI function. Surfaced by `MessagePack::Unpacker#register_type`
(`vendor/msgpack/v1.8.0/lib/msgpack/unpacker.rb:9-10`,
`packages/msgpack/src/unpacker.ts`), which reaches `klass.method(method_name)`
at registration.

## Acceptance criteria

- `rbObjMethod`'s `NameError` carries `rb_method_name_error`'s message, with
  both the `class` and `module` arms and the singleton-class rendering for a
  class receiver.
- A `.trails.test.ts` case pins the message for a class receiver, an instance
  receiver and a Module receiver, each read off `ruby`.
