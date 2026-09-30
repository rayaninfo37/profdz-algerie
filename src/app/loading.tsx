export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">جارٍ التحميل...</p>
      </div>
    </div>
  );
}

