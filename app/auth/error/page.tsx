"use client";
import Link from "next/link";

// 1. Define the correct props type for a Next.js Page with searchParams
// searchParams can have any string key, and values can be string, array of strings, or undefined.
interface AuthErrorPageProps {
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
}

export default function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  
  // 2. Safely get the error message
  // The 'error' param could be an array or undefined, so we handle that.
  const getErrorMessage = () => {
    const errorParam = searchParams?.error;
    if (Array.isArray(errorParam)) {
      return errorParam[0]; // Use the first error if it's an array
    }
    return errorParam || "An unknown error occurred"; // Use the error string or a default
  };

  const errorMessage = getErrorMessage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-6">
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>

      {/* 3. Display the safely-processed error message */}
      <p className="text-red-400 mb-6">
        Something went wrong: <span className="font-semibold">{errorMessage}</span>
      </p>

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