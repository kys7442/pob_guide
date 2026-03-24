"use client";

export default function SpeculationRules() {
  const rules = JSON.stringify({
    prefetch: [
      {
        where: {
          and: [
            { href_matches: "/*" },
            { not: { href_matches: "/api/*" } },
          ],
        },
        eagerness: "moderate",
      },
    ],
  });

  return (
    <script
      type="speculationrules"
      dangerouslySetInnerHTML={{ __html: rules }}
    />
  );
}
