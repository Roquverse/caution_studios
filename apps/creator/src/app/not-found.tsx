import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-4xl font-extrabold text-[#2dd4bf] font-mono">404</h1>
        <h2 className="text-xl font-bold text-white">Creator Studio Page Not Found</h2>
        <p className="text-xs text-zinc-400">
          The requested creator resource, track, or contract was not found.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md text-xs font-semibold bg-zinc-100 text-zinc-900 hover:bg-zinc-200 h-9 px-4 py-2 transition-colors mt-2"
        >
          Return to Studio Dashboard
        </Link>
      </div>
    </div>
  );
}
