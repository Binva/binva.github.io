import React, { useState, useMemo, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import {
  LayoutGrid, Wallet, BookOpen, LineChart as LineChartIcon, TrendingUp,
  FileText, Target, Calendar as CalendarIcon, Bell, User, Settings,
  ChevronDown, Plus, ArrowUpRight, ArrowDownRight, Search, Filter,
  X, ImagePlus, Menu, LogOut
} from "lucide-react";
import { supabase } from "./supabaseClient";

const T = {
  bg: "#0B0910",
  surface: "#131020",
  surface2: "#1B1729",
  surface3: "#221D33",
  border: "#2A2438",
  borderSoft: "#211C2E",
  text: "#F1EEF7",
  textMuted: "#9A93AE",
  textFaint: "#635C77",
  purple: "#8B5CF6",
  purpleDeep: "#6D28D9",
  purpleDim: "#4C2E8F",
  green: "#3DD9A4",
  red: "#F0685C",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
  sans: "'Inter', -apple-system, sans-serif",
};

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "accounts", label: "Trading Accounts", icon: Wallet },
  { id: "trades", label: "All Trades", icon: LineChartIcon },
  { id: "newtrade", label: "New Trade", icon: Plus },
  { id: "journal", label: "Journal", icon: BookOpen },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "growth", label: "Growth / Statement", icon: ArrowUpRight },
  { id: "playbook", label: "Playbook", icon: FileText },
  { id: "calendar", label: "Calendar", icon: CalendarIcon },
  { id: "goals", label: "Goals", icon: Target },
  { id: "reports", label: "Reports", icon: FileText },
];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function genEquityCurve() {
  const rand = seededRandom(42);
  let balance = 100000;
  const days = 90;
  const pts = [];
  const start = new Date();
  start.setDate(start.getDate() - days);
  for (let i = 0; i <= days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const drift = (rand() - 0.42) * 1400;
    balance = Math.max(balance + drift, 90000);
    pts.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      balance: Math.round(balance),
      equity: Math.round(balance + (rand() - 0.5) * 500),
    });
  }
  return pts;
}

const EQUITY = genEquityCurve();

const SYMBOLS = ["XAUUSD", "EURUSD", "GBPUSD", "US30", "NAS100", "BTCUSD"];
const SETUPS = ["EMA20 Pullback", "London Breakout", "Liquidity Sweep", "Range Reversal"];
const SESSIONS = ["Asian", "London", "New York"];

function genTrades(n) {
  const rand = seededRandom(7);
  const trades = [];
  for (let i = 0; i < n; i++) {
    const win = rand() > 0.42;
    const r = win ? +(rand() * 2.5 + 0.3).toFixed(2) : -(+(rand() * 1.2 + 0.3).toFixed(2));
    const risk = 200;
    const pnl = Math.round(r * risk);
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(rand() * 45));
    trades.push({
      id: `T-${1000 + i}`,
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      symbol: SYMBOLS[Math.floor(rand() * SYMBOLS.length)],
      direction: rand() > 0.5 ? "Long" : "Short",
      setup: SETUPS[Math.floor(rand() * SETUPS.length)],
      session: SESSIONS[Math.floor(rand() * SESSIONS.length)],
      entry: (1900 + rand() * 200).toFixed(2),
      exit: (1900 + rand() * 200).toFixed(2),
      pnl,
      r,
      result: pnl > 0 ? "Win" : pnl < 0 ? "Loss" : "Breakeven",
    });
  }
  return trades.sort((a, b) => new Date(b.date) - new Date(a.date));
}

const TRADES = genTrades(48);

