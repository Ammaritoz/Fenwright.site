import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Statement } from "@/components/Statement";
import { Services } from "@/components/Services";
import { Problem } from "@/components/Problem";
import { WeekLedger } from "@/components/WeekLedger";
import { FirstLook } from "@/components/FirstLook";
import { HowItWorks } from "@/components/HowItWorks";
import { AboutUs } from "@/components/AboutUs";
import { BookCall } from "@/components/BookCall";
import { Footer } from "@/components/Footer";

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
        <FirstLook />
        <HowItWorks />
        <AboutUs />
        <BookCall />
      </main>
      <Footer />
    </>
  );
}
