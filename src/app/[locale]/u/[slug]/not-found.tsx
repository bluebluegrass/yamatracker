import Link from 'next/link';

export default function PublicProfileNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-3xl font-semibold text-gray-900">Profile not found</h1>
        <p className="text-gray-600">
          We couldn't find a public profile for that slug. It might be private or does not exist yet.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
        >
          Explore Yamatracker
        </Link>
      </div>
    </div>
  );
}
