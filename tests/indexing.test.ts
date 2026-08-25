import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Agent Indexing Documentation", () => {
  const rootDir = process.cwd();

  it("should have AGENTS.md with mandatory agent indexing sections", () => {
    const agentsPath = path.join(rootDir, "AGENTS.md");
    expect(fs.existsSync(agentsPath)).toBe(true);
    const content = fs.readFileSync(agentsPath, "utf8");
    expect(content).toContain("# AGENTS.md — FLOPY.SPACE Autonomous Agent Index");
    expect(content).toContain("## 1. Codebase Architecture & Systems Map");
    expect(content).toContain("## 2. Resource Directory Index");
    expect(content).toContain("## 3. Engineering Invariants & Performance Budget");
    expect(content).toContain("## 4. Development & Testing Commands");
  });

  it("should have GEMINI.md tailored for Gemini CLI and IDE workflows", () => {
    const geminiPath = path.join(rootDir, "GEMINI.md");
    expect(fs.existsSync(geminiPath)).toBe(true);
    const content = fs.readFileSync(geminiPath, "utf8");
    expect(content).toContain("# GEMINI.md — FLOPY.SPACE Guidelines");
    expect(content).toContain("## Key Workflows");
    expect(content).toContain("## Architecture Summary");
  });

  it("should have CLAUDE.md pointing or symlinked to AGENTS.md", () => {
    const claudePath = path.join(rootDir, "CLAUDE.md");
    expect(fs.existsSync(claudePath)).toBe(true);
    const stat = fs.lstatSync(claudePath);
    if (stat.isSymbolicLink()) {
      const target = fs.readlinkSync(claudePath);
      expect(target).toMatch(/AGENTS\.md/);
    } else {
      const content = fs.readFileSync(claudePath, "utf8");
      expect(content.length).toBeGreaterThan(0);
    }
  });
});
