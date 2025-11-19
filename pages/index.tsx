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
  // Use square 512x512 image for Open Graph previews (square images work well and avoid stretching)
  const imageUrl = `${baseUrl}/favicon-512x512.png`;

  return (
    <>
      <Head>
        <title>Packers Emotional Support Agent</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/favicon-512x512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="description" content="Drop your rant, pick the vibe, and let the Packers Agent return the perfect blend of validation, humor, and tactics—custom-built for Cheeseheads." />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={baseUrl} />
        <meta property="og:title" content="Packers Emotional Support Agent" />
        <meta property="og:description" content="Drop your rant, pick the vibe, and let the Packers Agent return the perfect blend of validation, humor, and tactics—custom-built for Cheeseheads." />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:image:type" content="image/png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={baseUrl} />
        <meta name="twitter:title" content="Packers Emotional Support Agent" />
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
          -webkit-text-size-adjust: 100%;
          -moz-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }

        button, textarea, input {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }

        @media (max-width: 767px) {
          body {
            overflow-x: hidden;
          }
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
