import React, { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import {
  LayoutGrid, Wallet, BookOpen, LineChart as LineChartIcon, TrendingUp,
  FileText, Target, Calendar as CalendarIcon, Bell, User, Settings,
  ChevronDown, Plus, ArrowUpRight, ArrowDownRight, Search, Filter,
  X, ImagePlus, Menu
} from "lucide-react";

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
      
