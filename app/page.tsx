"use client";
import React, { useState, useEffect, useMemo } from "react";
import { signIn, useSession } from "next-auth/react";
import Header from "./components/header";
import Footer from "./components/footer";
import Assessment from "./components/assessment";
import WhoCanEnroll from "./components/whocanenroll";
import Main from "./components/mainsection";
import { X, ArrowLeft, ArrowRight } from 'lucide-react'; // For icons

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

  // ✅ Clean-up: The useEffect that synced user data to Supabase has been removed.
  // This simplifies the component for a public-facing page.

  const handleFormClick = (formType: "application" | "portfolio", redirectUrl: string) => {
    if (session) {
      window.location.href = redirectUrl;
    } else {
      setModalType(formType);
      setCurrentImage(0);
      setShowModal(true); // Show the preview modal first
    }
  };

  const handleNextImage = () => {
    if (!modalType) return;
    setCurrentImage((prev) => (prev + 1) % images[modalType].length);
  };

  const handlePrevImage = () => {
    if (!modalType) return;
    setCurrentImage((prev) => (prev - 1 + images[modalType].length) % images[modalType].length);
  };
  
  const handleSignInClick = () => {
      setShowModal(false); // Close preview modal
      setShowLogin(true);   // Open login modal
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white">
      <Header />
      <Main setShowLogin={setShowLogin} />
      
      {/* --- Login Modal --- */}
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-sm text-center relative">
            <button onClick={() => setShowLogin(false)} className="absolute top-3 right-3 text-gray-400 hover:text-white">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-4">Login to Continue</h2>
            <p className="text-gray-400 mb-6">Please sign in to access the forms and begin your application.</p>
            <button
              onClick={() => signIn("google")}
              className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <img src="/assets/google-logo.svg" alt="Google" className="w-6 h-6" />
              Sign in with Google
            </button>
          </div>
        </div>
      )}

      <WhoCanEnroll />
      <Assessment />

      <section id="application" className="bg-white py-10">
        <div className="container mx-auto flex flex-col sm:flex-row justify-center items-center gap-6">
          <button
            onClick={() => handleFormClick("application", "/appform")}
            className="group relative overflow-hidden bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold py-4 px-8 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl w-64"
          >
            <span className="relative z-10 text-lg">Application Form</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
          <button
            onClick={() => handleFormClick("portfolio", "/portform")}
            className="group relative overflow-hidden bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold py-4 px-8 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl w-64"
          >
            <span className="relative z-10 text-lg">Portfolio Form</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
        </div>
        
        {/* --- Form Preview Modal --- */}
        {showModal && modalType && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-4xl text-center relative">
              <button onClick={() => setShowModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-white z-20">
                <X size={24} />
              </button>
              <h2 className="text-2xl font-bold mb-4 capitalize">{modalType} Form Preview</h2>
              <div className="relative mb-4">
                <img
                  src={images[modalType][currentImage]}
                  alt={`${modalType} form page ${currentImage + 1}`}
                  className="w-full h-auto max-h-[60vh] object-contain rounded-md"
                />
                <button onClick={handlePrevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-75">
                  <ArrowLeft size={24} />
                </button>
                <button onClick={handleNextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-75">
                  <ArrowRight size={24} />
                </button>
              </div>
              <p className="mb-4 text-gray-300">
                Page {currentImage + 1} of {images[modalType].length}
              </p>
              <button
                onClick={handleSignInClick}
                className="bg-yellow-500 text-black font-bold py-3 px-8 rounded-lg hover:bg-yellow-400 transition-colors text-lg"
              >
                Sign in to Apply
              </button>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}