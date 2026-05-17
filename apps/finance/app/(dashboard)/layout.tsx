import { DashboardSidebar } from "../../components/DashboardSidebar";
import { DashboardTopBar } from "../../components/DashboardTopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex flex-col">
        <DashboardTopBar />
        <main className="ml-64 p-8 min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>
    </div>
  );
}
