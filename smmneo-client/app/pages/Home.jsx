import { Navigate } from "react-router";
import Hero from "../components/hero.jsx";
import Stats from "../components/stats.jsx";
import About from "../components/about.jsx";
import InfoCards from "../components/infoCards.jsx";
import Reseller from "../components/reseller.jsx";
import FAQ from "../components/faq.jsx";
import { useAuth } from "../components/AuthContext.jsx";

export function meta() {
  return [
    { title: "SMMGen | Social Media Panel" },
    { name: "description", content: "Best and cheapest SMM panel for social media growth." },
  ];
}

const Home = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-lg">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Hero id="hero" />
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <Stats />
        <About />
        <InfoCards />
        <Reseller />
        <FAQ />
      </main>
    </div>
  );
};

export default Home;
