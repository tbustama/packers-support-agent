// pages/index.tsx
import React from "react";
import dynamic from "next/dynamic";

const PackersAgentClient = dynamic(() => import("../components/PackersAgentClient"), { ssr: false });

export default function Home() {
  return (
    <main>
      <PackersAgentClient />
    </main>
  );
}
