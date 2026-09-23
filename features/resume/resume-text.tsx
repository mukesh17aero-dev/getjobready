"use client";

// Small text helpers shared across the resume feature.

export const splitList = (value: unknown): string[] =>
  typeof value === "string"
    ? value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
