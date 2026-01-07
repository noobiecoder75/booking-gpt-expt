import { Sidebar } from '@/components/navigation/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-white dark:bg-clio-gray-950">
      <Sidebar />
      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="p-6 md:p-10">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}