import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { createClient } from "@supabase/supabase-js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, Save, CreditCard, Sparkles, Loader2, ShieldCheck, LogOut, RefreshCcw, Lock } from "lucide-react";

const supabase = createClient(
  "https://pcxfcjzstnujnyksmznm.supabase.co",
  "sb_publishable_4Szh2ocNJ-2SEY7fzt90cw__hxYDo-R"
);

const APP_CONFIG = {
  apiBaseUrl: "https://your-api.com",
  proReportLimit: 100,
  freeReportLimit: 3,
};

const defaultScenario = {
  name: "Current",
  leads: 40,
  conversion: 35,
  packageValue: 2500,
  openDates: 3,
  followUpScore: 2,
  repeatRate: 10,
};

function currency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function calculateScenario(s: typeof defaultScenario) {
  const bookings = s.leads * (s.conversion / 100);
  const revenue = bookings * s.packageValue;
  const conversionLeak = Math.max(0, 50 - s.conversion) * 0.01 * s.leads * s.packageValue;
  const openDateLeak = s.openDates * s.packageValue;
  const leak = conversionLeak + openDateLeak;
  const potential = revenue + leak;
  return { ...s, bookings, revenue, conversionLeak, openDateLeak, leak, potential };
}

type ReportRow = {
  id: string;
  email: string;
  revenue: number;
  potential: number;
  leak: number;
  ai_summary?: string;
  created_at: string;
};

function buildAiPrompt(calc: ReturnType<typeof calculateScenario>) {
  return `You are a celebration business revenue strategist for event halls.
Analyze this event hall monthly snapshot and return a concise strategy report.

Inputs:
- Leads: ${calc.leads}
- Conversion Rate: ${calc.conversion}%
- Average Package Value: ${calc.packageValue}
- Open Dates: ${calc.openDates}
- Current Revenue: ${calc.revenue}
- Revenue Leak: ${calc.leak}
- Potential Revenue: ${calc.potential}

Return exactly these sections:
1. Biggest Revenue Leak
2. Monthly Loss Estimate
3. 3 Prioritized Actions
4. Fastest Win
5. Premium Offer Suggestion

Keep it practical, consultant-level, and focused on event halls.`;
}

async function generateAiRecommendations(calc: ReturnType<typeof calculateScenario>) {
  const response = await fetch(`${APP_CONFIG.apiBaseUrl}/ai/recommendations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: buildAiPrompt(calc),
      metrics: calc,
    }),
  });

  if (!response.ok) {
    throw new Error("AI request failed");
  }

  const data = await response.json();
  return data.output_text || "AI recommendations unavailable.";
}

async function createCheckoutSession(email: string) {
  const response = await fetch(`${APP_CONFIG.apiBaseUrl}/billing/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, plan: "pro" }),
  });

  if (!response.ok) {
    throw new Error("Checkout session failed");
  }

  const data = await response.json();
  if (data.url) window.location.href = data.url;
}

async function getSubscriptionStatus(email: string) {
  const response = await fetch(`${APP_CONFIG.apiBaseUrl}/billing/subscription-status?email=${encodeURIComponent(email)}`);
  if (!response.ok) {
    return { plan: "free" };
  }
  return response.json();
}

function exportPdf(report: {
  email: string;
  calc: ReturnType<typeof calculateScenario>;
  aiSummary: string;
}) {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("Event Hall Revenue Audit Report", 14, 18);
  doc.setFontSize(11);
  doc.text(`Lead: ${report.email}`, 14, 28);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

  autoTable(doc, {
    startY: 42,
    head: [["Metric", "Value"]],
    body: [
      ["Monthly Leads", String(report.calc.leads)],
      ["Conversion Rate", `${report.calc.conversion}%`],
      ["Average Package", currency(report.calc.packageValue)],
      ["Revenue", currency(report.calc.revenue)],
      ["Leak", currency(report.calc.leak)],
      ["Potential Revenue", currency(report.calc.potential)],
    ],
  });

  const split = doc.splitTextToSize(report.aiSummary, 180);
  const finalY = (doc as any).lastAutoTable.finalY || 90;
  doc.text("AI Strategy Recommendations", 14, finalY + 12);
  doc.setFontSize(10);
  doc.text(split, 14, finalY + 20);
  doc.save("event-hall-revenue-audit.pdf");
}

