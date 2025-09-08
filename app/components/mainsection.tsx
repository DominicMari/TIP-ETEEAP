"use client";
import React from "react";
import { useSession } from "next-auth/react";

export default function MainSection({
  setShowLogin,
}: {
  setShowLogin: (value: boolean) => void;
}) {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col lg:flex-row items-stretch min-h-screen">
      {/* Left Section */}
      <div className="relative flex flex-col justify-center items-center lg:w-1/2 p-8 lg:p-12 bg-gradient-to-br from-gray-800 via-gray-900 to-black">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-lg">
          {/* Logo and TIP */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-xl">
              <img
                src="/assets/TIPLogo.png"
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const fallback = target.nextElementSibling as HTMLElement;
                  target.style.display = "none";
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              <div className="hidden w-12 h-12 items-center justify-center text-black font-black text-lg">
                TIP
              </div>
            </div>
            <div className="text-left">
              <p className="text-yellow-400 text-lg font-bold tracking-wider">
                Technological
              </p>
              <p className="text-xs text-gray-400 uppercase tracking-widest">
                Institute of the Philippines
              </p>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 drop-shadow-2xl mb-4 tracking-tight leading-none">
            ETEEAP
          </h1>

          {/* Subheading */}
          <div className="mb-8">
            <p className="text-xl lg:text-2xl font-light text-gray-300 mb-2 leading-relaxed">
              Expanded Tertiary Education
            </p>
            <p className="text-xl lg:text-2xl font-light text-gray-300 mb-4 leading-relaxed">
              Equivalency & Accreditation Program
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto rounded-full"></div>
          </div>

          {/* Description */}
          <p className="text-base text-gray-400 mb-10 leading-relaxed max-w-sm mx-auto">
            Transform your professional experience into academic credentials
            through our comprehensive accreditation program.
          </p>

          {/* CTA Button */}
          {!session && (
            <button
              onClick={() => setShowLogin(true)} // ✅ Now updates parent
              className="group relative overflow-hidden bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold py-4 px-8 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
            >
              <span className="relative z-10 flex items-center gap-3 text-lg">
                Get Started
                <span className="group-hover:translate-x-1 transition-transform duration-300">
                  →
                </span>
              </span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </button>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="lg:w-1/2 p-8 lg:p-12 bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 text-gray-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-300 rounded-full blur-3xl transform -translate-x-16 translate-y-16"></div>
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="mb-10">
            <h2 className="text-4xl lg:text-5xl font-black mb-4 text-gray-900 leading-tight">
              Programs
              <span className="block text-3xl lg:text-4xl font-light text-gray-700">
                Offered
              </span>
            </h2>
            <div className="w-16 h-1 bg-gray-800 rounded-full"></div>
          </div>

          {/* Programs Grid */}
          <div className="space-y-3">
            {[
              "Bachelor of Science in Computer Science",
              "Bachelor of Science in Information Systems",
              "Bachelor of Science in Information Technology",
              "Bachelor of Science in Computer Engineering",
              "Bachelor of Science in Industrial Engineering",
            ].map((program, index) => (
              <div
                key={index}
                className="group flex items-center gap-4 p-4 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-300 hover:translate-x-2"
              >
                <div className="w-2 h-2 bg-gray-800 rounded-full flex-shrink-0 group-hover:scale-150 transition-transform duration-300"></div>
                <p className="text-lg font-medium text-gray-800 leading-relaxed group-hover:font-semibold transition-all duration-300">
                  {program}
                </p>
              </div>
            ))}

            {/* Business Administration with Specializations */}
            <div className="group bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-300 hover:translate-x-2">
              <div className="flex items-center gap-4 p-4">
                <div className="w-2 h-2 bg-gray-800 rounded-full flex-shrink-0 group-hover:scale-150 transition-transform duration-300"></div>
                <p className="text-lg font-medium text-gray-800 leading-relaxed group-hover:font-semibold transition-all duration-300">
                  Bachelor of Science in Business Administration
                </p>
              </div>
              <div className="ml-6 pb-4 space-y-2">
                {[
                  "Logistics and Supply Chain Management",
                  "Financial Management",
                  "Human Resources Management",
                  "Marketing Management",
                ].map((specialization, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 px-4 py-2"
                  >
                    <div className="w-1 h-1 bg-gray-600 rounded-full flex-shrink-0"></div>
                    <p className="text-base font-normal text-gray-700 leading-relaxed">
                      {specialization}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-10 p-6 bg-white/20 backdrop-blur-sm rounded-xl">
            <p className="text-sm text-gray-700 font-medium text-center">
              📚 All programs are designed for working professionals with
              relevant experience
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
