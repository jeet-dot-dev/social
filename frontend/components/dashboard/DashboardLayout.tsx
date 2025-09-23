"use client";

import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { LogOut, User, FileText, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleAuth = async () => {
    if (isAuthenticated) {
      logout();
    } else {
      router.push("/auth");
    }
  };

  const links = [
    {
      label: "Profile",
      href: "/dashboard/profile",
      icon: <User className="h-5 w-5" />,
    },
    {
      label: "Posts",
      href: "/dashboard/posts",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      label: "Create",
      href: "/dashboard/create",
      icon: <PlusCircle className="h-5 w-5" />,
    },
  ];

  return (
    <div className="bg-black">
      <div
        className={cn(
          "mx-auto flex w-full h-screen rounded-xl border border-gray-800 bg-black shadow-2xl",
          "flex-col md:flex-row"
        )}
      >
        <Sidebar open={open} setOpen={setOpen} animate={true}>
          <SidebarBody
            className="justify-between gap-10 border-gray-800 bg-black"
          >
            <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
              {/* Header */}
              <div className="flex-shrink-0 flex items-center gap-2 mb-6 mt-2 cursor-pointer" onClick={() => router.push("/")}>
                <span className="font-bold text-2xl sm:text-3xl tracking-tight text-white">
                  Social
                </span>
              </div>

              {/* Navigation links */}
              <div className="flex flex-col gap-3">
                {links.map((link, idx) => (
                  <div key={idx} className="relative group">
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full opacity-0 group-hover:opacity-100 transition-all duration-300 bg-[#126038]"
                    />
                    <SidebarLink
                      link={link}
                      className="text-gray-300 hover:text-white transition-all duration-300 rounded-xl px-4 py-3 ml-2 hover:bg-gray-800 font-medium"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Logout button at the bottom */}
            <div className="mt-auto mb-4">
              <button
                onClick={handleAuth}
                className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-gray-300 hover:text-white transition-all duration-300 w-full font-medium group relative overflow-hidden bg-gray-800 hover:bg-gray-700"
              >
                <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                <span className="transition-all duration-300">{isAuthenticated ? "Logout" : "Login"}</span>
              </button>
            </div>
          </SidebarBody>
        </Sidebar>

        {/* Main content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-8 rounded-r-xl bg-black",
            !open && "block",
            open && "hidden md:block"
          )}
        >
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}