function featureAllowed(plan: "free" | "pro", feature: "ai" | "pdf" | "save") {
  if (plan === "pro") return true;
  return feature === "save";
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [current, setCurrent] = useState(defaultScenario);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [billingStatus, setBillingStatus] = useState<"free" | "pro">("free");
  const [isCheckingBilling, setIsCheckingBilling] = useState(false);
  const [status, setStatus] = useState("");

  const calc = useMemo(() => calculateScenario(current), [current]);

  const login = async () => {
    await supabase.auth.signInWithOtp({ email });
    setStatus("Magic link sent. Check your email.");
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user?.email) setEmail(data.user.email);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user?.email) setEmail(session.user.email);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.email) {
      loadReports(user.email);
      refreshSubscription(user.email);
    }
  }, [user]);

  async function refreshSubscription(userEmail: string) {
    setIsCheckingBilling(true);
    try {
      const data = await getSubscriptionStatus(userEmail);
      setBillingStatus(data.plan === "pro" ? "pro" : "free");
    } catch {
      setBillingStatus("free");
    } finally {
      setIsCheckingBilling(false);
    }
  }

  async function loadReports(userEmail: string) {
    const { data } = await supabase
      .from("reports")
      .select("*")
      .eq("email", userEmail)
      .order("created_at", { ascending: false });
    setReports((data as ReportRow[]) || []);
  }

  async function handleGenerateAi() {
    setIsGeneratingAi(true);
    setStatus("");
    try {
      const text = await generateAiRecommendations(calc);
      setAiSummary(text);
      setStatus("AI recommendations generated.");
    } catch (e) {
      setStatus("AI generation failed. Check your API setup.");
    } finally {
      setIsGeneratingAi(false);
    }
  }

  async function saveReport() {
    if (!user?.email) {
      setStatus("Login first.");
      return;
    }

    if (!featureAllowed(billingStatus, "save") && reports.length >= APP_CONFIG.freeReportLimit) {
      setStatus("Free plan report limit reached. Upgrade to Pro.");
      return;
    }

    setIsSaving(true);
    setStatus("");
    try {
      const { error } = await supabase.from("reports").insert([
        {
          email: user.email,
          revenue: calc.revenue,
          potential: calc.potential,
          leak: calc.leak,
          ai_summary: aiSummary,
          created_at: new Date().toISOString(),
        },
      ]);
      if (error) throw error;
      await loadReports(user.email);
      setStatus("Report saved.");
    } catch {
      setStatus("Could not save report.");
    } finally {
      setIsSaving(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setReports([]);
    setBillingStatus("free");
    setAiSummary("");
    setStatus("Logged out.");
  }

  async function handleUpgrade() {
    try {
      await createCheckoutSession(email);
    } catch {
      setStatus("Stripe checkout setup failed.");
    }
  }

  const chartData = [
    { name: "Revenue", amount: calc.revenue },
    { name: "Leak", amount: calc.leak },
    { name: "Potential", amount: calc.potential },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge>Phase 4</Badge>
            <Badge variant="secondary">PDF + Stripe + AI</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Event Hall Revenue SaaS</h1>
          <p className="mt-2 text-sm text-muted-foreground">Monetized calculator with report export, AI strategy output, and upgrade path.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!user && (
            <>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-[240px]" />
              <Button onClick={login}>Login</Button>
            </>
          )}
          {user && <Badge variant="outline">Logged in as {user.email}</Badge>}
          <Badge variant={billingStatus === "pro" ? "default" : "secondary"}>{billingStatus === "pro" ? "Pro Plan" : "Free Plan"}</Badge>
          {user && (
            <Button variant="outline" onClick={() => refreshSubscription(user.email)} disabled={isCheckingBilling}>
              {isCheckingBilling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}Refresh Plan
            </Button>
          )}
          {user && (
            <Button variant="outline" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />Logout
            </Button>
          )}
        </div>
      </div>

      {status && <div className="rounded-xl border bg-slate-50 p-3 text-sm">{status}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">Revenue</div><div className="mt-2 text-2xl font-semibold">{currency(calc.revenue)}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">Leak</div><div className="mt-2 text-2xl font-semibold">{currency(calc.leak)}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">Potential</div><div className="mt-2 text-2xl font-semibold">{currency(calc.potential)}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="calculator" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="ai">AI Strategy</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Calculator</CardTitle>
              <CardDescription>Model revenue, leak, and upside for an event hall.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Leads: {current.leads}</Label>
                <Slider value={[current.leads]} max={150} onValueChange={(v) => setCurrent({ ...current, leads: v[0] })} />
              </div>
              <div>
                <Label>Conversion: {current.conversion}%</Label>
                <Slider value={[current.conversion]} max={100} onValueChange={(v) => setCurrent({ ...current, conversion: v[0] })} />
              </div>
              <div>
                <Label>Average Package: {currency(current.packageValue)}</Label>
                <Slider value={[current.packageValue]} min={500} max={10000} step={100} onValueChange={(v) => setCurrent({ ...current, packageValue: v[0] })} />
              </div>
              <div>
                <Label>Open Dates: {current.openDates}</Label>
                <Slider value={[current.openDates]} max={12} onValueChange={(v) => setCurrent({ ...current, openDates: v[0] })} />
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(v: number) => currency(v)} />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations Engine</CardTitle>
              <CardDescription>Generate a consultant-style strategy report from the active scenario. AI and PDF export are gated to Pro.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleGenerateAi} disabled={isGeneratingAi || !featureAllowed(billingStatus, "ai")}>
                  {isGeneratingAi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : featureAllowed(billingStatus, "ai") ? <Sparkles className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                  Generate AI Strategy
                </Button>
                <Button variant="outline" onClick={() => exportPdf({ email, calc, aiSummary })} disabled={!aiSummary || !featureAllowed(billingStatus, "pdf")}>
                  <Download className="mr-2 h-4 w-4" /> Export PDF
                </Button>
                <Button onClick={saveReport} disabled={isSaving || !user}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Report
                </Button>
              </div>
              <Separator />
              <div className="min-h-[260px] rounded-xl border bg-slate-50 p-4 text-sm whitespace-pre-wrap">
                {featureAllowed(billingStatus, "ai")
                  ? aiSummary || "Generate AI recommendations to populate the strategy report."
                  : "Upgrade to Pro to unlock AI recommendations and PDF exports."}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Saved Reports</CardTitle>
              <CardDescription>Stored in Supabase and available after login.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reports.length === 0 && <div className="text-sm text-muted-foreground">No saved reports yet.</div>}
              {reports.map((r) => (
                <div key={r.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium">{currency(r.revenue)} → {currency(r.potential)}</div>
                      <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                    </div>
                    <Badge variant="outline">Leak {currency(r.leak)}</Badge>
                  </div>
                  {r.ai_summary && <div className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{r.ai_summary}</div>}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Stripe Upgrade Path</CardTitle>
              <CardDescription>Use this tab to gate premium features, sync subscription status, and send users into checkout.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <div className="font-medium">Free</div>
                  <div className="mt-2 text-sm text-muted-foreground">Calculator access, preview metrics, limited saved history.</div>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="font-medium">Pro</div>
                  <div className="mt-2 text-sm text-muted-foreground">AI strategy engine, PDF export, saved reports, premium audit workflow, and subscription sync.</div>
                </div>
              </div>
              <Button onClick={handleUpgrade}>
                <CreditCard className="mr-2 h-4 w-4" /> Upgrade to Pro
              </Button>
              <div className="rounded-xl border bg-slate-50 p-4 text-xs text-muted-foreground">
                Production notes: move Stripe session creation and AI calls to secure server routes, verify subscription status on load, and enforce feature access both in the UI and on the backend.
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" /> Feature gates shown here should be mirrored in your API and database rules.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
