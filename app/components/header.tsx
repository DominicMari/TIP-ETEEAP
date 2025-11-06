"use client";
import React from "react";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-gray-900 text-white py-4 px-8 flex items-center justify-between shadow-lg fixed w-full top-0 left-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <img src="/assets/TIPLogo.png" alt="TIP Logo" className="w-10 h-10" />
        <h1 className="text-lg font-bold">ETEEAP</h1>
      </div>

      {/* Navigation Links */}
      <nav className="hidden md:flex gap-8">
        <a href="#who-can-enroll" className="hover:text-yellow-400 transition">
          Who Can Enroll
        </a>
        <a href="#assessment" className="hover:text-yellow-400 transition">
          Assessment
        </a>
        <a href="#application" className="hover:text-yellow-400 transition">
          Application
        </a>
      </nav>

      {/* User Profile / Login */}
      <div>
        {session ? (
          <div className="flex items-center gap-3">
            <Image
              src={session.user?.image || "/assets/default-avatar.png"}
              alt="User Profile"
              width={32}
              height={32}
              className="rounded-full border-2 border-yellow-400 object-cover"
              priority={true} // optional: load eagerly as this is UI important
            />
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="bg-yellow-400 text-black font-semibold py-1 px-3 rounded-lg hover:bg-yellow-300 transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            // ✅ THIS IS THE FIX
            // Added { prompt: "select_account" } to force account selection
            onClick={() => signIn("google", { prompt: "select_account" })}
            className="bg-yellow-400 text-black font-semibold py-2 px-4 rounded-lg hover:bg-yellow-300 transition"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}