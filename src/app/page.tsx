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
      <div className="flex flex-col gap-4 items-center justify-center mt-10 md:mt-32 lg:mt-40">
        <p className="font-spacegrotesksemibold text-white text-3xl md:text-4xl lg:text-5xl">
          Features of Codehive
        </p>
        <FeaturesSection />
      </div>
      <About />
      <div className="flex flex-col mt-10 md:mt-32 lg:mt-40 items-center justify-center">
        <p className="font-spacegrotesksemibold text-center text-white text-3xl mb-10 md:text-4xl lg:text-5xl">
          Meet the Developers of Codehive
        </p>
        <Aboutus />
      </div>
      <Contact />
      <Footer />
    </main>
  );
}
