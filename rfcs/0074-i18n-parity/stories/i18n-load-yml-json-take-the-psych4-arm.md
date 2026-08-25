---
title: "load_yml/load_json take the legacy probe arm Rails never takes"
status: done
updated: 2026-08-07
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6176
claim: "2026-08-07T15:54:17Z"
assignee: "i18n-load-yml-json-take-the-psych4-arm"
blocked-by: null
closed-reason: null
---

## Context

`load_yml` and `load_json` each probe for a modern parser and take one of two
arms. trails ports only the **legacy** arm of both — which is the arm Rails
does _not_ take on any supported Ruby.

`vendor/i18n/lib/i18n/backend/base.rb:261-270`:

```ruby
def load_yml(filename)
  begin
    if YAML.respond_to?(:unsafe_load_file) # Psych 4.0 way
      [YAML.unsafe_load_file(filename, symbolize_names: true, freeze: true), true]
    else
      [YAML.load_file(filename), false]
    end
  rescue TypeError, ScriptError, StandardError => e
    raise InvalidLocaleData.new(filename, e.inspect)
  end
end
```

`base.rb:276-286` is the same shape for JSON (`::JSON.respond_to?(:load_file)`
-> `::JSON.load_file(filename, symbolize_names: true, freeze: true)`, `true`).

Psych 4 ships with Ruby 3.1+, and `JSON.load_file` has existed since json 2.5,
so **both probes are true in every Rails this repo targets**: real `load_yml`
returns `[data, true]` with symbolized _and deeply frozen_ data.

`packages/i18n/src/backend/base.ts` hardcodes the other arm in both methods,
returning `keys_symbolized = false` and mutable data:

- `loadYml` — `return [readYaml(readFile(filename)), false];`
- `loadJson` — `return [JSON.parse(readFile(filename)), false];`

Each carries a JSDoc line saying only the non-symbolizing, non-freezing arm
"exists here". That was written when there was no parser to probe; after #6091
the YAML parse goes through the npm `yaml` package, so the reason is stale.

Two observable consequences, not just control flow:

1. **`keys_symbolized` is inverted.** `load_file` (`base.rb:246-253`) threads
   the flag into `store_translations`' `skip_symbolize_keys`
   (`base.ts:631`, `simple.ts:94`). Rails skips the symbolize walk because the
   parser already did it; trails runs `deepSymbolizeKeys` over every loaded
   file on every load.
2. **The loaded data is not frozen.** Rails hands back a deeply frozen
   structure, so any accidental in-place mutation of translation data raises
   there and silently corrupts the store here.

## Converged shape

There is no `respond_to?` to port — JS has no two parser generations to probe
— so take the arm Rails actually takes, unconditionally, and drop the probe
along with the stale JSDoc:

- `loadYml` / `loadJson` return `[data, true]`.
- Freeze the parsed structure deeply, matching `freeze: true`.
- "Symbolized" is a no-op for the key _text_ (a Ruby Symbol is a JS string —
  see the repo rule on `":name"` strings), so the `true` is about **skipping
  the walk**, which is exactly what `skipSymbolizeKeys` already does. Confirm
  `deepSymbolizeKeys` is genuinely redundant on parser output before dropping
  it, rather than assuming it.

Note the interaction with `Simple#store_translations`: it merges into the
in-memory store, so freezing loaded data must not freeze the store's own
mutable containers. `deep_merge!` semantics on frozen inputs is the thing to
check first.

## Acceptance criteria

- `loadYml` and `loadJson` return `true` for `keys_symbolized`, matching
  `base.rb:264` and `base.rb:281`.
- Loaded translation data is deeply frozen, matching `freeze: true`.
- The stale "only the arm that neither symbolizes nor freezes exists here"
  JSDoc is removed from both methods.
- `store_translations` still merges correctly with frozen input; the existing
  `simple.test.ts` / `base.file-loading.trails.test.ts` batteries pass.
