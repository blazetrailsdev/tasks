---
title: "Thor::Options regex probes coerce a non-String pile element where Ruby raises"
status: ready
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Thor::Options` matches pile elements against regexes at two sites where the element may not be a String, and the port (`packages/trailties/src/thor/parser/options.ts`, trails#8462) casts and lets `RegExp#test` coerce it:

- `parse`: `@extra << shift while peek && peek !~ /^-/` (`vendor/thor/v1.3.2/lib/thor/parser/options.rb:126`) is `!/(?<![^\n])-/.test(this.peek() as string)`.
- `check_unknown!`: `to_check.select { |str| str =~ /^--?(?:(?!--).)*$/ }` (`options.rb:172`) is `.test(str as string)`.

`RegExp#test` stringifies its argument, so an Array `["-a"]` or the Integer `-5` in the pile tests as `"-a"` / `"-5"`. In Ruby 3.3 `Object#=~` is gone: `-5 =~ /re/` and `-5 !~ /re/` raise `NoMethodError`, and `["-a"] =~ /re/` raises too. Non-String pile elements are reachable: `parse_array` / `parse_hash` / `parse_numeric` shift an Array, Hash or Numeric straight off the pile (`arguments.rb:98,117,139`), and the `.trails` test already parses a literal `true`.

## Acceptance criteria

- [ ] Confirm against MRI (`ruby -I vendor/thor/v1.3.2/lib`) what each site does for an Integer, an Array and `true` in the pile, and record the result in the story.
- [ ] Both sites answer what MRI answers for a non-String element, through the ruby-compat `=~` dispatch (or `rbFSend`) rather than a cast.
- [ ] `options.trails.test.ts` covers each site with a non-String element.
