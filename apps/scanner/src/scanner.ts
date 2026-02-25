import { CommonHeuristicsScanner, createZipBombGuard, composeScanners } from "pompelmi";

export const scanner = composeScanners(
  [
    [
      "zipGuard",
      createZipBombGuard({
        maxEntries: 512,
        maxTotalUncompressedBytes: 200 * 1024 * 1024,
        maxCompressionRatio: 12,
      }),
    ],
    ["heuristics", CommonHeuristicsScanner],
  ],
  {
    parallel: false,
    stopOn: "malicious",
    timeoutMsPerScanner: 5000,
    tagSourceName: true,
  }
);