function Card({ children, style, className }) {
  return (
    <div
      className={className}
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Pill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: 8,
        fontSize: 12.5,
        fontWeight: 500,
        border: `1px solid ${active ? T.purple : T.border}`,
        background: active ? "rgba(139,92,246,0.14)" : "transparent",
        color: active ? T.purple : T.textMuted,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function ResultTag({ result }) {
  const map = {
    Win: { c: T.green, bg: "rgba(61,217,164,0.12)" },
    Loss: { c: T.red, bg: "rgba(240,104,92,0.12)" },
    Breakeven: { c: T.textMuted, bg: T.surface3 },
  };
  const s = map[result];
  return (
    <span style={{
      color: s.c, background: s.bg, fontSize: 11.5, fontWeight: 600,
      padding: "3px 9px", borderRadius: 100, fontFamily: T.mono,
    }}>{result}</span>
  );
}

function MetricCard({ label, value, delta, deltaPositive, sub }) {
  return (
    <Card style={{ padding: "18px 18px" }}>
      <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 500, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 600, color: T.text, letterSpacing: -0.5 }}>
        {value}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        {delta !== undefined && (
          <span style={{
            display: "flex", alignItems: "center", gap: 2, fontSize: 12, fontWeight: 600,
            color: deltaPositive ? T.green : T.red, fontFamily: T.mono,
          }}>
            {deltaPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {delta}
          </span>
        )}
        {sub && <span style={{ fontSize: 11.5, color: T.textFaint }}>{sub}</span>}
      </div>
    </Card>
  );
}

function EquityCurve() {
  const [range, setRange] = useState("3M");
  const [mode, setMode] = useState("balance");
  const ranges = ["1D", "1W", "1M", "3M", "6M", "1Y", "All"];
  const sliceMap = { "1D": 2, "1W": 7, "1M": 30, "3M": 90, "6M": 90, "1Y": 90, All: 90 };
  const data = EQUITY.slice(-sliceMap[range]);

  return (
    <Card style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 13, color: T.textMuted, fontWeight: 500, marginBottom: 4 }}>Account Value</div>
          <div style={{ fontFamily: T.mono, fontSize: 26, fontWeight: 600, color: T.text }}>
            ${data[data.length - 1]?.[mode].toLocaleString()}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", background: T.surface2, borderRadius: 8, padding: 3, border: `1px solid ${T.border}` }}>
            {["balance", "equity"].map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, border: "none",
                background: mode === m ? T.purpleDeep : "transparent",
                color: mode === m ? "#fff" : T.textMuted, cursor: "pointer", textTransform: "capitalize",
              }}>{m}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.purple} stopOpacity={0.35} />
                <stop offset="100%" stopColor={T.purple} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderSoft} vertical={false} />
            <XAxis dataKey="date" stroke={T.textFaint} fontSize={11} tickLine={false} axisLine={false} minTickGap={40} />
            <YAxis stroke={T.textFaint} fontSize={11} tickLine={false} axisLine={false} domain={["auto", "auto"]}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={40} />
            <Tooltip
              contentStyle={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: T.textMuted }}
              itemStyle={{ color: T.text, fontFamily: T.mono }}
              formatter={(v) => [`$${v.toLocaleString()}`, mode === "balance" ? "Balance" : "Equity"]}
            />
            <Area type="monotone" dataKey={mode} stroke={T.purple} strokeWidth={2} fill="url(#eqGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 16, flexWrap: "wrap" }}>
        {ranges.map((r) => <Pill key={r} active={range === r} onClick={() => setRange(r)}>{r}</Pill>)}
      </div>
    </Card>
  );
}

