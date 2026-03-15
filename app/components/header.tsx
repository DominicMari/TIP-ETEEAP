"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { ClipboardList, LogOut } from "lucide-react";

export default function Header() {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-gray-900 text-white py-4 px-8 flex items-center justify-between shadow-lg fixed w-full top-0 left-0 z-50">

      <div className="flex items-center gap-3">
        {/* Added a Link to home on the logo/title for better UX */}
        <Link href="/" className="flex items-center gap-3">
          <img src="/assets/NewTIPLogo.png" alt="TIP Logo" className="w-15 h-10" />
          <h1 className="text-lg font-bold">ETEEAP</h1>
        </Link>
      </div>

      <nav className="hidden md:flex gap-8">
        <Link href="/#who-can-enroll" className="hover:text-yellow-400 transition">
          Who Can Enroll
        </Link>
        <Link href="/#assessment" className="hover:text-yellow-400 transition">
          Assessment
        </Link>
        <Link href="/#application" className="hover:text-yellow-400 transition">
          Application
        </Link>
        <Link href="/helpcenter" className="hover:text-yellow-400 transition">
          Help Center 
        </Link>
      </nav>

      <div>
        {session ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 focus:outline-none"
              aria-label="User menu"
            >
              <Image
                src={session.user?.image || "/assets/default-avatar.png"}
                alt="User Profile"
                width={36}
                height={36}
                className="rounded-full border-2 border-yellow-400 object-cover hover:border-yellow-300 transition"
                priority
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-slate-700">
                  <p className="text-sm font-semibold text-white truncate">{session.user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
                </div>
                <Link
                  href="/tracker"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-slate-700 hover:text-yellow-400 transition-colors"
                >
                  <ClipboardList className="w-4 h-4" />
                  Track Application
                </Link>
                <button
                  onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: "/" }); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-slate-700 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
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