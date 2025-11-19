// pages/index.tsx
import React from "react";
import dynamic from "next/dynamic";

const PackersAgentClient = dynamic(() => import("../components/PackersAgentClient"), { ssr: false });

export default function Home() {
  return (
    <>
      <main>
        <PackersAgentClient />
      </main>
      <style jsx global>{`
        *, *::before, *::after {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background-color: #0b2918;
        }
      `}</style>
    </>
  );
}
