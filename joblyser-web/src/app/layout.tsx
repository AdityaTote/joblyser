import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Provider } from "@/components/provider/provider";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans-var" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading-var",
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "Joblyser - AI Job Assistant",
  description: "Land Your Dream Job — Faster Than Ever",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${dmSans.variable} ${spaceGrotesk.variable}`}
      data-scroll-behavior="smooth"
    >
      <body
        className="bg-[#0a0a0a] font-sans text-zinc-400 antialiased"
        suppressHydrationWarning
      >
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
