"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

import CustomConnectButton from "./common/CustomConnectButton";

const Navbar = () => {
  const pathname = usePathname();

  // if (pathname === '/') {
  //   return <></>;
  // } 
        
  return (
    <header className="bg-indigo-600/90 backdrop-blur-md shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-white">Crowd Chain</h1>
        <div className="hidden md:flex items-center space-x-6">
          <Link
            href="/"
            className={`px-4 py-2 text-sm font-medium rounded hover:bg-indigo-500 transition-colors ${
              pathname === "/" ? "text-white border-b-2 border-white" : "text-indigo-200"
            }`}
          >Home</Link>

          <Link
            href="/new-project"
            className={`px-4 py-2 text-sm font-medium rounded hover:bg-indigo-500 transition-colors ${
              pathname === "/new-project" ? "text-white border-b-2 border-white" : "text-indigo-200"
            }`}
          >New</Link>

          <Link
            href="/user/projects"
            className={`px-4 py-2 text-sm font-medium rounded hover:bg-indigo-500 transition-colors ${
              pathname === "/user/projects" ? "text-white border-b-2 border-white" : "text-indigo-200"
            }`}
          >My Projects</Link>

          <Link
            href="/search"
            className={`px-4 py-2 text-sm font-medium rounded hover:bg-indigo-500 transition-colors ${
              pathname === "/search" ? "text-white border-b-2 border-white" : "text-indigo-200"
            }`}
          >Explore</Link>

          <Link
            href="/user/donations"
            className={`px-4 py-2 text-sm font-medium rounded hover:bg-indigo-500 transition-colors ${
              pathname === "/user/donations" ? "text-white border-b-2 border-white" : "text-indigo-200"
            }`}
          >Donations</Link>

          <Link
            href="/admin"
            className={`px-4 py-2 text-sm font-medium rounded hover:bg-indigo-500 transition-colors ${
              pathname === "/admin" ? "text-white border-b-2 border-white" : "text-indigo-200"
            }`}
          >Admin</Link>
        </div>
        <div className="space-x-4">
          <CustomConnectButton />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
