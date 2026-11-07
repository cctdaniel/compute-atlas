import type { Metadata } from "next";
import localFont from "next/font/local";
import { Shell } from "@/components/shell";
import { PreferencesProvider } from "@/components/preferences";
import "./globals.css";

const sans = localFont({
  src: "./fonts/dm-sans-latin.woff2",
  weight: "100 1000",
  variable: "--font-body",
  display: "swap",
});

const serif = localFont({ src: [{ path: "./fonts/lora-latin.woff2", weight: "400 700", style: "normal" }, { path: "./fonts/lora-italic-latin.woff2", weight: "400 700", style: "italic" }], variable: "--font-editorial", display: "swap" });

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  weight: "400",
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Compute Atlas — Big ideas. Make them click.", template: "%s | Compute Atlas" },
  description: "A visual, hands-on atlas of computer science. Start with AI and machine learning: build intuition, experiment with a model, and learn at your own depth.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${sans.variable} ${serif.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var p=localStorage.getItem('compute-atlas-theme');if(!['light','dark','system'].includes(p))p='system';document.documentElement.dataset.preference=p;document.documentElement.dataset.theme=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p}catch(e){}})()` }} /></head>
      <body><PreferencesProvider><Shell>{children}</Shell></PreferencesProvider></body>
    </html>
  );
}
