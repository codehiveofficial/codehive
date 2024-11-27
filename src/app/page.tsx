"use client";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Hero from "@/components/Hero";
import Aboutus from "@/components/Aboutus";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <main className="bg-black p-1">
      <Navbar />
      <Hero />
      <FeaturesSection />
      <About />
      <Aboutus />
      <Contact />
      <Footer />
    </main>
  );
}
