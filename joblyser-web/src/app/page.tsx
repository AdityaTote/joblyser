import Footer from "@/components/landing/Footer";
import Features from "@/components/landing/Features";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Navbar from "@/components/landing/Navbar";
import Testimonials from "@/components/landing/Testimonials";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-zinc-400 selection:bg-amber-400/30 selection:text-amber-200">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <Testimonials />
      <Footer />
    </div>
  );
}
