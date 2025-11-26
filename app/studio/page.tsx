import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import UploadSection from "@/components/UploadSection";

export default function StudioPage() {
  return (
    <main className="min-h-screen bg-[#121212] overflow-x-hidden">
      <Header />
      <div className="flex pt-20">
        <Sidebar />
        <UploadSection />
      </div>
    </main>
  );
}

