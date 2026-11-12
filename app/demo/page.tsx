import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Demo } from "@/components/Demo";
import { Footer } from "@/components/Footer";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Live demo",
  description: site.demo.subhead,
  alternates: { canonical: "/demo" },
};

// The live reply demo and the voice receptionist, kept off the homepage.
export default function DemoPage() {
  return (
    <>
      <Nav />
      <main id="main" className="pt-16">
        {/* Server-side check, so the button only shows when /api/voice/web-call can work. */}
        <Demo voiceEnabled={Boolean(process.env.VAPI_PUBLIC_KEY && process.env.VAPI_WEB_ASSISTANT_ID)} />
      </main>
      <Footer />
    </>
  );
}
