"use client";
import React, { useState, useEffect } from "react";
// 1. REMOVE the direct import
// import { createClient } from "@supabase/supabase-js";
// 2. ADD the import for the shared client
import supabase from "../lib/supabase/client"; // Adjust path if needed (e.g., '@/lib/supabase/client')
import { signIn, useSession } from "next-auth/react";
// import Link from 'next/link'; // REMOVED Link import as we are removing the footer link for now
import Header from "./components/header";
// import Footer from "./components/footer"; // Assuming Footer is simple JSX now
import Assessment from "./components/assessment";
import WhoCanEnroll from "./components/whocanenroll";
import Main from "./components/mainsection";
import { X, ArrowLeft, ArrowRight } from 'lucide-react';

// 3. REMOVE the local client initialization
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
// const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Rest of the component remains the same ---

export default function Page() {
  const { data: session, status } = useSession(); // Include status
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"application" | "portfolio" | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [loginEventProcessed, setLoginEventProcessed] = useState(false); // Flag for processing

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

  // Effect runs when session status changes to handle login events (Upsert User & Log History)
  useEffect(() => {
    const handleLoginEvents = async () => {
      // Only proceed if authenticated via NextAuth and not already processed this session instance
      if (status === 'authenticated' && session?.user && !loginEventProcessed) {
        setLoginEventProcessed(true); // Mark as processed for this session instance
        const user = session.user;
        const userEmail = user.email;
        const userName = user.name;
        const userImage = user.image;

        if (!userEmail) {
            console.error("[Page] 🔴 NextAuth session detected but email is missing.");
            return; // Cannot proceed without email
        }

        console.log("[Page] ✅ New NextAuth session detected:", userEmail);

        // --- 1. Upsert user into Supabase 'users' table ---
        console.log(`[Page] 🔄 Upserting user: ${userEmail} into Supabase 'users' table...`);
        // Now uses the imported shared 'supabase' client
        const { data: upsertData, error: upsertError } = await supabase
          .from('users') // Your public user table
          .upsert(
            {
              email: userEmail, // Match on email
              name: userName || 'User', // Provide name or a default
              // id: uses default gen_random_uuid()
              // role: uses default 'Applicant'
              // date: uses default now()
            },
            {
              onConflict: 'email', // Requires UNIQUE constraint on email column
              // ignoreDuplicates: false, // Ensure updates happen (like name change)
            }
          )
          .select('id, role') // Select Supabase ID and role after operation
          .single(); // Expect one row back

        if (upsertError) {
          console.error("[Page] 🔴 Error upserting user:", upsertError.message);
          // Log but continue to record history
        } else if (upsertData) {
          console.log(`[Page] ✅ User upserted/found. Supabase ID: ${upsertData.id}, Role: ${upsertData.role}`);
        } else {
           console.warn("[Page] ❓ User upsert might have completed but returned no data.");
        }

        // --- 2. Record login event in 'user_login_history' ---
        console.log(`[Page] 📝 Recording login event for: ${userEmail}`);
        // Now uses the imported shared 'supabase' client
        const { error: historyError } = await supabase
          .from('user_login_history')
          .insert({
            // user_id: upsertData?.id || null, // Optional: Link to users table ID
            name: userName,
            email: userEmail,
            avatar_url: userImage,
          });

        if (historyError) {
          console.error("[Page] 🔴 Error recording login event:", historyError.message);
        } else {
          console.log("[Page] ✅ Login event recorded successfully!");
        }

      } else if (status === 'unauthenticated') {
        // Reset flag when user logs out
        if (loginEventProcessed) {
           setLoginEventProcessed(false);
           console.log("[Page] 🟡 NextAuth session ended. Resetting login processed flag.");
        }
      }
    };

    handleLoginEvents();
  // Add `status` to dependency array
  }, [session, status, loginEventProcessed]);


  // --- Other handlers ---
  const handleFormClick = (formType: "application" | "portfolio", redirectUrl: string) => {
    if (session) { // Check NextAuth session
      window.location.href = redirectUrl;
    } else {
      setModalType(formType);
      setCurrentImage(0);
      setShowModal(true); // Show preview modal
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
      setShowLogin(true);   // Open login modal (for NextAuth Google Sign In)
  };

  // --- Render logic ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white flex flex-col"> {/* Added flex flex-col */}
      {/* Ensure Header component also uses the shared client if it interacts with Supabase */}
      <Header />
      <main className="flex-grow"> {/* Added main wrapper and flex-grow */}
          <Main setShowLogin={setShowLogin} />

          {/* --- NextAuth Login Modal --- */}
          {showLogin && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
              <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-sm text-center relative">
                <button onClick={() => setShowLogin(false)} className="absolute top-3 right-3 text-gray-400 hover:text-white" aria-label="Close login modal">
                  <X size={24} />
                </button>
                <h2 className="text-2xl font-bold mb-4">Login to Continue</h2>
                <p className="text-gray-400 mb-6">Please sign in to access the forms and begin your application.</p>
                {/* Trigger NextAuth Google Sign In */}
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

          {/* --- Application/Portfolio Buttons Section --- */}
          <section id="application" className="bg-white py-16">
            <div className="container mx-auto flex flex-col sm:flex-row justify-center items-center gap-6 px-4">
              {/* Application Form Button */}
              <button
                onClick={() => handleFormClick("application", "/appform")}
                className="group relative overflow-hidden bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold py-4 px-8 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl w-full sm:w-64 text-lg"
              >
                <span className="relative z-10">Application Form</span>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl"></div>
              </button>
              {/* Portfolio Form Button */}
              <button
                onClick={() => handleFormClick("portfolio", "/portform")}
                className="group relative overflow-hidden bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold py-4 px-8 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl w-full sm:w-64 text-lg"
              >
                <span className="relative z-10">Portfolio Form</span>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl"></div>
              </button>
            </div>

            {/* --- Form Preview Modal --- */}
            {showModal && modalType && (
              <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
                <div className="bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-4xl text-center relative">
                  {/* Close Button */}
                  <button onClick={() => setShowModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-white z-20" aria-label="Close preview modal">
                    <X size={24} />
                  </button>
                  <h2 className="text-2xl font-bold mb-4 capitalize">{modalType} Form Preview</h2>
                  {/* Image Preview Area */}
                  <div className="relative mb-4">
                    {(images[modalType] && images[modalType][currentImage]) ? (
                      <img
                        src={images[modalType][currentImage]}
                        alt={`${modalType} form page ${currentImage + 1}`}
                        className="w-full h-auto max-h-[60vh] object-contain rounded-md"
                      />
                    ) : (
                      <p className="text-red-500 p-10">Image not available.</p>
                    )}
                    {images[modalType] && images[modalType].length > 1 && (
                      <>
                        <button onClick={handlePrevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-75 text-white" aria-label="Previous image">
                          <ArrowLeft size={24} />
                        </button>
                        <button onClick={handleNextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-75 text-white" aria-label="Next image">
                          <ArrowRight size={24} />
                        </button>
                      </>
                    )}
                  </div>
                  {images[modalType] && images[modalType].length > 1 && (
                    <p className="mb-4 text-gray-300">
                      Page {currentImage + 1} of {images[modalType].length}
                    </p>
                  )}
                  <button
                    onClick={handleSignInClick} // Opens the NextAuth login modal
                    className="bg-yellow-500 text-black font-bold py-3 px-8 rounded-lg hover:bg-yellow-400 transition-colors text-lg"
                  >
                    Sign in to Apply
                  </button>
                </div>
              </div>
            )}
          </section>
      </main> {/* End main wrapper */}

       {/* Simple Footer Example (Admin link removed) */}
       <footer className="py-8 text-center text-gray-400 flex-shrink-0"> {/* Added flex-shrink-0 */}
           <p>&copy; {new Date().getFullYear()} TIP ETEEAP Portal. All rights reserved.</p>
           {/* Admin Login Link REMOVED */}
           {/* <div className="mt-4">
               <Link href="/admin" className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                   Admin Portal Login
               </Link>
           </div> */}
       </footer>
       {/* Use this instead if you have a separate Footer component file */}
       {/* <Footer /> */}
    </div>
  );
}