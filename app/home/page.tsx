"use client";
import { invoke } from "@tauri-apps/api/tauri";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

function Loader() {
  return (
    <div className="text-md text-black flex flex-row gap-4">
      <div className="border-gray-300 h-10 w-10 animate-spin rounded-full border-4 border-t-blue-600" />
      <div className="my-auto">Loading</div>
    </div>
  );
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      let token = localStorage.getItem("token");
      if (token) setIsAuthenticated(true);
      setLoading(false);
    };

    checkAuthentication();
    // if (!isAuthenticated) {
    //   window.location.replace('/auth');
    // }
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1>Home Page</h1>
      {loading ? (
        <Loader />
      ) : isAuthenticated ? (
        <>
          <div>Secrety secrets</div> // Render authenticated content
        </>
      ) : (
        <div>
          <h2>You are not authenticated</h2>
          <Link href="/auth">Login</Link>
        </div>
      )}
    </div>
  );
}
