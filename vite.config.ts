// KashifWeb design reminder: static local-first workspace; development configuration exists only for safe previewing.
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/",
  server: {
    allowedHosts: ["5173-ifah2qwuv8kbtdz41tpie-a577ee3b.sg1.manus.computer", "5174-ifah2qwuv8kbtdz41tpie-a577ee3b.sg1.manus.computer"],
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
});
