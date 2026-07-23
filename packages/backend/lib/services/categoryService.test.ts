import { describe, it, expect, vi, beforeEach } from "vitest";
import { categoryService } from "./categoryService";
import { db } from "../db";

vi.mock("../db", () => ({
  db: {
    category: {
      findMany: vi.fn(),
    },
  },
}));

const findMany = vi.mocked(db.category.findMany);

describe("categoryService.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all categories ordered by name", async () => {
    findMany.mockResolvedValue([
      {
        id: "1",
        name: "AI / Machine Learning",
        slug: "ai-ml",
        description: "AI tools",
      },
      {
        id: "2",
        name: "Developer Tools",
        slug: "developer-tools",
        description: "CLIs and more",
      },
    ] as never);

    const result = await categoryService.list();

    expect(findMany).toHaveBeenCalledWith({ orderBy: { name: "asc" } });
    expect(result).toEqual([
      {
        id: "1",
        name: "AI / Machine Learning",
        slug: "ai-ml",
        description: "AI tools",
      },
      {
        id: "2",
        name: "Developer Tools",
        slug: "developer-tools",
        description: "CLIs and more",
      },
    ]);
  });
});
