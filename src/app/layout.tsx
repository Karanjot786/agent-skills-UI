import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://agentskills.in";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  // Basic metadata
  title: {
    default: "Agent Skills CLI - The Universal Skill Manager for AI Agents",
    template: "%s | Agent Skills",
  },
  description: "Install 100,000+ skills for 29 AI agents including Cursor, Claude, Copilot, Gemini CLI, Windsurf, and Cline. The #1 CLI for AI Agent workflows.",
  keywords: [
    "agent skills",
    "ai agents",
    "cursor",
    "claude code",
    "github copilot",
    "openai codex",
    "antigravity",
    "cli",
    "developer tools",
    "ai coding assistant",
    "skills marketplace",
    "llm tools",
    "ai workflow",
    "code generation",
  ],
  authors: [{ name: "Karanjot Singh", url: "https://github.com/Karanjot786" }],
  creator: "Karanjot Singh",
  publisher: "Agent Skills",

  // Canonical URL
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },

  // OpenGraph
  openGraph: {
    title: "Agent Skills CLI - Universal Skill Manager for AI Agents",
    description: "One CLI. 100,000+ Skills. 29 AI Agents. Install skills for Cursor, Claude, Copilot, Gemini CLI, Windsurf, and more.",
    url: siteUrl,
    siteName: "Agent Skills",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Agent Skills CLI - The Universal Skill Manager",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Agent Skills CLI - Universal Skill Manager",
    description: "Install 100,000+ skills for 29 AI agents: Cursor, Claude, Copilot, Gemini CLI, Windsurf, and more.",
    creator: "@Karanjot786",
    images: [`${siteUrl}/og-image.png`],
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Verification (add your actual verification codes)
  verification: {
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },

  // App info
  applicationName: "Agent Skills CLI",
  category: "Developer Tools",

  // Other
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // Icons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
  },
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Agent Skills",
      description: "The Universal Skill Manager for AI Coding Agents",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/marketplace?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Agent Skills",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
      sameAs: [
        "https://github.com/Karanjot786/agent-skills-cli",
        "https://www.npmjs.com/package/agent-skills-cli",
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#software`,
      name: "Agent Skills CLI",
      description: "Command-line interface for managing AI coding skills across Cursor, Claude, Copilot, Codex, and Antigravity",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "macOS, Windows, Linux",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5",
        ratingCount: "50",
      },
      softwareVersion: "1.0.7",
      downloadUrl: "https://www.npmjs.com/package/agent-skills-cli",
      author: {
        "@type": "Person",
        name: "Karanjot Singh",
        url: "https://github.com/Karanjot786",
        sameAs: [
          "https://github.com/Karanjot786",
          "https://www.linkedin.com/in/karanjot786",
        ],
        jobTitle: "Software Developer",
      },
      publisher: {
        "@type": "Organization",
        name: "Agent Skills",
        url: "https://agentskills.in",
        logo: {
          "@type": "ImageObject",
          url: "https://agentskills.in/icon-512.png",
        },
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-V841ZBSTRC"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-V841ZBSTRC');
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased font-sans bg-black text-white`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
