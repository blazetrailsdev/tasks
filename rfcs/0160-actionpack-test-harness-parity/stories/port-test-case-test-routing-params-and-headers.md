---
title: "port-test-case-test-routing-params-and-headers"
status: done
updated: 2026-10-01
rfc: "0160-actionpack-test-harness-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 320
priority: null
pr: trails#8340
claim: "2026-10-01T17:12:32Z"
assignee: "port-test-case-test-routing-params-and-headers"
blocked-by: null
closed-reason: null
---

## Context

`port-test-case-test-requests-and-params` ported `TestCaseTest` from
`vendor/rails/v8.0.2/actionpack/test/controller/test_case_test.rb:223` through
`:430` (`test_multiple_calls`) and stopped there at the PR LOC ceiling. The
harness those tests need landed with it: `TestCase#setupRequest` now calls
`routes.generateExtras` and `TestRequest#assignParameters`
(`action_controller/test_case.rb:598-617`), `assignParameters` encodes with
`toQuery` (`test_case.rb:107,127,130`), and the test file has a `TestCaseTest`
subclass whose `setup` mirrors `test_case_test.rb:201-211`.

What is left of the story's range is `:431-749`, in
`packages/actionpack/src/action-controller/controller/test-case.test.ts`:

- `test_should_impose_childless_html_tags_in_html` (`:431`) and
  `test_should_not_impose_childless_html_tags_in_xml` (`:444`) — `assert_select`,
  blocked on `action-controller-test-case-has-no-assert-select`.
- `test_assert_generates` (`:451`), `test_assert_routing` (`:459`),
  `..._with_method` (`:463`), `..._in_module` (`:470`), `..._with_glob` (`:482`).
  The four `assert_routing` tests recognize paths whose controllers come from
  `vendor/rails/v8.0.2/actionpack/test/lib/controller/fake_controllers.rb`
  (`ContentController`, `Admin::UserController`, `PagesController`), which is not
  ported. It belongs at
  `packages/actionpack/src/test-helpers/controller/fake-controllers.ts`, each class
  registered in `controllerConstants` under its underscored path.
- `test_params_passing` (`:489`) through `test_xhr_with_params` (`:749`): the
  params, header, `as: :json`, content-type and path-parameter tests.
  `TestController` needs `testRequestParameters` (`:69`) and `testHeaders`
  (`:89`) added. `test_headers` is `JSON.dump(request.headers.env)`; the env holds
  the controller under `action_controller.instance`, so the port needs Ruby
  JSON's `to_s` fallback for a non-JSON object rather than a bare
  `JSON.stringify`.
- `"blank Content-Type header"` (`:623`) is blocked on
  `mime-type-initialize-validates-mime-regexp`: `MimeType.lookup("")` returns a
  type where `Mime::Type.new` raises `InvalidMimeType`
  (`action_dispatch/http/mime_type.rb:264-266`).
- Three tests in this range already sit in the file out of Rails order with
  weaker bodies: `using as json sets request content type to json`,
  `using as json sets format json`, and a skipped
  `using as json with path parameters`. They are replaced, not duplicated.

Every test below was written against the converged harness and passed locally
(with the one `it.skip` noted), with `fake-controllers.ts` in place. It is the
body this story ships, in Rails order, between `multiple calls` and
`with routing places routes back`:

```ts
// BLOCKED: action-controller-test-case-has-no-assert-select
it.skip("should impose childless html tags in html", () => {});

// BLOCKED: action-controller-test-case-has-no-assert-select
it.skip("should not impose childless html tags in xml", () => {});

it("assert generates", () => {
  tc.assertGenerates("controller/action/5", {
    controller: "controller",
    action: "action",
    id: "5",
  });
  tc.assertGenerates(
    "controller/action/7",
    { id: "7" },
    { controller: "controller", action: "action" },
  );
  tc.assertGenerates(
    "controller/action/5",
    { controller: "controller", action: "action", id: "5", name: "bob" },
    {},
    { name: "bob" },
  );
  tc.assertGenerates(
    "controller/action/7",
    { id: "7", name: "bob" },
    { controller: "controller", action: "action" },
    { name: "bob" },
  );
  tc.assertGenerates(
    "controller/action/7",
    { id: "7" },
    { controller: "controller", action: "action", name: "bob" },
    {},
  );
});

it("assert routing", () => {
  tc.assertRouting("content", { controller: "content", action: "index" });
});

it("assert routing with method", () => {
  tc.withRouting((set: RouteSet) => {
    set.draw(function () {
      this.resources("content");
    });
    tc.assertRouting(
      { method: "post", path: "content" },
      { controller: "content", action: "create" },
    );
  });
});

it("assert routing in module", () => {
  tc.withRouting((set: RouteSet) => {
    set.draw(function () {
      this.namespace("admin", () => {
        this.get("user", { to: "user#index" });
      });
    });

    tc.assertRouting("admin/user", { controller: "admin/user", action: "index" });
  });
});

it("assert routing with glob", () => {
  tc.withRouting((set: RouteSet) => {
    set.draw(function () {
      this.get("*path", { to: "pages#show" });
    });
    tc.assertRouting("/company/about", {
      controller: "pages",
      action: "show",
      path: "company/about",
    });
  });
});

it("params passing", async () => {
  await tc.get("testParams", {
    params: { page: { name: "Page name", month: "4", year: "2004", day: "6" } },
  });
  const parsedParams = JSON.parse(tc.response.body);
  assertEqual(
    { ...controllerInfo, page: { name: "Page name", month: "4", year: "2004", day: "6" } },
    parsedParams,
  );
});

it("nil params", async () => {
  await tc.get("testParams", { params: null });
  const parsedParams = JSON.parse(tc.response.body);
  assertEqual({ action: "testParams", controller: "test_case_test/test" }, parsedParams);
});

it("query param named action", async () => {
  await tc.get("testQueryParameters", { params: { action: "foobar" } });
  const parsedParams = JSON.parse(tc.response.body);
  assertEqual({ action: "foobar" }, parsedParams);
});

it("request param named action", async () => {
  await tc.post("testRequestParameters", { params: { action: "foobar" } });
  const parsedParams = JSON.parse(tc.response.body);
  assertEqual({ action: "foobar" }, parsedParams);
});

it("kwarg params passing with session and flash", async () => {
  await tc.get("testParams", {
    params: { page: { name: "Page name", month: "4", year: "2004", day: "6" } },
    session: { foo: "bar" },
    flash: { notice: "created" },
  });

  const parsedParams = JSON.parse(tc.response.body);
  assertEqual(
    { ...controllerInfo, page: { name: "Page name", month: "4", year: "2004", day: "6" } },
    parsedParams,
  );

  assertEqual("bar", tc.session.get("foo"));
  assertEqual("created", tc.flash.get("notice"));
});

it("params passing with integer", async () => {
  await tc.get("testParams", {
    params: { page: { name: "Page name", month: 4, year: 2004, day: 6 } },
  });
  const parsedParams = JSON.parse(tc.response.body);
  assertEqual(
    { ...controllerInfo, page: { name: "Page name", month: "4", year: "2004", day: "6" } },
    parsedParams,
  );
});

it("params passing with integers when not html request", async () => {
  await tc.get("testParams", { params: { format: "json", count: 999 } });
  const parsedParams = JSON.parse(tc.response.body);
  assertEqual({ ...controllerInfo, format: "json", count: "999" }, parsedParams);
});

it("params passing path parameter is string when not html request", async () => {
  await tc.get("testParams", { params: { format: "json", id: 1 } });
  const parsedParams = JSON.parse(tc.response.body);
  assertEqual({ ...controllerInfo, format: "json", id: "1" }, parsedParams);
});

it("params passing with frozen values", async () => {
  await assertNothingRaised(async () => {
    await tc.get("testParams", {
      params: {
        frozen: "icy",
        frozens: Object.freeze(["icy"]),
        deepfreeze: Object.freeze({ frozen: "icy" }),
      },
    });
  });
  const parsedParams = JSON.parse(tc.response.body);
  assertEqual(
    { ...controllerInfo, frozen: "icy", frozens: ["icy"], deepfreeze: { frozen: "icy" } },
    parsedParams,
  );
});

it("params passing doesnt modify in place", async () => {
  const page = { name: "Page name", month: 4, year: 2004, day: 6 };
  await tc.get("testParams", { params: { page } });
  assertEqual(2004, page.year);
});

it("set additional HTTP headers", async () => {
  tc.request.headers.set("Referer", "http://nohost.com/home");
  tc.request.headers.set("Content-Type", "application/rss+xml");
  await tc.get("testHeaders");
  const parsedEnv = ActiveSupportJSON.decode(tc.response.body) as Record<string, unknown>;
  assertEqual("http://nohost.com/home", parsedEnv["HTTP_REFERER"]);
  assertEqual("application/rss+xml", parsedEnv["CONTENT_TYPE"]);
});

it("set additional env variables", async () => {
  tc.request.headers.set("HTTP_REFERER", "http://example.com/about");
  tc.request.headers.set("CONTENT_TYPE", "application/json");
  await tc.get("testHeaders");
  const parsedEnv = ActiveSupportJSON.decode(tc.response.body) as Record<string, unknown>;
  assertEqual("http://example.com/about", parsedEnv["HTTP_REFERER"]);
  assertEqual("application/json", parsedEnv["CONTENT_TYPE"]);
});

// BLOCKED: mime-type-initialize-validates-mime-regexp
it.skip("blank Content-Type header", async () => {
  tc.request.headers.set("Content-Type", "");
  await assertRaises([InvalidType], {}, async () => {
    await tc.get("testHeaders");
  });
});

it("nil Content-Type header with post request", async () => {
  tc.request.headers.set("Content-Type", null);
  await assertRaises([Error], { match: /Unknown Content-Type/ }, async () => {
    await tc.post("renderBody");
  });
});

it("using as json sets request content type to json", async () => {
  await tc.post("renderBody", {
    params: { bool_value: true, str_value: "string", num_value: 2 },
    as: "json",
  });

  assertEqual("application/json", tc.request.headers.get("CONTENT_TYPE"));
  assertEqual(true, tc.request.requestParameters["bool_value"]);
  assertEqual("string", tc.request.requestParameters["str_value"]);
  assertEqual(2, tc.request.requestParameters["num_value"]);
});

it("using as json sets format json", async () => {
  await tc.post("renderBody", {
    params: { bool_value: true, str_value: "string", num_value: 2 },
    as: "json",
  });
  assertEqual("json", tc.request.format);
});

it("using as json with empty params", async () => {
  await tc.post("testParams", { params: { foo: { bar: [] } }, as: "json" });

  assertEqual({ bar: [] }, JSON.parse(tc.response.body)["foo"]);
});

it("using as json with path parameters", async () => {
  await tc.post("testParams", { params: { id: "12345" }, as: "json" });

  assertEqual("12345", tc.request.pathParameters["id"]);
});

it("mutating content type headers for plain text files sets the header", async () => {
  tc.request.headers.set("Content-Type", "text/plain");
  await tc.post("renderBody", { params: { name: "foo.txt" } });

  assertEqual("text/plain", tc.request.headers.get("Content-type"));
  assertEqual("foo.txt", tc.request.requestParameters["name"]);
  assertEqual("renderBody", tc.request.pathParameters["action"]);
});

it("mutating content type headers for html files sets the header", async () => {
  tc.request.headers.set("Content-Type", "text/html");
  await tc.post("renderBody", { params: { name: "foo.html" } });

  assertEqual("text/html", tc.request.headers.get("Content-type"));
  assertEqual("foo.html", tc.request.requestParameters["name"]);
  assertEqual("renderBody", tc.request.pathParameters["action"]);
});

it("mutating content type headers for non registered mime type raises an error", async () => {
  await assertRaises([Error], {}, async () => {
    tc.request.headers.set("Content-Type", "type/fake");
    await tc.post("renderBody", { params: { name: "foo.fake" } });
  });
});

it("id converted to string", async () => {
  await tc.get("testParams", { params: { id: 20, foo: new Object() } });
  assertEqual("string", typeof tc.request.pathParameters["id"]);
});

it("array path parameter handled properly", async () => {
  await tc.withRouting(async (set: RouteSet) => {
    set.draw(function () {
      this.get("file/*path", { to: "test_case_test/test#testParams" });

      deprecator().silence(() => {
        this.get(":controller/:action");
      });
    });

    await tc.get("testParams", { params: { path: ["hello", "world"] } });
    assertEqual(["hello", "world"], tc.request.pathParameters["path"]);
    assertEqual("hello/world", toParam(tc.request.pathParameters["path"]));
  });
});

it("assert realistic path parameters", async () => {
  await tc.get("testParams", { params: { id: 20, foo: new Object() } });

  for (const key of Object.keys(tc.request.pathParameters)) {
    assertEqual("string", typeof key);
  }
});

it("with routing places routes back", () => {
  assert(tc.routes);
  const routesId = rbObjId(tc.routes!);

  try {
    tc.withRouting(() => {
      throw new Error("fail");
    });
    throw new Error("Should not be here.");
  } catch (e) {
    if (!(e instanceof Error) || e instanceof Assertion) throw e;
  }

  assert(tc.routes);
  assertEqual(routesId, rbObjId(tc.routes!));
});

it("remote addr", async () => {
  await tc.get("testRemoteAddr");
  assertEqual("0.0.0.0", tc.response.body);

  tc.request.remoteAddr = "192.0.0.1";
  await tc.get("testRemoteAddr");
  assertEqual("192.0.0.1", tc.response.body);
});

it("header properly reset after remote http request", async () => {
  await tc.get("testParams", { xhr: true });
  assertNil(tc.request.env["HTTP_X_REQUESTED_WITH"]);
  assertNil(tc.request.env["HTTP_ACCEPT"]);
});

it("xhr with params", async () => {
  await tc.get("testParams", { params: { id: 1 }, xhr: true });

  assertEqual({ id: "1", ...controllerInfo }, JSON.parse(tc.response.body));
});
```