function TradeRow({ t, full }) {
  return (
    <tr style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
      <td style={td}>{t.date}</td>
      {full && <td style={td}>FTMO 100K</td>}
      <td style={{ ...td, fontWeight: 600, color: T.text }}>{t.symbol}</td>
      <td style={td}>
        <span style={{ color: t.direction === "Long" ? T.green : T.red, fontWeight: 500 }}>{t.direction}</span>
      </td>
      <td style={{ ...td, color: T.textMuted }}>{t.setup}</td>
      {full && <td style={{ ...td, color: T.textMuted }}>{t.session}</td>}
      <td style={{ ...td, fontFamily: T.mono }}>{t.entry}</td>
      <td style={{ ...td, fontFamily: T.mono }}>{t.exit}</td>
      <td style={{ ...td, fontFamily: T.mono, fontWeight: 600, color: t.pnl >= 0 ? T.green : T.red }}>
        {t.pnl >= 0 ? "+" : ""}{t.pnl.toLocaleString()}
      </td>
      <td style={{ ...td, fontFamily: T.mono, color: t.r >= 0 ? T.green : T.red }}>
        {t.r >= 0 ? "+" : ""}{t.r}R
      </td>
      <td style={td}><ResultTag result={t.result} /></td>
    </tr>
  );
}
const td = { padding: "12px 14px", fontSize: 13, color: T.text, whiteSpace: "nowrap" };
const th = { padding: "10px 14px", fontSize: 11, fontWeight: 600, color: T.textFaint, textAlign: "left", textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap" };

function RecentTrades({ onSeeAll }) {
  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.borderSoft}` }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Recent Trades</div>
        <button onClick={onSeeAll} style={{ background: "none", border: "none", color: T.purple, fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
          See all →
        </button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            {["Date", "Symbol", "Direction", "Setup", "Entry", "Exit", "P&L", "R", "Result"].map(h => <th key={h} style={th}>{h}</th>)}
          </tr></thead>
          <tbody>{TRADES.slice(0, 6).map(t => <TradeRow key={t.id} t={t} />)}</tbody>
        </table>
      </div>
    </Card>
  );
}

function AllTradesView() {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? TRADES : TRADES.filter(t => t.result === filter);
  return (
    <div>
      <PageHeader title="All Trades" subtitle={`${filtered.length} trades`} />
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", flex: "1 1 220px", maxWidth: 320 }}>
          <Search size={15} color={T.textFaint} />
          <input placeholder="Search symbol, setup..." style={{ background: "none", border: "none", outline: "none", color: T.text, fontSize: 13, width: "100%" }} />
        </div>
        {["All", "Win", "Loss", "Breakeven"].map(f => (
          <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Pill>
        ))}
        <button style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 12.5, cursor: "pointer" }}>
          <Filter size={13} /> Filters
        </button>
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              {["Date", "Account", "Symbol", "Direction", "Setup", "Session", "Entry", "Exit", "P&L", "R", "Result"].map(h => <th key={h} style={th}>{h}</th>)}
            </tr></thead>
            <tbody>{filtered.map(t => <TradeRow key={t.id} t={t} full />)}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: T.text, margin: 0, letterSpacing: -0.3 }}>{title}</h1>
        {subtitle && <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

function Dashboard({ goTo }) {
  const [period, setPeriod] = useState("This Month");
  const metrics = [
    { label: "Net P&L", value: "+$4,280", delta: "+8.2%", deltaPositive: true },
    { label: "Return %", value: "+4.3%", delta: "+1.1%", deltaPositive: true },
    { label: "Win Rate", value: "61.4%", delta: "+2.0%", deltaPositive: true },
    { label: "Profit Factor", value: "2.14", delta: "-0.06", deltaPositive: false },
    { label: "Expectancy", value: "+0.48R", sub: "per trade" },
    { label: "Total Trades", value: "48", sub: "this period" },
    { label: "Win/Loss Streak", value: "W 4", sub: "current" },
    { label: "Max Drawdown", value: "-6.1%", sub: "period" },
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3, display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ color: "#C9B8F5", fontWeight: 500 }}>Welcome to</span>
            <span style={{ color: "#FFFFFF", fontFamily: "'Monsieur La Doulaise', cursive", fontSize: 38 }}>Binva</span>
          </div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={selectBtn}>
            <Wallet size={14} color={T.purple} /> FTMO 100K <ChevronDown size={14} color={T.textFaint} />
          </button>
          <div style={{ display: "flex", background: T.surface2, borderRadius: 8, padding: 3, border: `1px solid ${T.border}` }}>
            {["Today", "This Week", "This Month"].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, border: "none",
                background: period === p ? T.purpleDeep : "transparent",
                color: period === p ? "#fff" : T.textMuted, cursor: "pointer",
              }}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 12, marginBottom: 20 }}>
        {metrics.map(m => <MetricCard key={m.label} {...m} />)}
      </div>

      <div style={{ marginBottom: 20 }}><EquityCurve /></div>

      <RecentTrades onSeeAll={() => goTo("trades")} />
    </div>
  );
}

const selectBtn = {
  display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8,
  border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 13, fontWeight: 500, cursor: "pointer",
};

function LabeledInput({ label, ...props }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>{label}</span>
      <input {...props} style={{
        background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8,
        padding: "10px 12px", color: T.text, fontSize: 13.5, outline: "none", fontFamily: T.sans,
      }} />
    </label>
  );
}
function LabeledSelect({ label, options }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>{label}</span>
      <select style={{
        background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8,
        padding: "10px 12px", color: T.text, fontSize: 13.5, outline: "none", fontFamily: T.sans,
      }}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

function FormSection({ title, children }) {
  return (
    <Card style={{ padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
        {children}
      </div>
    </Card>
  );
}

function NewTradeView() {
  const [entry, setEntry] = useState("");
  const [exit, setExit] = useState("");
  const [sl, setSl] = useState("");
  const rr = useMemo(() => {
    const e = parseFloat(entry), x = parseFloat(exit), s = parseFloat(sl);
    if (!e || !x || !s || e === s) return null;
    const risk = Math.abs(e - s);
    const reward = Math.abs(x - e);
    return (reward / risk).toFixed(2);
  }, [entry, exit, sl]);

  return (
    <div style={{ maxWidth: 900 }}>
      <PageHeader title="New Trade" subtitle="Record a trade — metrics are calculated automatically" />

      <FormSection title="Basic Information">
        <LabeledSelect label="Trading Account" options={["FTMO 100K", "Personal Account", "Demo Account"]} />
        <LabeledSelect label="Symbol" options={SYMBOLS} />
        <LabeledInput label="Date" type="date" />
        <LabeledSelect label="Session" options={SESSIONS} />
        <LabeledSelect label="Direction" options={["Long", "Short"]} />
      </FormSection>

      <FormSection title="Entry">
        <LabeledInput label="Entry Price" type="number" value={entry} onChange={e => setEntry(e.target.value)} placeholder="1945.20" />
        <LabeledSelect label="Entry Type" options={["Market", "Limit", "Stop"]} />
        <LabeledSelect label="Market Condition" options={["Trending", "Ranging", "Volatile", "Quiet"]} />
      </FormSection>

      <FormSection title="Risk Management">
        <LabeledInput label="Position Size" placeholder="1.0 lots" />
        <LabeledInput label="Risk %" placeholder="1.0" />
        <LabeledInput label="Stop Loss" type="number" value={sl} onChange={e => setSl(e.target.value)} placeholder="1938.00" />
        <LabeledInput label="Take Profit" type="number" placeholder="1962.00" />
      </FormSection>

      <FormSection title="Exit">
        <LabeledInput label="Exit Price" type="number" value={exit} onChange={e => setExit(e.target.value)} placeholder="1958.40" />
        <LabeledSelect label="Exit Reason" options={["Take Profit Hit", "Stop Loss Hit", "Manual Close", "Breakeven"]} />
      </FormSection>

      <Card style={{ padding: 20, marginBottom: 16, background: T.surface2 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 14 }}>Auto-calculated</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11.5, color: T.textFaint, marginBottom: 4 }}>Risk / Reward</div>
            <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 600, color: T.purple }}>{rr ? `1 : ${rr}` : "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: T.textFaint, marginBottom: 4 }}>P&L</div>
            <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 600, color: T.textMuted }}>—</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: T.textFaint, marginBottom: 4 }}>R-Multiple</div>
            <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 600, color: T.textMuted }}>—</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: T.textFaint, marginBottom: 4 }}>Result</div>
            <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 600, color: T.textMuted }}>—</div>
          </div>
        </div>
      </Card>

      <FormSection title="Psychology (optional)">
        <LabeledSelect label="Before Entry" options={["Calm", "Confident", "Fearful", "FOMO", "Hesitant", "Excited", "Revenge", "Other"]} />
        <LabeledSelect label="During Trade" options={["Calm", "Nervous", "Greedy", "Fearful", "Impatient", "Confident", "Other"]} />
        <LabeledSelect label="After Trade" options={["Satisfied", "Frustrated", "Angry", "Calm", "Regretful", "Neutral"]} />
        <LabeledSelect label="Followed Plan?" options={["Yes", "No"]} />
      </FormSection>

      <Card style={{ padding: 20, marginBottom: 16, borderStyle: "dashed" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>Screenshots</div>
        <div style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 14 }}>Before / during / after entry charts</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {["Before", "During", "After"].map(s => (
            <div key={s} style={{
              width: 120, height: 84, border: `1px dashed ${T.border}`, borderRadius: 10,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 6, color: T.textFaint, fontSize: 11.5, cursor: "pointer",
            }}>
              <ImagePlus size={16} />{s}
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button style={{ padding: "10px 18px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 13.5, cursor: "pointer" }}>
          Save Draft
        </button>
        <button style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: T.purpleDeep, color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
          Save Trade
        </button>
      </div>
    </div>
  );
}

function PlaybookView() {
  const setups = [
    { name: "EMA20 Pullback", trades: 82, winRate: 63, pf: 2.04, exp: "+0.51R" },
    { name: "London Breakout", trades: 46, winRate: 57, pf: 1.71, exp: "+0.33R" },
    { name: "Liquidity Sweep", trades: 31, winRate: 68, pf: 2.4, exp: "+0.62R" },
    { name: "Range Reversal", trades: 24, winRate: 46, pf: 0.91, exp: "-0.08R" },
  ];
  return (
    <div>
      <PageHeader title="Playbook" subtitle="Your trading strategies and setups"
        action={<button style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: "none", background: T.purpleDeep, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}><Plus size={15} /> New Setup</button>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        {setups.map(s => (
          <Card key={s.name} style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{s.name}</div>
              <span style={{ fontSize: 11, color: T.textFaint, fontFamily: T.mono }}>{s.trades} trades</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: T.textFaint }}>Win Rate</div>
                <div style={{ fontFamily: T.mono, fontSize: 15, fontWeight: 600, color: T.text }}>{s.winRate}%</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textFaint }}>Profit Factor</div>
                <div style={{ fontFamily: T.mono, fontSize: 15, fontWeight: 600, color: s.pf >= 1 ? T.green : T.red }}>{s.pf}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textFaint }}>Expectancy</div>
                <div style={{ fontFamily: T.mono, fontSize: 15, fontWeight: 600, color: s.exp.startsWith("+") ? T.green : T.red }}>{s.exp}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ title }) {
  return (
    <div>
      <PageHeader title={title} />
      <Card style={{ padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, textAlign: "center" }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: T.surface2,
          display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.border}`,
        }}>
          <FileText size={20} color={T.purple} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Nothing here yet</div>
        <div style={{ fontSize: 13, color: T.textMuted, maxWidth: 320 }}>
          This section is part of the Binva spec but out of scope for this prototype pass.
        </div>
      </Card>
    </div>
  );
}

