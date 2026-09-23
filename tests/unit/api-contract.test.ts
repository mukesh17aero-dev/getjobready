// The request plumbing every API call goes through.
//
// One place decides how a request is identified and authorised, so this is the
// one place a mistake would reach every call in the product.

import { describe, expect, it } from "vitest";
import { newRequestId, requestHeaders } from "@/lib/api";

describe("request correlation", () => {
  it("mints a fresh id each time", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newRequestId()));
    expect(ids.size).toBe(50);
  });

  it("stamps every request with one, even when nothing is passed", () => {
    expect(requestHeaders({})["X-Request-Id"]).toBeTruthy();
  });

  it("adopts a caller's id so one action can be traced end to end", () => {
    expect(requestHeaders({ requestId: "abc-123" })["X-Request-Id"]).toBe("abc-123");
  });
});

describe("what goes on the wire", () => {
  it("sends a bearer token when there is a session", () => {
    expect(requestHeaders({ token: "jwt" }).Authorization).toBe("Bearer jwt");
  });

  it("sends no Authorization header for a signed-out visitor", () => {
    for (const token of [null, undefined, ""]) {
      expect(requestHeaders({ token }).Authorization).toBeUndefined();
    }
  });

  it("only declares JSON when asked", () => {
    expect(requestHeaders({})["Content-Type"]).toBeUndefined();
    expect(requestHeaders({ json: true })["Content-Type"]).toBe("application/json");
  });

  it("passes an idempotency key through when one is given", () => {
    expect(requestHeaders({ idempotencyKey: "k1" })["Idempotency-Key"]).toBe("k1");
    expect(requestHeaders({})["Idempotency-Key"]).toBeUndefined();
  });

  it("never leaks the token into any other header", () => {
    const headers = requestHeaders({ token: "secret-jwt", json: true, idempotencyKey: "k" });
    for (const [name, value] of Object.entries(headers)) {
      if (name === "Authorization") continue;
      expect(value, name).not.toContain("secret-jwt");
    }
  });
});

describe("the audience the public pages speak to", () => {
  it("accepts only the three real audiences", async () => {
    const { AUDIENCES, isAudience } = await import("@/lib/audience");
    expect([...AUDIENCES]).toEqual(["student", "college", "employer"]);
    expect(AUDIENCES.every(isAudience)).toBe(true);
    for (const junk of ["Student", "parent", "", undefined]) {
      expect(isAudience(junk as string | undefined), String(junk)).toBe(false);
    }
  });
});
