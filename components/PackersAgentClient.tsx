// components/PackersAgentClient.tsx
import React, { useMemo, useState } from "react";

const packersPalette = {
  green: "#154734",
  darkGreen: "#0b2918",
  gold: "#ffb612",
  cream: "#f7f3e7",
  gray: "#d7d7ce"
};

const modeOptions = [
  { value: "Balanced", label: "Balanced", vibe: "Even-keeled reassurance" },
  { value: "Zen", label: "Zen", vibe: "Mindful optimism" },
  { value: "Dramatic", label: "Dramatic", vibe: "Soap-opera energy" },
  { value: "Angry", label: "Angry", vibe: "Cheesehead rage vent" },
  { value: "Copium", label: "Copium", vibe: "Silver-lining sniffing" },
  { value: "Analyst", label: "Analyst", vibe: "Film-room precision" },
  { value: "Petty", label: "Petty", vibe: "NFC North clapbacks" }
];

export default function PackersAgentClient() {
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("Balanced");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await fetch("/api/packers-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, mode: mode === "Balanced" ? undefined : mode })
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || "Request failed");
      }
      const json = await resp.json();
      setResult(json);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  const playClockStatus = useMemo(() => {
    if (loading) return "Calling the play...";
    if (!message.trim()) return "Waiting for the huddle";
    return "Ready to snap";
  }, [loading, message]);

  const responseEntries = useMemo(() => {
    if (!result) return [];
    const orderedKeys = [
      "validation",
      "tactical_breakdown",
      "reframing",
      "humor",
      "fan_ritual",
      "closing"
    ];
    const record = result as Record<string, React.ReactNode>;
    return orderedKeys
      .map((key) => {
        const value = record[key];
        if (!value) return null;
        return { key, value };
      })
      .filter(Boolean) as { key: string; value: React.ReactNode }[];
  }, [result]);

  const narrativeResponse = useMemo(() => {
    if (!responseEntries.length) return "";
    return responseEntries
      .map(({ value }) => {
        if (typeof value === "string") return value.trim();
        return String(value);
      })
      .filter(Boolean)
      .join("\n\n");
  }, [responseEntries]);

  return (
    <div style={styles.root}>
      <div style={styles.fieldOverlay} />
      <main style={styles.shell}>
        <section style={styles.hero}>
          <div>
            <p style={styles.badge}>Packers Emotional Support</p>
            <h1 style={styles.title}>Channel That Lambeau Energy</h1>
            <p style={styles.subtitle}>
              Drop your rant, pick the vibe, and let the Packers Agent return the perfect blend of validation,
              humor, and tactics—custom-built for Cheeseheads.
            </p>
          </div>
          <div style={styles.scoreboard}>
            <div style={styles.scoreHeader}>
              <span>Play Clock</span>
              <strong>{playClockStatus}</strong>
            </div>
            <div style={styles.scoreRow}>
              <span>Mode</span>
              <strong>{mode}</strong>
            </div>
            <div style={styles.scoreRow}>
              <span>Letters Left</span>
              <strong>{Math.max(0, 500 - message.length)}</strong>
            </div>
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Set the Tone</h2>
          <div style={styles.modeGrid}>
            {modeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                style={{
                  ...styles.modeButton,
                  ...(mode === option.value ? styles.modeButtonActive : {})
                }}
                onClick={() => setMode(option.value)}
              >
                <span style={styles.modeLabel}>{option.label}</span>
                <span style={styles.modeVibe}>{option.vibe}</span>
              </button>
            ))}
          </div>
        </section>

        <section style={{ ...styles.card, marginTop: 24 }}>
          <h2 style={styles.sectionTitle}>Rant It Out</h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            placeholder="Example: 'Why does our secondary play 10 yards off on 3rd & 3?!'"
            style={styles.textarea}
          />
          <div style={styles.actionsRow}>
            <span style={styles.helperText}>{message ? "Hit send when you're ready." : "Paste a fan rant to get started."}</span>
            <button
              style={{
                ...styles.sendButton,
                ...((loading || !message.trim()) ? styles.sendButtonDisabled : {})
              }}
              onClick={send}
              disabled={loading || !message.trim()}
            >
              {loading ? "Dialing up the play..." : "Send to Agent"}
            </button>
          </div>
          {error && <div style={styles.error}>{error}</div>}
        </section>

        {narrativeResponse && (
          <section style={{ ...styles.card, marginTop: 24 }}>
            <div style={styles.outputHeader}>
              <div>
                <p style={styles.badge}>Agent Response</p>
                <h2 style={styles.sectionTitle}>Your Lambeau Pep Talk</h2>
              </div>
              <div style={styles.outputTag}>Cheesehead Certified</div>
            </div>
            <article style={styles.narrativeBubble}>
              {narrativeResponse.split("\n\n").map((paragraph, index) => (
                <p key={index} style={styles.narrativeParagraph}>
                  {paragraph}
                </p>
              ))}
            </article>
          </section>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: `radial-gradient(circle at top, ${packersPalette.gold}0f, transparent), ${packersPalette.darkGreen}`,
    padding: "40px 16px",
    position: "relative",
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    color: packersPalette.cream
  },
  fieldOverlay: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(90deg, rgba(247,243,231,0.05) 1px, transparent 1px), linear-gradient(rgba(247,243,231,0.05) 1px, transparent 1px)",
    backgroundSize: "80px 80px",
    pointerEvents: "none"
  },
  shell: {
    position: "relative",
    maxWidth: 960,
    margin: "0 auto",
    zIndex: 1
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 24,
    alignItems: "stretch",
    marginBottom: 32
  },
  badge: {
    display: "inline-flex",
    padding: "4px 12px",
    borderRadius: 999,
    background: `${packersPalette.gold}22`,
    color: packersPalette.gold,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase"
  },
  title: {
    fontSize: 44,
    margin: "8px 0 16px"
  },
  subtitle: {
    color: packersPalette.gray,
    fontSize: 18,
    lineHeight: 1.5
  },
  scoreboard: {
    background: `linear-gradient(135deg, ${packersPalette.green}, ${packersPalette.darkGreen})`,
    borderRadius: 20,
    padding: 20,
    border: `1px solid ${packersPalette.gold}33`,
    boxShadow: "0 20px 45px rgba(0,0,0,0.35)"
  },
  scoreHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1.3,
    marginBottom: 12,
    color: packersPalette.gray
  },
  scoreRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderTop: `1px solid ${packersPalette.cream}22`,
    fontSize: 20
  },
  card: {
    background: "rgba(11,41,24,0.82)",
    borderRadius: 24,
    padding: 24,
    border: `1px solid ${packersPalette.gold}22`,
    boxShadow: "0 20px 35px rgba(0,0,0,0.35)",
    backdropFilter: "blur(6px)"
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: 28
  },
  modeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12
  },
  modeButton: {
    border: `1px solid ${packersPalette.gold}22`,
    borderRadius: 18,
    padding: "14px 16px",
    background: "rgba(21,71,52,0.5)",
    textAlign: "left" as const,
    cursor: "pointer",
    color: packersPalette.cream,
    transition: "all 0.2s ease",
    fontSize: 14
  },
  modeButtonActive: {
    borderColor: packersPalette.gold,
    background: `${packersPalette.gold}22`,
    boxShadow: `0 0 0 1px ${packersPalette.gold} inset`
  },
  modeLabel: {
    fontWeight: 600,
    display: "block"
  },
  modeVibe: {
    color: packersPalette.gray,
    fontSize: 12,
    marginTop: 4
  },
  textarea: {
    width: "100%",
    minHeight: 140,
    borderRadius: 18,
    border: `1px solid ${packersPalette.gold}33`,
    padding: 16,
    fontSize: 16,
    color: packersPalette.cream,
    background: "rgba(0,0,0,0.25)",
    resize: "vertical" as const,
    outline: "none"
  },
  actionsRow: {
    marginTop: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16
  },
  helperText: {
    fontSize: 14,
    color: packersPalette.gray
  },
  sendButton: {
    background: packersPalette.gold,
    color: packersPalette.darkGreen,
    border: "none",
    borderRadius: 999,
    padding: "12px 28px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "transform 0.2s ease",
    fontSize: 16
  },
  sendButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed"
  },
  error: {
    marginTop: 12,
    color: "#ff6b6b",
    fontWeight: 600
  },
  outputHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap"
  },
  outputTag: {
    borderRadius: 999,
    padding: "6px 16px",
    border: `1px solid ${packersPalette.gold}`,
    color: packersPalette.gold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  narrativeBubble: {
    marginTop: 16,
    borderRadius: 24,
    padding: 20,
    background: "rgba(0,0,0,0.35)",
    border: `1px solid ${packersPalette.gold}22`,
    lineHeight: 1.7,
    fontSize: 16,
    color: packersPalette.cream,
    boxShadow: "inset 0 0 25px rgba(0,0,0,0.35)"
  },
  narrativeParagraph: {
    margin: "0 0 14px",
    color: packersPalette.cream
  }
};
