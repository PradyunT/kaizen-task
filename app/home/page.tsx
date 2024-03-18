"use client";
import { invoke } from "@tauri-apps/api/tauri";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    invoke("is_authorized")
      .then((res) => {
        console.log(res);
        setIsAuthenticated(res as boolean)
      })
      .catch(console.error);
    // if (!isAuthenticated) {
    //   window.location.replace('/auth');
    // }
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Home Page</h1>
      {!isAuthenticated ? <div><h2>You are not authenticated</h2><Link href="/auth">Login</Link></div>: <div></div>}
    </main>
  );
}
