// pages/index.tsx
import React from "react";
import Head from "next/head";
import { GetServerSideProps } from "next";
import dynamic from "next/dynamic";

const PackersAgentClient = dynamic(() => import("../components/PackersAgentClient"), { ssr: false });

interface HomeProps {
  baseUrl: string;
}

export default function Home({ baseUrl }: HomeProps) {
  const imageUrl = `${baseUrl}/green-bay-packers-logo.svg`;

  return (
    <>
      <Head>
        <title>Packers Fan Companion - Channel That Lambeau Energy</title>
        <meta name="description" content="Drop your rant, pick the vibe, and let the Packers Agent return the perfect blend of validation, humor, and tactics—custom-built for Cheeseheads." />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={baseUrl} />
        <meta property="og:title" content="Packers Fan Companion - Channel That Lambeau Energy" />
        <meta property="og:description" content="Drop your rant, pick the vibe, and let the Packers Agent return the perfect blend of validation, humor, and tactics—custom-built for Cheeseheads." />
        <meta property="og:image" content={imageUrl} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={baseUrl} />
        <meta name="twitter:title" content="Packers Fan Companion - Channel That Lambeau Energy" />
        <meta name="twitter:description" content="Drop your rant, pick the vibe, and let the Packers Agent return the perfect blend of validation, humor, and tactics—custom-built for Cheeseheads." />
        <meta name="twitter:image" content={imageUrl} />
      </Head>
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Get the base URL from the request headers
  // Vercel sets x-forwarded-proto correctly, and always uses HTTPS in production
  const forwardedProto = context.req.headers['x-forwarded-proto'];
  const protocol = forwardedProto === 'https' || process.env.VERCEL 
    ? 'https' 
    : forwardedProto || 'http';
  const host = context.req.headers.host || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  return {
    props: {
      baseUrl,
    },
  };
};
