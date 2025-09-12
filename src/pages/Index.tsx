import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "./Dashboard";

const Index = () => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background to-surface">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Dashboard />
      </main>
    </div>
  );
};

export default Index;
