"use client";
import Aboutus from "@/components/Aboutus";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <main className="bg-black p-1">
      <Navbar />
      <FeaturesSection/>
      <Aboutus />
      <Footer />
    </main>
  );
}
