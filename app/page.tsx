import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Problem } from "@/components/Problem";
import { Services } from "@/components/Services";
import { Demo } from "@/components/Demo";
import { HowItWorks } from "@/components/HowItWorks";
import { AboutUs } from "@/components/AboutUs";
import { BookCall } from "@/components/BookCall";
import { ContactForm } from "@/components/ContactForm";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Problem />
        <Services />
        {/* Server-side check, so the button only shows when /api/voice/web-call can work. */}
        <Demo voiceEnabled={Boolean(process.env.VAPI_PUBLIC_KEY && process.env.VAPI_WEB_ASSISTANT_ID)} />
        <HowItWorks />
        <AboutUs />
        <BookCall />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
