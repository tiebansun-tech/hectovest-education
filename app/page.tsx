"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import jsPDF from "jspdf";
const downloadPDF = () => {
  const pdf = new jsPDF("p", "mm", "a4");

  let y = 20;

  // Header
  pdf.setFontSize(18);
  pdf.text("HectoVest", 20, y);
  y += 6;

  pdf.setFontSize(11);
  pdf.text("Education Planning Summary", 20, y);
  y += 10;

  pdf.setFontSize(10);
  pdf.text(
    "Funds are planned to be ready 2 years before university entry to reduce market risk.",
    20,
    y
  );
  y += 10;

  // Country
  pdf.setFontSize(11);
  pdf.text(`Country of Education: ${country}`, 20, y);
  y += 8;

  // Children
  pdf.setFontSize(12);
  pdf.text("Children Information:", 20, y);
  y += 6;

  childData.forEach((c, i) => {
    pdf.setFontSize(10);
    pdf.text(
      `- ${c.name || `Child ${i + 1}`}, Age: ${c.age}`,
      22,
      y
    );
    y += 6;
  });

  y += 6;

  // Results
  pdf.setFontSize(12);
  pdf.text("Investment Summary:", 20, y);
  y += 8;

  pdf.setFontSize(10);
  pdf.text(
    `Total Education Cost: USD ${result.totalCost.toLocaleString()}`,
    20,
    y
  );
  y += 6;

  pdf.text(
    `One-Time Investment: USD ${result.totalLump.toLocaleString()}`,
    20,
    y
  );
  y += 6;

  pdf.text(
    `Annual Investment: USD ${result.totalAnnual.toLocaleString()} / year`,
    20,
    y
  );
  y += 6;

  pdf.text(
    `Hybrid Strategy: Initial USD ${hybridInitial.toLocaleString()}, Additional USD ${result.totalHybridAnnual.toLocaleString()} / year`,
    20,
    y
  );

  y += 10;

  pdf.setFontSize(9);
  pdf.text(
    "This simulation is for planning purposes only and does not guarantee future investment returns.",
    20,
    y
  );

  pdf.save("HectoVest_Education_Planning_Summary.pdf");
};


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ================= ASSUMPTIONS ================= */
// Advisor-grade assumption:
// Funds are READY 2 years before university
const RETURN_RATE = 0.15;
const COST_GROWTH = 0.10;
const STUDY_YEARS = 4;
const UNIVERSITY_AGE = 18;
const SAFETY_BUFFER = 2;
const TARGET_AGE = UNIVERSITY_AGE - SAFETY_BUFFER; // 16

/* ================= COST DATA (USD 2025) ================= */
type Country =
  | "Indonesia"
  | "China"
  | "Singapore"
  | "Australia"
  | "United States";

const COST_2025: Record<Country, number> = {
  Indonesia: 12000,
  China: 18700,
  Singapore: 49000,
  Australia: 52000,
  "United States": 75625,
};

/* ================= CALCULATIONS ================= */
function futureEducationCost(age: number, country: Country) {
  const years = TARGET_AGE - age;
  if (years <= 0) return 0;

  const base = COST_2025[country];
  let total = 0;

  for (let i = 0; i < STUDY_YEARS; i++) {
    total += base * Math.pow(1 + COST_GROWTH, years + i);
  }
  return Math.round(total);
}

function lumpSumRequired(fv: number, age: number) {
  const n = TARGET_AGE - age;
  if (n <= 0) return 0;
  return Math.round(fv / Math.pow(1 + RETURN_RATE, n));
}

function annualRequired(fv: number, age: number) {
  const n = TARGET_AGE - age;
  if (n <= 0) return 0;
  return Math.round(
    (fv * RETURN_RATE) / (Math.pow(1 + RETURN_RATE, n) - 1)
  );
}

function hybridAnnualRequired(
  fv: number,
  age: number,
  hybridInitial: number
) {
  const n = TARGET_AGE - age;
  if (n <= 0) return 0;

  const fvInitial =
    hybridInitial * Math.pow(1 + RETURN_RATE, n);

  const remainingFV = Math.max(fv - fvInitial, 0);

  if (remainingFV === 0) return 0;

  return Math.round(
    (remainingFV * RETURN_RATE) /
      (Math.pow(1 + RETURN_RATE, n) - 1)
  );
}

