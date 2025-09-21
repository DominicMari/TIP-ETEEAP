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

  // Save or update user profile in Supabase when logged in
  useEffect(() => {
    async function updateLastLogin() {
      const userId = session?.user?.id || session?.user?.sub;
      if (userId && session.user.email && session.user.name) {
        try {
          const { data, error } = await supabase
            .from("users")
            .upsert(
              [
                {
                  id: userId,
                  email: session.user.email,
                  name: session.user.name,
                  date: new Date().toISOString(),
                },
              ],
              { onConflict: "id" }
            )
            .select();

          if (error) {
            console.error("Error updating login date:", JSON.stringify(error, null, 2));
          } else {
            console.log("Login date updated:", data);
          }
        } catch (err) {
          console.error("Unexpected error updating login date:", err);
        }
      }
    }
    if (session) {
      updateLastLogin();
    }
  }, [session]);

  // Handlers to show modal or redirect based on login state
  function handleApplicationClick() {
    if (session) {
      window.location.href = "/appform";
    } else {
      setModalType("application");
      setCurrentImage(0);
      setShowModal(true);
    }
  }

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
      <Header />
      <Main setShowLogin={setShowLogin} />
      {showLogin && (
        // your login modal JSX, unchanged
        null
      )}
      <WhoCanEnroll />
      <Assessment />
      <section id="application" className="bg-white py-10">
        <div className="container mx-auto flex justify-center gap-6">
          <button
            onClick={handleApplicationClick}
            className="group relative overflow-hidden bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold py-4 px-8 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
          >
            <span className="relative z-10 text-lg">Application Form</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
          <button
            onClick={handlePortfolioClick}
            className="group relative overflow-hidden bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold py-4 px-8 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
          >
            <span className="relative z-10 text-lg">Portfolio Form</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
        </div>
        {showModal && modalType && (
          // your modal JSX unchanged
          null
        )}
      </section>
      <Footer />
    </div>
  );
}
