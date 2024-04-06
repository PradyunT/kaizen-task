"use client";
import React, { useEffect, useState } from "react";
import { getCookie, deleteCookie } from "cookies-next";
import Link from "next/link";
import { ModeToggle } from "./ModeToggle";
import { appWindow } from "@tauri-apps/api/window";
import { Button } from "./ui/button";

const Navbar = () => {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [activePage, setActivePage] = useState<string>("");

  useEffect(() => {
    const getData = () => {
      let username = getCookie("username");
      const email = getCookie("email");

      if (username) {
        // Format username
        username = username.charAt(0).toUpperCase() + username.slice(1);
        setUsername(username);
      }
      setEmail(email || "");
    };

    getData();
  }, []);

  const isActive = (page: string) => {
    return activePage === page ? "border-l-4 border-blue-400" : "";
  };

  const handleLogout = () => {
    deleteCookie("username");
    deleteCookie("email");
    deleteCookie("token");
    setUsername("");
    setEmail("");
    setActivePage("");
    window.location.replace("/");
  };

  return (
    <div className="w-[20%] bg-secondary min-w-44 flex flex-col p-2 gap-2">
      <h2 className="h3 font-bold">Kaizen Task</h2>
      <hr className="border-t border-gray-600 w-[100%]" />
      <div>
        <h4 className="h4 mb-0">{username}</h4>
        <h4 className="p font-light">{email}</h4>
      </div>
      {email && <Button onClick={handleLogout}>Logout</Button>}
      <Link href="/home/habits" className="h4" onClick={() => setActivePage("habits")}>
        <div className={`h4 transition-all ml-[-0.25rem] px-1 hover:bg-[#161E2B] rounded-sm ${isActive("habits")}`}>Habits</div>
      </Link>
      <Link href="/home/todo" className="h4" onClick={() => setActivePage("todo")}>
        <div className={`h4 transition-all ml-[-0.25rem] px-1 hover:bg-[#161E2B] rounded-sm ${isActive("todo")}`}>To-do List</div>
      </Link>
      <Link href="/home/goals" className="h4" onClick={() => setActivePage("goals")}>
        <div className={`h4 transition-all ml-[-0.25rem] px-1 hover:bg-[#161E2B] rounded-sm ${isActive("goals")}`}>Goals</div>
      </Link>
      <div className="flex-grow" />
      <div>
        <ModeToggle />
      </div>
    </div>
  );
};

export default Navbar;
