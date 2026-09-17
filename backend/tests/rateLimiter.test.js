import express from "express";
import request from "supertest";
import { createJsonRateLimiter } from "../utils/rateLimiter.js";

test("rate limit responses are JSON with the standard message", async () => {
  const app = express();
  app.use(createJsonRateLimiter({ windowMs: 60_000, max: 1 }));
  app.get("/limited", (_req, res) => res.json({ ok: true }));

  expect((await request(app).get("/limited")).status).toBe(200);
  const limited = await request(app).get("/limited");
  expect(limited.status).toBe(429);
  expect(limited.headers["content-type"]).toMatch(/application\/json/);
  expect(limited.body).toEqual({ message: "Too many requests. Please try again later." });
});
