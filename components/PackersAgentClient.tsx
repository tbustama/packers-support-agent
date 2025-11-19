// components/PackersAgentClient.tsx
import React, { useMemo, useState, useEffect } from "react";

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const responsiveStyles = useMemo(() => getResponsiveStyles(isMobile), [isMobile]);

  return (
    <div style={responsiveStyles.root}>
      <div style={responsiveStyles.fieldOverlay} />
      <main style={responsiveStyles.shell}>
        <section style={responsiveStyles.hero}>
          <div>
            <p style={responsiveStyles.badge}>Packers Emotional Support</p>
            <h1 style={responsiveStyles.title}>Channel That Lambeau Energy</h1>
            <p style={responsiveStyles.subtitle}>
              Drop your rant, pick the vibe, and let the Packers Agent return the perfect blend of validation,
              humor, and tactics—custom-built for Cheeseheads.
            </p>
          </div>
          <div style={responsiveStyles.scoreboard}>
            <div style={responsiveStyles.scoreHeader}>
              <span>Play Clock</span>
              <strong>{playClockStatus}</strong>
            </div>
            <div style={responsiveStyles.scoreRow}>
              <span>Mode</span>
              <strong>{mode}</strong>
            </div>
            <div style={responsiveStyles.scoreRow}>
              <span>Letters Left</span>
              <strong>{Math.max(0, 500 - message.length)}</strong>
            </div>
          </div>
        </section>

        <section style={responsiveStyles.card}>
          <h2 style={responsiveStyles.sectionTitle}>Set the Tone</h2>
          <div style={responsiveStyles.modeGrid}>
            {modeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                style={{
                  ...responsiveStyles.modeButton,
                  ...(mode === option.value ? responsiveStyles.modeButtonActive : {})
                }}
                onClick={() => setMode(option.value)}
              >
                <span style={responsiveStyles.modeLabel}>{option.label}</span>
                <span style={responsiveStyles.modeVibe}>{option.vibe}</span>
              </button>
            ))}
          </div>
        </section>

        <section style={{ ...responsiveStyles.card, marginTop: isMobile ? 20 : 24 }}>
          <h2 style={responsiveStyles.sectionTitle}>Rant It Out</h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            placeholder="Example: 'Why does our secondary play 10 yards off on 3rd & 3?!'"
            style={responsiveStyles.textarea}
          />
          <div style={responsiveStyles.actionsRow}>
            {!isMobile && (
              <span style={responsiveStyles.helperText}>
                {message ? "Hit send when you're ready." : "Paste a fan rant to get started."}
              </span>
            )}
            <button
              style={{
                ...responsiveStyles.sendButton,
                ...((loading || !message.trim()) ? responsiveStyles.sendButtonDisabled : {})
              }}
              onClick={send}
              disabled={loading || !message.trim()}
            >
              {loading ? "Dialing up the play..." : "Send to Agent"}
            </button>
          </div>
          {error && <div style={responsiveStyles.error}>{error}</div>}
        </section>

        {narrativeResponse && (
          <section style={{ ...responsiveStyles.card, marginTop: isMobile ? 20 : 24 }}>
            <div style={responsiveStyles.outputHeader}>
              <div>
                <p style={responsiveStyles.badge}>Agent Response</p>
                <h2 style={responsiveStyles.sectionTitle}>Your Lambeau Pep Talk</h2>
              </div>
              <div style={responsiveStyles.outputTag}>Cheesehead Certified</div>
            </div>
            <article style={responsiveStyles.narrativeBubble}>
              {narrativeResponse.split("\n\n").map((paragraph, index) => (
                <p key={index} style={responsiveStyles.narrativeParagraph}>
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

function getResponsiveStyles(isMobile: boolean): Record<string, React.CSSProperties> {
  return {
    root: {
      minHeight: "100vh",
      background: `radial-gradient(circle at top, ${packersPalette.gold}0f, transparent), ${packersPalette.darkGreen}`,
      padding: isMobile ? "20px 12px" : "40px 16px",
      position: "relative",
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
      color: packersPalette.cream,
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale"
    },
    fieldOverlay: {
      position: "absolute",
      inset: 0,
      backgroundImage:
        "linear-gradient(90deg, rgba(247,243,231,0.05) 1px, transparent 1px), linear-gradient(rgba(247,243,231,0.05) 1px, transparent 1px)",
      backgroundSize: isMobile ? "60px 60px" : "80px 80px",
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
      gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))",
      gap: isMobile ? 20 : 24,
      alignItems: "stretch",
      marginBottom: isMobile ? 24 : 32
    },
    badge: {
      display: "inline-flex",
      padding: isMobile ? "6px 12px" : "4px 12px",
      borderRadius: 999,
      background: `${packersPalette.gold}22`,
      color: packersPalette.gold,
      fontSize: isMobile ? 11 : 12,
      letterSpacing: 1.5,
      textTransform: "uppercase"
    },
    title: {
      fontSize: isMobile ? 32 : 44,
      margin: isMobile ? "12px 0 16px" : "8px 0 16px",
      lineHeight: 1.2,
      fontWeight: 700
    },
    subtitle: {
      color: packersPalette.gray,
      fontSize: isMobile ? 16 : 18,
      lineHeight: 1.6
    },
    scoreboard: {
      background: `linear-gradient(135deg, ${packersPalette.green}, ${packersPalette.darkGreen})`,
      borderRadius: isMobile ? 16 : 20,
      padding: isMobile ? 16 : 20,
      border: `1px solid ${packersPalette.gold}33`,
      boxShadow: "0 20px 45px rgba(0,0,0,0.35)"
    },
    scoreHeader: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: isMobile ? 12 : 14,
      textTransform: "uppercase",
      letterSpacing: 1.3,
      marginBottom: isMobile ? 10 : 12,
      color: packersPalette.gray
    },
    scoreRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: isMobile ? "10px 0" : "12px 0",
      borderTop: `1px solid ${packersPalette.cream}22`,
      fontSize: isMobile ? 18 : 20
    },
    card: {
      background: "rgba(11,41,24,0.82)",
      borderRadius: isMobile ? 20 : 24,
      padding: isMobile ? 18 : 24,
      border: `1px solid ${packersPalette.gold}22`,
      boxShadow: "0 20px 35px rgba(0,0,0,0.35)",
      backdropFilter: "blur(6px)"
    },
    sectionTitle: {
      margin: "0 0 16px",
      fontSize: isMobile ? 24 : 28,
      lineHeight: 1.3
    },
    modeGrid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(180px, 1fr))",
      gap: isMobile ? 10 : 12
    },
    modeButton: {
      border: `1px solid ${packersPalette.gold}22`,
      borderRadius: isMobile ? 14 : 18,
      padding: isMobile ? "16px 12px" : "14px 16px",
      background: "rgba(21,71,52,0.5)",
      textAlign: "left" as const,
      cursor: "pointer",
      color: packersPalette.cream,
      transition: "all 0.2s ease",
      fontSize: isMobile ? 13 : 14,
      minHeight: isMobile ? 64 : "auto",
      WebkitTapHighlightColor: "transparent",
      touchAction: "manipulation"
    },
    modeButtonActive: {
      borderColor: packersPalette.gold,
      background: `${packersPalette.gold}22`,
      boxShadow: `0 0 0 1px ${packersPalette.gold} inset`
    },
    modeLabel: {
      fontWeight: 600,
      display: "block",
      fontSize: isMobile ? 14 : "inherit"
    },
    modeVibe: {
      color: packersPalette.gray,
      fontSize: isMobile ? 11 : 12,
      marginTop: 4,
      lineHeight: 1.3
    },
    textarea: {
      width: "100%",
      minHeight: isMobile ? 120 : 140,
      borderRadius: isMobile ? 14 : 18,
      border: `1px solid ${packersPalette.gold}33`,
      padding: isMobile ? 14 : 16,
      fontSize: isMobile ? 16 : 16,
      color: packersPalette.cream,
      background: "rgba(0,0,0,0.25)",
      resize: "vertical" as const,
      outline: "none",
      fontFamily: "inherit",
      WebkitAppearance: "none",
      lineHeight: 1.5
    },
    actionsRow: {
      marginTop: isMobile ? 16 : 12,
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      justifyContent: "space-between",
      alignItems: isMobile ? "stretch" : "center",
      gap: isMobile ? 12 : 16
    },
    helperText: {
      fontSize: isMobile ? 13 : 14,
      color: packersPalette.gray,
      textAlign: isMobile ? "center" : "left"
    },
    sendButton: {
      background: packersPalette.gold,
      color: packersPalette.darkGreen,
      border: "none",
      borderRadius: 999,
      padding: isMobile ? "16px 24px" : "12px 28px",
      fontWeight: 700,
      cursor: "pointer",
      transition: "transform 0.2s ease, opacity 0.2s ease",
      fontSize: isMobile ? 16 : 16,
      width: isMobile ? "100%" : "auto",
      minHeight: isMobile ? 48 : "auto",
      WebkitTapHighlightColor: "transparent",
      touchAction: "manipulation"
    },
    sendButtonDisabled: {
      opacity: 0.6,
      cursor: "not-allowed"
    },
    error: {
      marginTop: 12,
      color: "#ff6b6b",
      fontWeight: 600,
      fontSize: isMobile ? 14 : 16,
      padding: isMobile ? "12px" : "0",
      borderRadius: isMobile ? 8 : 0,
      background: isMobile ? "rgba(255,107,107,0.1)" : "transparent"
    },
    outputHeader: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      justifyContent: "space-between",
      alignItems: isMobile ? "flex-start" : "center",
      gap: isMobile ? 12 : 16,
      flexWrap: "wrap"
    },
    outputTag: {
      borderRadius: 999,
      padding: isMobile ? "8px 16px" : "6px 16px",
      border: `1px solid ${packersPalette.gold}`,
      color: packersPalette.gold,
      fontSize: isMobile ? 11 : 12,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      alignSelf: isMobile ? "flex-start" : "auto"
    },
    narrativeBubble: {
      marginTop: isMobile ? 12 : 16,
      borderRadius: isMobile ? 20 : 24,
      padding: isMobile ? 16 : 20,
      background: "rgba(0,0,0,0.35)",
      border: `1px solid ${packersPalette.gold}22`,
      lineHeight: 1.7,
      fontSize: isMobile ? 15 : 16,
      color: packersPalette.cream,
      boxShadow: "inset 0 0 25px rgba(0,0,0,0.35)"
    },
    narrativeParagraph: {
      margin: "0 0 14px",
      color: packersPalette.cream,
      fontSize: "inherit"
    }
  };
}
