import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import Header from "./Header";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

const MainLayoutContent = () => {
  const { collapsed } = useSidebar();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar - only visible on lg+ screens */}
      <AppSidebar />
      
      {/* Main content area - adjusts based on sidebar state */}
      <div 
        className={cn(
          "flex-1 w-full transition-all duration-300",
          collapsed 
            ? "lg:ml-16" 
            : "lg:ml-64 xl:ml-72 2xl:ml-80"
        )}
      >
        <Header />
        <main className="px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8 xl:px-10 2xl:px-12">
          {/* Max width container to prevent content from stretching too wide on ultrawide monitors */}
          <div className="max-w-[1800px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const MainLayout = () => {
  return (
    <SidebarProvider>
      <MainLayoutContent />
    </SidebarProvider>
  );
};

export default MainLayout;
