---
title: "Port Thor::Util (namespace lookup, snake/camel case, ruby_command, escape_globs)"
status: draft
updated: 2026-09-30
rfc: "0000-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-base-command-registry-method-added-and-start"]
deps-rfc: []
est-loc: 350
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/lib/thor/util.rb` (285 lines). Ported members: `find_by_namespace` (`:24-27`),
`namespace_from_thor_class` (`:43-47`), `thor_classes_in` (`:74-80`), `snake_case`
(`:90-94`), `camel_case` (`:104-107`), `find_class_and_command_by_namespace` (`:131-147`, and
the `_task_` alias), `ruby_command` (`:221-249`) and `escape_globs` (`:264-266`). The
Runner-only members (`namespaces_in_content`, `load_thorfile`, `user_home`, `thor_root`,
`thor_root_glob`, `globs_for`, `escape_html`) and `Sandbox` are scoped skips
(`enroll-thor-specs-in-parity-test`).

Consumers: `Thor::Invocation.prepare_for_invocation` (`vendor/thor/v1.3.2/lib/thor/invocation.rb:12-19`),
`Thor.help`'s `thor_classes_in(self)` (`vendor/thor/v1.3.2/lib/thor/../thor.rb:290`), and railties'
`add_shebang_option!` (`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:397-404`:
`class_option :ruby, default: Thor::Util.ruby_command`).

## Fidelity traps (predicted at authoring)

- [ ] **`thor_classes_in(klass)`** reads `klass.constants` (constants nested in the class).
      A JS class has none. Port it over the Ruby-name seat: the subclasses whose Ruby name is
      `"#{klass.name}::X"`, so `Thor.help` lists nested Thor classes as Ruby does.
- [ ] **`snake_case`**: `return str.downcase if str =~ /^[A-Z_]+$/`, then
      `gsub(/\B[A-Z]/, '_\&').squeeze("_")` and `Regexp.last_match(-1)`. Port `squeeze` and the
      `\&` backreference (JS `$&`).
- [ ] **`namespace_from_thor_class`** runs `snake_case(constant).squeeze(":")`, so
      `Foo::BarBaz` becomes `foo:bar_baz`.
- [ ] **`ruby_command`** answers the running interpreter. In trails that is the JS runtime
      executable, `process.execPath` through ruby-compat's process adapter, quoted if it contains
      whitespace (`:246`). Record the substitution at the definition: the name is Thor's and the
      value is the analogue.
- [ ] **`find_by_namespace`** prefixes `"default"` for `""` or a leading `:`.

## Acceptance criteria

- [ ] The ported members read complete in `parity:api --package thor`.
- [ ] `vendor/thor/v1.3.2/spec/util_spec.rb`'s 24 portable cases are ported, and the 10 Runner cases are recorded
      as unported.

## Cases to port (24)

`vendor/thor/v1.3.2/spec/util_spec.rb`:

- `#find_by_namespace > returns 'default' if no namespace is given` (`:11`)
- `#find_by_namespace > adds 'default' if namespace starts with :` (`:15`)
- `#find_by_namespace > returns nil if the namespace can't be found` (`:19`)
- `#find_by_namespace > returns a class if it matches the namespace` (`:23`)
- `#find_by_namespace > matches classes default namespace` (`:27`)
- `#namespace_from_thor_class > replaces constant nesting with command namespacing` (`:33`)
- `#namespace_from_thor_class > snake-cases component strings` (`:37`)
- `#namespace_from_thor_class > accepts class and module objects` (`:41`)
- `#namespace_from_thor_class > removes Thor::Sandbox namespace` (`:46`)
- `#snake_case > preserves no-cap strings` (`:66`)
- `#snake_case > downcases all-caps strings` (`:71`)
- `#snake_case > downcases initial-cap strings` (`:76`)
- `#snake_case > replaces camel-casing with underscores` (`:80`)
- `#snake_case > places underscores between multiple capitals` (`:85`)
- `#find_class_and_command_by_namespace > returns a Thor::Group class if full namespace matches` (`:91`)
- `#find_class_and_command_by_namespace > returns a Thor class if full namespace matches` (`:95`)
- `#find_class_and_command_by_namespace > returns a Thor class and the command name` (`:99`)
- `#find_class_and_command_by_namespace > falls back in the namespace:command look up even if a full namespace does not match` (`:103`)
- `#find_class_and_command_by_namespace > falls back on the default namespace class if nothing else matches` (`:109`)
- `#find_class_and_command_by_namespace > returns correct Thor class and the command name when shared namespaces` (`:113`)
- `#find_class_and_command_by_namespace > returns correct Thor class and the command name with hypen when shared namespaces` (`:118`)
- `#find_class_and_command_by_namespace > returns correct Thor class and the associated alias command name when shared namespaces` (`:122`)
- `#thor_classes_in > returns thor classes inside the given class` (`:128`)
- `#escape_globs > escapes ? * { } [ ] glob characters` (`:202`)
