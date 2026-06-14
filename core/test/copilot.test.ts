import { test } from "node:test";
import assert from "node:assert/strict";
import { copilotReply, parseSend, COPILOT_SUGGESTIONS } from "../src/copilot";
import { DEMO_TOKENS, DEMO_DIRECTORY, DEMO_HISTORY } from "../src/demo-data";

const ctx = { tokens: DEMO_TOKENS, history: DEMO_HISTORY, directory: DEMO_DIRECTORY };

test("suggestions exist", () => {
  assert.ok(COPILOT_SUGGESTIONS.length >= 4);
});

test("portfolio worth answer", () => {
  const r = copilotReply("what's my portfolio worth?", ctx);
  assert.match(r.html, /worth/i);
});

test("scam check flags the drainer", () => {
  const r = copilotReply("is claim-airdrop.lumen safe?", ctx);
  assert.match(r.html, /Do not send/i);
});

test("parseSend understands a fiat send", () => {
  const intent = parseSend("send $50 of eth to alice", DEMO_TOKENS);
  assert.ok(intent);
  assert.equal(intent!.token.sym, "ETH");
  assert.equal(intent!.recipient, "alice.lumen");
  assert.equal(intent!.fiat, 50);
});

test("send intent returns a /send route action", () => {
  const r = copilotReply("send 0.2 btc to bob.lumen", ctx);
  assert.equal(r.action?.route, "/send");
  assert.equal(r.action?.prefill?.sym, "BTC");
});

test("help lists capabilities", () => {
  const r = copilotReply("what can you do?", ctx);
  assert.match(r.html, /Portfolio/i);
});
