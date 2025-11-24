import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 text-center">
      <div className="mb-8 p-4 rounded-full bg-gray-900 border border-gray-800">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={1.5} 
          stroke="currentColor" 
          className="w-12 h-12 text-gray-400"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      
      <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Page Not Found</h1>
      
      <p className="text-gray-400 mb-8 max-w-md text-lg">
        The link you are looking for might have expired, been deleted, or never existed.
      </p>
      
      <Link 
        href="/"
        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium border border-transparent hover:border-green-500"
      >
        Return Home
      </Link>
    </div>
  );
}
