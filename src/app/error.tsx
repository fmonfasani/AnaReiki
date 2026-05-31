"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Algo salió mal
        </h2>
        <p className="text-gray-600 mb-6">
          Hubo un error inesperado. No te preocupes, ya lo registramos.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-xl transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