It needs these imports beyond what the file has: `ActiveSupportJSON`,
`assertNothingRaised`, `assertRaises`, `isPlainObject`, `toParam` from
`@blazetrails/activesupport`, and `InvalidType` from
`action-dispatch/http/mime-negotiation.js`. The two `TestController` actions:

```ts
  async testRequestParameters() {
    await this.render({ plain: JSON.stringify(this.request.requestParameters) });
  }

  async testHeaders() {
    await this.render({
      plain: JSON.stringify(this.request.headers.env, (_key, value) =>
        value === null || typeof value !== "object" || Array.isArray(value) || isPlainObject(value)
          ? value
          : String(value),
      ),
    });
  }
```

## Acceptance criteria

- `fake_controllers.rb` is ported to
  `test-helpers/controller/fake-controllers.ts` and imported by
  `test-case.test.ts`.
- Every `TestCaseTest` test between `:431` and `:749` is ported in Rails order
  under the top-level `describe("TestCaseTest")`, replacing the three
  out-of-order `using as json` tests. The `with routing places routes back`,
  `remote addr` and `header properly reset after remote http request` bodies
  move to `assert*` helpers one-to-one with Rails.
- No test is renamed. A test whose blocker is still open stays `it.skip` under a
  `// BLOCKED: <story-id>` comment.