function LoginScreen({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    setError("");
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStage("code");
  };

  const verifyCode = async () => {
    setError("");
    if (!code) {
      setError("Please enter the code.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email, token: code, type: "email",
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    onLoggedIn(data.session);
  };

  return (
    <div style={{
      fontFamily: T.sans, background: T.bg, minHeight: "100vh", color: T.text,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <span style={{ fontSize: 42, fontFamily: "'Monsieur La Doulaise', cursive", color: T.purple }}>Binva</span>
        </div>
        <Card style={{ padding: 24 }}>
          {stage === "email" ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 4 }}>Sign in</div>
              <div style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 18 }}>We'll email you a login code</div>
              <LabeledInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              {error && <div style={{ color: T.red, fontSize: 12.5, marginTop: 10 }}>{error}</div>}
              <button
                onClick={sendCode}
                disabled={loading}
                style={{
                  marginTop: 16, width: "100%", padding: "11px 20px", borderRadius: 8, border: "none",
                  background: T.purpleDeep, color: "#fff", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", opacity: loading ? 0.6 : 1,
                }}>
                {loading ? "Sending..." : "Send code"}
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 4 }}>Enter your code</div>
              <div style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 18 }}>Sent to {email}</div>
              <LabeledInput
                label="6-digit code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
              />
              {error && <div style={{ color: T.red, fontSize: 12.5, marginTop: 10 }}>{error}</div>}
              <button
                onClick={verifyCode}
                disabled={loading}
                style={{
                  marginTop: 16, width: "100%", padding: "11px 20px", borderRadius: 8, border: "none",
                  background: T.purpleDeep, color: "#fff", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", opacity: loading ? 0.6 : 1,
                }}>
                {loading ? "Verifying..." : "Verify & sign in"}
              </button>
              <button
                onClick={() => { setStage("email"); setCode(""); setError(""); }}
                style={{
                  marginTop: 10, width: "100%", padding: "9px 20px", borderRadius: 8,
                  border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted,
                  fontSize: 13, cursor: "pointer",
                }}>
                Use a different email
              </button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function BinvaApp() {
  const [session, setSession] = useState(undefined);
  const [view, setView] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{ fontFamily: T.sans, background: T.bg, minHeight: "100vh" }} />
    );
  }

  if (!session) {
    return <LoginScreen onLoggedIn={setSession} />;
  }

  const userEmail = session.user?.email || "";

  const renderView = () => {
    switch (view) {
      case "dashboard": return <Dashboard goTo={setView} />;
      case "trades": return <AllTradesView />;
      case "newtrade": return <NewTradeView />;
      case "playbook": return <PlaybookView />;
      default: {
        const item = NAV.find(n => n.id === view);
        return <EmptyState title={item ? item.label : "Coming soon"} />;
      }
    }
  };

  return (
    <div style={{
      fontFamily: T.sans, background: T.bg, minHeight: "100vh", color: T.text,
      display: "flex",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        input:focus, select:focus { border-color: ${T.purple} !important; }
        ::-webkit-scrollbar { height: 8px; width: 8px; }
        ::-webkit-scrollbar-thumb { background: ${T.surface3}; border-radius: 8px; }
      `}</style>

      <div style={{
        width: 232, flexShrink: 0, borderRight: `1px solid ${T.borderSoft}`,
        background: T.surface, padding: "20px 14px", position: "sticky", top: 0, height: "100vh",
        display: "flex", flexDirection: "column",
      }}
        className={`binessa-sidebar ${navOpen ? "force-open" : ""}`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 8 }}>
          {NAV.map(item => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button key={item.id} onClick={() => { setView(item.id); setNavOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8,
                  border: "none", background: active ? "rgba(139,92,246,0.12)" : "transparent",
                  color: active ? T.purple : T.textMuted, fontSize: 13, fontWeight: active ? 600 : 500,
                  cursor: "pointer", textAlign: "left",
                }}>
                <Icon size={16} strokeWidth={2} />
                {item.label}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 2, paddingTop: 14, borderTop: `1px solid ${T.borderSoft}` }}>
          {[{ label: "Notifications", icon: Bell }, { label: "Profile", icon: User }, { label: "Settings", icon: Settings }].map(item => (
            <button key={item.label} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8,
              border: "none", background: "transparent", color: T.textMuted, fontSize: 13, fontWeight: 500,
              cursor: "pointer", textAlign: "left",
            }}>
              <item.icon size={16} />{item.label}
            </button>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px 2px" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: T.purpleDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
              {userEmail.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userEmail}</div>
              <div style={{ fontSize: 11, color: T.textFaint }}>Free Plan</div>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              title="Sign out"
              style={{ background: "none", border: "none", color: T.textFaint, cursor: "pointer", flexShrink: 0 }}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="binessa-mobile-bar" style={{
        display: "none", position: "fixed", top: 0, left: 0, right: 0, zIndex: 35,
        background: T.surface, borderBottom: `1px solid ${T.borderSoft}`, padding: "12px 16px",
        alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 26, fontFamily: "'Monsieur La Doulaise', cursive", color: T.purple }}>Binva</span>
        </div>
        <button onClick={() => setNavOpen(!navOpen)} style={{ background: "none", border: "none", color: T.text }}>
          <Menu size={20} />
        </button>
      </div>

      <div className={`binessa-overlay ${navOpen ? "show" : ""}`} onClick={() => setNavOpen(false)} />

      <div style={{ flex: 1, padding: "28px 32px", minWidth: 0 }} className="binessa-main">
        {renderView()}
      </div>

      <style>{`
        @media (max-width: 860px) {
          .binessa-sidebar {
            position: fixed !important;
            top: 0;
            right: 0;
            left: auto !important;
            height: 100vh;
            transform: translateX(100%);
            transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 30;
            display: flex !important;
            border-left: 1px solid #211C2E;
            border-right: none;
          }
          .binessa-sidebar.force-open {
            transform: translateX(0);
          }
          .binessa-mobile-bar { display: flex !important; }
          .binessa-main { padding: 76px 16px 24px !important; }
          .binessa-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 25;
          }
          .binessa-overlay.show { display: block; }
        }
      `}</style>
    </div>
  );
}