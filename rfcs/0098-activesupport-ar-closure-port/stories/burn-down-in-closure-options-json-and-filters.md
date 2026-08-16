---
title: "burn-down-in-closure-options-json-and-filters"
status: done
updated: 2026-08-16
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6608
claim: "2026-08-16T19:33:30Z"
assignee: "burn-down-in-closure-options-json-and-filters"
blocked-by: null
closed-reason: null
---

## Context

Split (c) of [[burn-down-in-closure-small-file-residue]], whose own Notes say
13 files is more than one PR. The parent's PR shipped split (a) (array/hash/
enumerable core-ext, `number_to_delimited`, `const_regexp`, `parameterize`);
split (b) is [[burn-down-in-closure-inflections-and-descendants-tracker]].

| Rails file              | TS file                       | Missing members                                                                                            |
| ----------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `json/decoding.rb`      | `json.ts`                     | `ActiveSupport#parse_json_times`, `#parse_json_times=`, `JSON#load`, `#parse_error`, `#convert_dates_from` |
| `ordered_options.rb`    | `ordered-options.ts`          | `OrderedOptions#_get`, `#extractable_options?`, `InheritableOptions#own_key?`, `#overridden?`              |
| `parameter_filter.rb`   | `parameter-filter.ts` (78 ln) | `#compile_filters!`, `#call`, `#value_for_key`, `#precompile_filters`                                      |
| `configuration_file.rb` | `configuration-file.ts`       | `#read`, `#render`                                                                                         |

`parameter_filter.rb` is 78 lines to Rails' full class and is missing `#call`,
its main entry point. Check whether trails' filtering is already reached under
another name before porting — a duplicate path is worse than the gap; if it is,
that is a naming convergence to file against RFC 0096.

The four XML members from the parent's table (`Hash#to_xml`, `#from_xml`,
`#from_trusted_xml`, `Array#to_xml`) belong to RFC 0101 and are NOT in scope
here.

## Acceptance criteria

- [ ] Each member above is ported at its Rails name per
      `docs/ruby-ts-conventions.md`, or carries a `SKIP_GROUPS` reason.
- [ ] `ParameterFilter#call`'s disposition is stated: ported, or shown to be
      already reachable under another name.
- [ ] `pnpm parity:api:calls` / `:args` green with no new baseline rows;
      `pnpm parity:api:extra --package activesupport` shows no new surface.
