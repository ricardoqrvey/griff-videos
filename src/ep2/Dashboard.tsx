import { Easing, interpolate, useCurrentFrame } from "remotion";
import { C, MONO, SANS } from "../ep1/brand";
import { FPS } from "./timing";

// The embedded dashboard, dark, dressed as GOAT IQ (as the Ep. 1 chat): near-
// black surfaces, square corners, a hard offset frame, Archivo with Space Mono
// for labels, the brand's green, purple and cyan. It sits inside the customer's
// app (the made-up "brightloop") at 1237×792, and builds in from `from`:
// window, tiles counting up, bars, the trend line, the segment ring.
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const out = Easing.out(Easing.cubic);

const REVENUE = [42, 48, 45, 53, 58, 55, 64, 70, 68, 77, 84, 92];
const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const TREND = [30, 34, 33, 39, 44, 42, 50, 55, 53, 61, 66, 74];
const SEGMENTS: [string, number, string][] = [
  ["Enterprise", 46, C.green],
  ["Mid-market", 31, C.purple],
  ["SMB", 23, C.cyan],
];

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ font: `700 15px ${MONO}`, letterSpacing: "0.08em", color: C.muted, textTransform: "uppercase" }}>{children}</div>
);

export const Dashboard: React.FC<{ from: number }> = ({ from }) => {
  const t = useCurrentFrame() / FPS - from;
  const k = (a: number, d = 0.45) => interpolate(t, [a, a + d], [0, 1], { ...clamp, easing: out });
  const pop = (a: number) => ({ opacity: k(a, 0.25), transform: `translateY(${(1 - k(a, 0.35)) * 22}px)` });
  const count = (to: number, a: number) => to * k(a, 0.8);

  const pts = TREND.map((v, i) => [24 + (i * 482) / 11, 230 - (v - 20) * 3.4] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  const lineK = k(1.0, 1.0);

  return (
    // The window wipes open from the top, then its contents build.
    <div style={{ position: "relative", width: 1237, height: 792, clipPath: `inset(-30px -30px ${(1 - k(0, 0.35)) * 100}% -30px)` }}>
      {/* Hard offset frame behind the window, as on the GOAT IQ stage. */}
      <div style={{ position: "absolute", inset: 0, transform: "translate(18px, 18px)", border: `3px solid ${C.frame}` }} />
      <div style={{ position: "absolute", inset: 0, background: C.bg, border: `2px solid ${C.line}`, fontFamily: SANS, color: C.cream, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* The host app's chrome */}
        <div style={{ height: 66, background: C.bgDeep, borderBottom: `2px solid ${C.line}`, display: "flex", alignItems: "center", gap: 14, padding: "0 28px", flex: "none" }}>
          <svg width="30" height="30" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="14" fill="none" stroke="#ff7a59" strokeWidth="7" />
            <circle cx="35" cy="9" r="6" fill={C.cream} />
          </svg>
          <span style={{ font: `800 24px ${SANS}`, letterSpacing: "-0.03em" }}>brightloop</span>
          <div style={{ display: "flex", gap: 28, marginLeft: 40, font: `600 17px ${SANS}`, color: C.muted }}>
            <span>Home</span>
            <span>Customers</span>
            <span style={{ color: C.cream, borderBottom: `3px solid ${C.green}`, paddingBottom: 19, marginBottom: -23 }}>Reports</span>
            <span>Settings</span>
          </div>
          <span style={{ marginLeft: "auto", font: `700 14px ${MONO}`, letterSpacing: "0.08em", background: C.green, color: C.greenInk, padding: "6px 10px 4px" }}>● LIVE</span>
        </div>

        <div style={{ flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18, minHeight: 0, background: C.bg }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18, ...pop(0.25) }}>
            <span style={{ font: `800 34px ${SANS}`, letterSpacing: "-0.02em", textTransform: "uppercase" }}>Sales overview</span>
            <Label>Last 12 months</Label>
            <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
              {["All regions", "All plans"].map((c) => (
                <span key={c} style={{ font: `700 14px ${MONO}`, letterSpacing: "0.04em", padding: "8px 12px 6px", background: C.surface, border: `2px solid ${C.line}`, color: C.cream }}>
                  {c.toUpperCase()} ▾
                </span>
              ))}
            </div>
          </div>

          {/* KPI tiles */}
          <div style={{ display: "flex", gap: 16 }}>
            {[
              ["Revenue", `$${count(1.28, 0.4).toFixed(2)}M`, "+12.4%"],
              ["Deals won", `${Math.round(count(342, 0.48))}`, "+8.1%"],
              ["Avg. deal", `$${count(3.7, 0.56).toFixed(1)}K`, "+3.6%"],
              ["Churn", `${count(2.1, 0.64).toFixed(1)}%`, "−0.4 PTS"],
            ].map(([label, value, delta], i) => (
              <div key={label} style={{ flex: 1, background: C.surface, border: `2px solid ${C.line}`, padding: "16px 18px", ...pop(0.4 + i * 0.08) }}>
                <Label>{label}</Label>
                <div style={{ font: `800 40px ${SANS}`, letterSpacing: "-0.02em", marginTop: 6 }}>{value}</div>
                <span style={{ display: "inline-block", marginTop: 6, font: `700 13px ${MONO}`, background: "rgba(9,196,128,0.15)", color: C.green, padding: "4px 8px 2px" }}>▲ {delta}</span>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ flex: 1, display: "flex", gap: 16, minHeight: 0 }}>
            <div style={{ flex: 1.25, background: C.surface, border: `2px solid ${C.line}`, padding: "16px 20px", ...pop(0.75) }}>
              <Label>Monthly revenue</Label>
              <svg viewBox="0 0 530 290" width="100%" height="90%" style={{ marginTop: 6 }}>
                {[0, 1, 2, 3].map((g) => (
                  <line key={g} x1={16} x2={524} y1={40 + g * 70} y2={40 + g * 70} stroke={C.line} strokeWidth={1.5} />
                ))}
                {REVENUE.map((v, i) => {
                  const h = (v - 20) * 3.1 * k(0.9 + i * 0.05, 0.45);
                  return <rect key={i} x={26 + i * 41.5} y={250 - h} width={27} height={h} fill={i === REVENUE.length - 1 ? C.green : "#1e5a43"} />;
                })}
                {MONTHS.map((m, i) => (
                  <text key={i} x={39.5 + i * 41.5} y={280} fontSize={15} fill={C.muted} textAnchor="middle" fontFamily="Space Mono">
                    {m}
                  </text>
                ))}
              </svg>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ flex: 1, background: C.surface, border: `2px solid ${C.line}`, padding: "16px 20px", ...pop(0.85) }}>
                <Label>Pipeline trend</Label>
                <svg viewBox="0 0 530 250" width="100%" height="82%">
                  <path d={`${line} L506 250 L24 250 Z`} fill={C.purple} opacity={0.14 * lineK} />
                  <path d={line} fill="none" stroke={C.purple} strokeWidth={5} strokeLinejoin="miter" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - lineK} />
                </svg>
              </div>
              <div style={{ height: 150, background: C.surface, border: `2px solid ${C.line}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 22, ...pop(0.95) }}>
                <svg width="104" height="104" viewBox="0 0 42 42">
                  {SEGMENTS.reduce<{ at: number; els: React.ReactNode[] }>(
                    (acc, [name, pct, color]) => {
                      const len = pct * k(1.1, 0.9);
                      acc.els.push(<circle key={name} cx="21" cy="21" r="15.9" fill="none" stroke={color} strokeWidth="6" strokeDasharray={`${len} ${100 - len}`} strokeDashoffset={25 - acc.at} />);
                      return { at: acc.at + len, els: acc.els };
                    },
                    { at: 0, els: [] },
                  ).els}
                </svg>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Label>Revenue by segment</Label>
                  {SEGMENTS.map(([name, pct, color]) => (
                    <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, font: `600 16px ${SANS}`, color: C.muted }}>
                      <span style={{ width: 12, height: 12, background: color }} />
                      {name} <b style={{ color: C.cream }}>{pct}%</b>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
