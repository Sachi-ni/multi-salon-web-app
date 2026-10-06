import request from "supertest";
import app from "./testApp.js";

test("security headers coexist with CORS on API responses", async () => {
  const response = await request(app)
    .get("/api/auth/profile")
    .set("Origin", "http://localhost:3000");

  expect(response.status).toBe(401);
  expect(response.headers["x-content-type-options"]).toBe("nosniff");
  expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
  expect(response.headers["content-security-policy"]).toContain("default-src 'self'");
  expect(response.headers["cross-origin-resource-policy"]).toBe("cross-origin");
  expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  expect(response.headers["access-control-allow-credentials"]).toBe("true");
});

test("the production frontend origin remains allowed", async () => {
  const origin = "https://multi-salon-web-app.vercel.app";
  const response = await request(app)
    .get("/api/auth/profile")
    .set("Origin", origin);

  expect(response.status).toBe(401);
  expect(response.headers["access-control-allow-origin"]).toBe(origin);
  expect(response.headers["access-control-allow-credentials"]).toBe("true");
});

test("an unlisted Vercel origin is rejected", async () => {
  const response = await request(app)
    .get("/api/auth/profile")
    .set("Origin", "https://untrusted-preview.vercel.app");

  expect(response.status).toBe(403);
  expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  expect(response.headers["access-control-allow-credentials"]).toBeUndefined();
});