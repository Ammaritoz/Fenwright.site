import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Problem } from "@/components/Problem";
import { Demo } from "@/components/Demo";
import { HowItWorks } from "@/components/HowItWorks";
import { WhatYouGet } from "@/components/WhatYouGet";
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
        <Demo />
        <HowItWorks />
        <WhatYouGet />
        <BookCall />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
