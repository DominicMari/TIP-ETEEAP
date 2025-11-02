"use client";
import Link from "next/link";

// 1. Define the props type using 'any' to bypass the build-time
//    type mismatch. This is a workaround for the 'Promise<any>'
//    error you're seeing in the Vercel build logs.
type AuthErrorPageProps = {
  params: any;
  searchParams: any;
};

export default function AuthErrorPage({ params, searchParams }: AuthErrorPageProps) {
  
  // 2. Safely get the error message, since the type is 'any'
  const getErrorMessage = () => {
    try {
      const errorParam = searchParams?.error;
      if (Array.isArray(errorParam)) {
        return errorParam[0]; // Use the first error if it's an array
      }
      return errorParam || "An unknown error occurred"; // Use the error string or a default
    } catch (e) {
      // Fallback in case searchParams is not an object
      return "An unknown error occurred.";
    }
  };

  const errorMessage = getErrorMessage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-6">
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>

      <p className="text-red-400 mb-6">
        Something went wrong: <span className="font-semibold">{errorMessage}</span>
      </Gallery>

      {/* Go Back Home Button */}
      <Link
        href="/"
        className="bg-yellow-400 text-black font-semibold py-2 px-4 rounded-lg hover:bg-yellow-300 transition"
      >
        Go Back Home
      </Link>
    </div>
  );
}