/* ================= PAGE ================= */
export default function Page() {
  const [children, setChildren] = useState(1);
  const [ages, setAges] = useState<number[]>([6]);
  const [names, setNames] = useState<string[]>([""]);
  const [country, setCountry] =
    useState<Country>("United States");
  const [hybridInitial, setHybridInitial] =
    useState<number>(0);

  const childData = Array.from({ length: children }).map(
    (_, i) => ({
      age: ages[i] ?? 6,
      name: names[i] ?? "",
    })
  );

  const result = useMemo(() => {
    let totalCost = 0;
    let totalLump = 0;
    let totalAnnual = 0;
    let totalHybridAnnual = 0;

    childData.forEach((c) => {
      const fv = futureEducationCost(c.age, country);
      totalCost += fv;
      totalLump += lumpSumRequired(fv, c.age);
      totalAnnual += annualRequired(fv, c.age);
      totalHybridAnnual += hybridAnnualRequired(
        fv,
        c.age,
        hybridInitial
      );
    });

    return {
      totalCost,
      totalLump,
      totalAnnual,
      totalHybridAnnual,
    };
  }, [childData, country, hybridInitial]);

  /* ================= PDF EXPORT ================= */
 const downloadPDF = async () => {
  const element = document.getElementById("pdf-area");
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    ignoreElements: (el) => {
      // ignore elements that might cause color issues
      return el.classList?.contains("no-pdf");
    },
    onclone: (doc) => {
      // force safe colors for PDF
      const body = doc.body;
      body.style.background = "#ffffff";
      body.style.color = "#000000";
    },
  });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height =
      (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save("HectoVest_Education_Planning_Summary.pdf");
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="flex h-16 items-center px-6 gap-4">
          <Image
            src="/hectovest-logo.jpg"
            alt="HectoVest"
            width={40}
            height={40}
            priority
          />
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-slate-900">
              HectoVest
            </span>
            <span className="text-xs text-muted-foreground">
              Education Planning Dashboard
            </span>
          </div>
        </div>
      </header>

      <main
        id="pdf-area"
        className="flex-1 space-y-6 p-8 pt-6 bg-muted/40"
      >
        {/* TITLE */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Education Planning Summary
          </h2>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Funds are planned to be fully ready{" "}
            <strong>
              2 years before university entry
            </strong>{" "}
            to reduce market risk and allow transition to
            conservative instruments.
          </p>
        </div>

        <Separator />

        {/* RESULTS */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Education Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">
                USD {result.totalCost.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>One-Time Investment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">
                USD {result.totalLump.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Annual Investment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">
                USD {result.totalAnnual.toLocaleString()}
                <span className="text-sm text-muted-foreground">
                  {" "}
                  / year
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* HYBRID */}
        <Card>
          <CardHeader>
            <CardTitle>
              ⭐ Hybrid Strategy (Recommended)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="text-sm font-medium">
              Initial investment you can make today (USD)
            </label>
            <Input
              type="number"
              min={0}
              value={hybridInitial}
              onChange={(e) =>
                setHybridInitial(Number(e.target.value))
              }
            />
            <div className="text-xl font-semibold">
              Additional annual investment required:
            </div>
            <div className="text-3xl font-bold">
              USD {result.totalHybridAnnual.toLocaleString()}
              <span className="text-sm text-muted-foreground">
                {" "}
                / year
              </span>
            </div>
          </CardContent>
        </Card>

        {/* CHILD INPUT */}
        <Card>
          <CardHeader>
            <CardTitle>Children Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Slider
              value={[children]}
              min={1}
              max={5}
              step={1}
              onValueChange={(v) => {
                setChildren(v[0]);
                setAges((prev) => prev.slice(0, v[0]));
                setNames((prev) => prev.slice(0, v[0]));
              }}
            />
            <div className="text-sm">
              Number of children: {children}
            </div>

            {childData.map((c, i) => (
  <div
    key={i}
    className="border rounded-lg p-4 space-y-3 bg-white"
  >
    <div className="font-medium">
      {c.name || `Child ${i + 1}`}
    </div>

    <Input
      placeholder="Name (optional)"
      value={c.name}
      onChange={(e) => {
        const next = [...names];
        next[i] = e.target.value;
        setNames(next);
      }}
    />

    <div className="text-sm text-muted-foreground">
      Age: <strong>{c.age}</strong> years
    </div>

    <Slider
      value={[c.age]}
      min={0}
      max={17}
      step={1}
      onValueChange={(v) => {
        const next = [...ages];
        next[i] = v[0];
        setAges(next);
      }}
    />
  </div>
))}

          </CardContent>
        </Card>

        {/* COUNTRY */}
        <Card>
          <CardHeader>
            <CardTitle>Country of Education</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={country}
              onValueChange={(v) =>
                setCountry(v as Country)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(COST_2025).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Button onClick={downloadPDF}>
          Download PDF Summary
        </Button>
      </main>
    </div>
  );
}
