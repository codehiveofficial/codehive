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
      <div className="flex flex-col gap-4 items-center justify-center mt-32">
        <p className="font-serif underline underline-offset-8 text-white text-lg md:text-lg lg:text-6xl">
          Features
        </p>
        <FeaturesSection />
      </div>
      <About />
      <div className="flex flex-col mt-10">
        <p className="flex underline underline-offset-8 items-center justify-center font-serif text-white text-lg md:text-lg lg:text-6xl">
          Developers of Codehive
        </p>
        <Aboutus />
      </div>
      <Contact />
      <Footer />
    </main>
  );
}
