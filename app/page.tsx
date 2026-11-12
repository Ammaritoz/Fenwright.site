import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Statement } from "@/components/Statement";
import { Services } from "@/components/Services";
import { Problem } from "@/components/Problem";
import { WeekLedger } from "@/components/WeekLedger";
import { Leads } from "@/components/Leads";
import { HowItWorks } from "@/components/HowItWorks";
import { AboutUs } from "@/components/AboutUs";
import { BookCall } from "@/components/BookCall";
import { ContactForm } from "@/components/ContactForm";
import { Footer } from "@/components/Footer";

// The live demos moved to their own page (app/demo), linked from the footer.
export default function Home() {
  return (
    <>
      <Nav overlay />
      <main id="main">
        <Hero />
        <Statement />
        <Services />
        <Problem />
        <WeekLedger />
        <Leads />
        <HowItWorks />
        <AboutUs />
        <BookCall />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
