// components/Sidebar.tsx
import { Building2, Home, PieChart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Sidebar() {
  return (
    <aside className="hidden w-64 bg-white p-4 shadow-md md:block">
      <div className="mb-8 flex items-center">
        <Building2 className="mr-2 h-8 w-8 text-blue-600" />
        <h1 className="text-xl font-bold">RealEstate Admin</h1>
      </div>
      <nav>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/" className="flex items-center">
            <PieChart className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start " asChild>
          <Link href="/properties" className="flex items-center">
            <Home className="mr-2 h-4 w-4" />
            Properties
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/clients" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Clients
          </Link>
        </Button>
      </nav>
    </aside>
  );
}