import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSeries, sparklinePath } from "../src/sparkline";

test("buildSeries is deterministic for a given seed", () => {
  const a = buildSeries(7, 2.5);
  const b = buildSeries(7, 2.5);
  assert.deepEqual(a, b);
});

test("buildSeries respects the requested length", () => {
  assert.equal(buildSeries(1, 0).length, 28); // default
  assert.equal(buildSeries(1, 0, 40).length, 40);
});

test("different seeds produce different series", () => {
  assert.notDeepEqual(buildSeries(1, 1), buildSeries(2, 1));
});

test("sparklinePath projects points and builds line + area paths", () => {
  const geo = sparklinePath(buildSeries(3, 1.5));
  assert.equal(geo.points.length, 28);
  assert.equal(geo.width, 100);
  assert.equal(geo.height, 34);
  assert.ok(geo.line.startsWith("M"));
  assert.ok(geo.area.endsWith("Z"));
  assert.ok(geo.length > 0);
});

test("sparklinePath honours custom viewport options", () => {
  const geo = sparklinePath([1, 2, 3], { w: 200, h: 50, pad: 0 });
  assert.equal(geo.width, 200);
  assert.equal(geo.height, 50);
  // first x at pad (0), last x at width
  assert.equal(geo.points[0]![0], 0);
  assert.equal(geo.points[2]![0], 200);
});

test("sparklinePath handles an empty series safely", () => {
  const geo = sparklinePath([]);
  assert.deepEqual(geo.points, []);
  assert.equal(geo.line, "");
  assert.equal(geo.area, "");
  assert.equal(geo.length, 0);
});

test("sparklinePath maps the max value to the top (min y)", () => {
  // ascending series: last point is the max → smallest y (top of the box)
  const geo = sparklinePath([1, 2, 3, 4], { pad: 0 });
  const ys = geo.points.map((p) => p[1]);
  assert.equal(Math.min(...ys), geo.points[3]![1]);
});
