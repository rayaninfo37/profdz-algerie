import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getUserLibrary } from '@/lib/entitlement';
import { Library, BookOpen, Video, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export const revalidate = 0;

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const libraryProducts = await getUserLibrary(user.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-stone-100">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-white flex items-center gap-2">
          <Library className="w-8 h-8 text-teal-400" /> مكتبتي الرقمية (My Digital Library) ({libraryProducts.length})
        </h1>
        <p className="text-sm text-stone-300">
          جميع الكتب، الدورات، والملفات الرقمية التي تملك حق الوصول إليها على منصة PROF DZ.
        </p>
      </div>

      {libraryProducts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {libraryProducts.map((product) => (
            <div key={product.id} className="clean-card p-6 space-y-6 text-stone-100 bg-[#111D38] border border-[#1E3A5F]">
              <div className="flex items-start gap-4">
                <img
                  src={product.coverImage || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&auto=format&fit=crop&q=80'}
                  alt={product.title}
                  className="w-20 h-20 rounded-2xl object-cover border border-slate-700"
                />
                <div className="space-y-1">
                  <div className="flex gap-1.5">
                    <Badge variant="teal" size="sm">{product.subject}</Badge>
                    <Badge variant="amber" size="sm">{product.productType}</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight">{product.title}</h3>
                  <p className="text-xs text-teal-300 font-semibold">المؤلف: {product.creatorName}</p>
                </div>
              </div>

              {/* Assets & Course Player */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">محتوى المنتج المحمي:</h4>

                {/* PDF Assets */}
                {product.assets && product.assets.length > 0 && (
                  <div className="space-y-2">
                    {product.assets.map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                        <span className="flex items-center gap-2 font-semibold text-stone-200">
                          <FileText className="w-4 h-4 text-teal-400" /> {asset.title}
                        </span>
                        <a href={asset.fileUrl} download className="text-teal-400 font-bold hover:underline">
                          تحميل (Download)
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* Video Course Modules */}
                {product.modules && product.modules.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-bold text-teal-400 flex items-center gap-1">
                      <Video className="w-4 h-4" /> مشغل الدورات الفيديو (Course Player)
                    </span>
                    {product.modules.map((m) => (
                      <div key={m.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-white">{m.title}</span>
                        {m.lessons.map((l) => (
                          <div key={l.id} className="space-y-2 p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                            <div className="flex items-center justify-between font-semibold text-teal-300">
                              <span>{l.title}</span>
                              <Badge variant="teal" size="sm">Access Granted</Badge>
                            </div>
                            {l.content && <p className="text-stone-300 text-[11px] leading-relaxed">{l.content}</p>}
                            {l.videoUrl && (
                              <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-700 mt-2">
                                <iframe
                                  src={l.videoUrl}
                                  title={l.title}
                                  className="w-full h-full"
                                  allowFullScreen
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center clean-card space-y-4 max-w-lg mx-auto bg-[#111D38] border border-[#1E3A5F]">
          <div className="w-12 h-12 rounded-2xl bg-teal-950 border border-teal-700 text-teal-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">مكتبتك فارغة حالياً</h3>
          <p className="text-xs text-stone-300">
            تصفح متجر الكتب والمنتجات الرقمية واكتشف الموارد المجانية أو اشتر الكتب التعليمية للبدء.
          </p>
          <Link href="/products">
            <Button variant="primary" size="md" className="bg-teal-600 hover:bg-teal-700 text-white font-bold">
              اكتشف المنتجات الرقمية الآن
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}