import chai from "chai";
import fs from "fs";
import { JsonReader } from "kryo/readers/json";
import sysPath from "path";
import { $Movie, Movie } from "swf-tree/movie";
import { swfMerge } from "../lib";
import meta from "./meta.js";

const JSON_READER: JsonReader = new JsonReader();

describe("swfMerge", function () {
  it("merges the samples", async function () {
    const base: Movie = $Movie.read(JSON_READER, await readText(sysPath.join(meta.dirname, "base.json")));
    const extra: Movie = $Movie.read(JSON_READER, await readText(sysPath.join(meta.dirname, "extra.json")));
    const expectedMerged: Movie = $Movie.read(JSON_READER, await readText(sysPath.join(meta.dirname, "merged.json")));
    const actualMerged: Movie = swfMerge(base, extra);
    chai.assert.deepEqual(actualMerged, expectedMerged);
    // chai.assert.isTrue($Movie.equals(actualMerged, expectedMerged));
  });
});

async function readText(filePath: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(filePath, {encoding: "UTF-8"}, (err, data) => {
      if (err !== null) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}
