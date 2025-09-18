"use client";
import React, { useState, useEffect } from "react";
import Header from "./components/header";
import Footer from "./components/footer";
import Assessment from "./components/assessment";
import WhoCanEnroll from "./components/whocanenroll";
import Main from "./components/mainsection";
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Page() {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"application" | "portfolio" | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const images = {
    application: [
      "/assets/applicationform/Application Page 1.jpg",
      "/assets/applicationform/Application Page 2.jpg",
      "/assets/applicationform/Application Page 3.jpg",
      "/assets/applicationform/Application Page 4.jpg",
      "/assets/applicationform/Application Page 5.jpg",
    ],
    portfolio: [
      "/assets/portfolioform/Portfolio Page 1.jpg",
      "/assets/portfolioform/Portfolio Page 2.jpg",
    ],
  };

  // Save user info in Supabase when logged in
  useEffect(() => {
    async function saveUser() {
      if (session?.user && session.user.email) {
        try {
          await supabase
            .from("users")
            .upsert(
              [{
                id: session.user.id,
                email: session.user.email,
                name: session.user.name || session.user.user_metadata?.full_name || "Unknown",
                date_logged_in: new Date().toISOString(),
              }],
              { onConflict: "id" }
            );
        } catch (err) {
          console.error("Error saving user login:", err);
        }
      }
    }

    saveUser();
  }, [session]);

  // Handle Application Form click
  function handleApplicationClick() {
    if (session) {
      window.location.href = "/appform";
    } else {
      setModalType("application");
      setCurrentImage(0);
      setShowModal(true);
    }
  }

  // Handle Portfolio Form click
  function handlePortfolioClick() {
    if (session) {
      window.location.href = "/portform";
    } else {
      setModalType("portfolio");
      setCurrentImage(0);
      setShowModal(true);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <Main setShowLogin={setShowLogin} />

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Dark overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLogin(false)}
          ></div>

          {/* Card */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl z-10 overflow-hidden">
            <div className="flex">
              {/* Left Side */}
              <div className="w-1/2 bg-gradient-to-br from-slate-800 via-gray-900 to-black p-12 flex flex-col justify-center items-center text-white relative">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-400 rounded-full blur-2xl"></div>
                </div>

                <div className="relative z-10 text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-xl mb-6 mx-auto">
                    <img
                      src="/assets/TIPLogo.png"
                      className="w-16 h-16 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const fallback = target.nextElementSibling as HTMLElement;
                        target.style.display = "none";
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <div className="hidden w-16 h-16 items-center justify-center text-black font-black text-xl">
                      TIP
                    </div>
                  </div>
                  <p className="text-yellow-400 text-sm font-bold tracking-wider mb-1">T.I.P.</p>
                  <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 mb-4 tracking-tight">
                    ETEEAP
                  </h1>
                  <div className="mb-8">
                    <p className="text-l font-light text-gray-300 mb-2">Expanded Tertiary Education</p>
                    <p className="text-l font-light text-gray-300 mb-4">Equivalency & Accreditation Program</p>
                    <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Right Side */}
              <div className="w-1/2 bg-white p-12 relative">
                <button
                  onClick={() => setShowLogin(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all duration-200"
                >
                  ✕
                </button>

                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome !</h2>
                  <p className="text-gray-600 text-sm">Sign in to continue to ETEEAP</p>
                </div>

                <form className="space-y-4">
                  <div className="flex flex-col gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => signIn("google", { callbackUrl: "/" })}
                      className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold py-3 px-6 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                    >
                      <img
                        src="/assets/googleicon.png"
                        alt="Google"
                        className="w-6 h-6 rounded-full object-cover ring-2 ring-white/40"
                      />
                      Sign in with Google
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Who Can Enroll Section */}
      <WhoCanEnroll />

      {/* Assessment Procedure Section */}
      <Assessment />

      {/* Application / Portfolio Form */}
      <section id="application" className="bg-white py-10">
        <div className="container mx-auto flex justify-center gap-6">
          {/* Application Form Button */}
          <button
            onClick={handleApplicationClick}
            className="group relative overflow-hidden bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold py-4 px-8 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
          >
            <span className="relative z-10 text-lg">Application Form</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>

          {/* Portfolio Form Button */}
          <button
            onClick={handlePortfolioClick}
            className="group relative overflow-hidden bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold py-4 px-8 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
          >
            <span className="relative z-10 text-lg">Portfolio Form</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Shared Modal */}
        {showModal && modalType && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg max-w-3xl w-full relative">
              <h2 className="text-xl font-bold mb-4 text-center">
                {modalType === "application"
                  ? "Application Form (Preview)"
                  : "Portfolio Form (Preview)"}
              </h2>
              <p className="mb-4 text-gray-600 text-center">
                Please log in to fill out the form. This is only a preview.
              </p>

              {/* Image Carousel */}
              <div className="flex justify-center items-center relative">
                <button
                  onClick={() =>
                    setCurrentImage((prev) =>
                      prev === 0 ? images[modalType].length - 1 : prev - 1
                    )
                  }
                  className="absolute left-0 p-2 bg-yellow-500 text-black rounded-full hover:bg-yellow-400"
                >
                  ←
                </button>

                <img
                  src={images[modalType][currentImage]}
                  alt={`${modalType} Form Preview`}
                  className="max-w-sm max-h-[500px] object-contain rounded-lg border border-gray-300"
                />

                <button
                  onClick={() =>
                    setCurrentImage((prev) =>
                      prev === images[modalType].length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-0 p-2 bg-yellow-500 text-black rounded-full hover:bg-yellow-400"
                >
                  →
                </button>
              </div>

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-yellow-500 text-black font-bold px-4 py-2 rounded hover:bg-yellow-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
