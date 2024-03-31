"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
function Loader() {
  return (
    <div className="text-md flex flex-row gap-4">
      <div className="border-gray-300 h-10 w-10 animate-spin rounded-full border-4 border-t-blue-600" />
      <div className="my-auto h4">Loading</div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      const token = getCookie("token");
      if (token) setIsAuthenticated(true);
      setLoading(false);
    };

    checkAuthentication();
  }, []);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      {loading ? (
        <Loader />
      ) : isAuthenticated ? (
        <div>{children}</div> // Render authenticated content
      ) : (
        <div>
          <h2 className="h4">
            You are not logged in.{" "}
            <Link href="/" className="underline">
              Login here.
            </Link>
          </h2>
        </div>
      )}
    </div>
  );
}
