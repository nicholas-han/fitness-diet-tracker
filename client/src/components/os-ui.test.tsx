import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CheckRow, Metric, PageHeader, ProgressBar, Section } from "./os-ui";

describe("OS UI primitives", () => {
  it("renders hierarchy and metric content for server/static output", () => {
    const html = renderToStaticMarkup(<Section title="Body"><Metric label="Weight" value="76 kg" detail="7-day average" /></Section>);
    expect(html).toContain("Body");
    expect(html).toContain("76 kg");
    expect(html).toContain("7-day average");
  });

  it("keeps progress width bounded and exposes page headings", () => {
    const html = renderToStaticMarkup(<><PageHeader eyebrow="Test" title="Dashboard" /><ProgressBar value={150} max={100} /></>);
    expect(html).toContain("Dashboard");
    expect(html).toContain("width:100%");
  });

  it("renders a keyboard-usable checklist control", () => {
    const html = renderToStaticMarkup(<CheckRow checked onChange={() => undefined}>Milk</CheckRow>);
    expect(html).toContain("<button");
    expect(html).toContain("Milk");
  });
});
