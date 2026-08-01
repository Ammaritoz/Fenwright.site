import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Problem } from "@/components/Problem";
import { Services } from "@/components/Services";
import { Demo } from "@/components/Demo";
import { HowItWorks } from "@/components/HowItWorks";
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
        <Demo />
        <HowItWorks />
        <BookCall />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
