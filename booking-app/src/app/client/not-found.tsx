export default function NotFound() {
  return (
    <div className="min-h-screen bg-clio-gray-50 dark:bg-clio-gray-950 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8 bg-white dark:bg-clio-gray-900 rounded-2xl border border-clio-gray-200 dark:border-clio-gray-800 shadow-strong">
        <div className="w-20 h-20 bg-clio-gray-100 dark:bg-clio-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-clio-gray-200 dark:border-clio-gray-700">
          <svg className="w-10 h-10 text-clio-gray-400 dark:text-clio-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-clio-gray-900 dark:text-white mb-4 uppercase tracking-tight">Quote Not Found</h1>
        <p className="text-clio-gray-600 dark:text-clio-gray-400 mb-8 font-medium">
          The quote you&apos;re looking for doesn&apos;t exist or has been removed from our system.
        </p>
        <div className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400 dark:text-clio-gray-500 pt-6 border-t border-clio-gray-100 dark:border-clio-gray-800">
          Please check your link or contact your travel agent for assistance.
        </div>
      </div>
    </div>
  );
}