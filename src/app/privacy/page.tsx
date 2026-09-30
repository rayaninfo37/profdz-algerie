import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'سياسة الخصوصية وحماية البيانات | PROF DZ',
  description: 'سياسة حماية البيانات والخصوصية المتبعة في منصة PROF DZ بالجزائر.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-stone-100" dir="rtl">
      {/* Header */}
      <div className="space-y-3 border-b border-slate-800 pb-6">
        <div className="p-3 bg-teal-950/80 border border-teal-600/40 rounded-xl text-xs text-teal-300 flex items-center justify-between">
          <span>تم دمج سياسة الخصوصية وشروط الاستعمال في المركز القانوني الموحد.</span>
          <Link href="/terms" className="font-bold underline text-white hover:text-teal-200">
            الانتقال لسياسات الخصوصية وشروط الاستعمال ←
          </Link>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-600/40 text-teal-300 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" /> حماية البيانات الشخصية
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">سياسة الخصوصية (Privacy Policy)</h1>
        <p className="text-sm text-stone-400">
          تلتزم PROF DZ بأعلى معايير الأمان لحماية بيانات المستخدمين ومستنداتهم الخاصة وفقاً للقوانين الجزائرية.
        </p>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-8 text-sm leading-relaxed text-stone-300">
        <section className="space-y-3 bg-[#111D38] p-6 rounded-2xl border border-[#1E3A5F]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-teal-400" />
            1. البيانات التي نقوم بجمعها
          </h2>
          <ul className="list-disc list-inside space-y-2 pr-2">
            <li><strong>بيانات التسجيل الأساسية:</strong> الاسم الكامل، البريد الإلكتروني، الولاية والبلدية، وكلمة المرور المشفرة بتقنية bcrypt.</li>
            <li><strong>بيانات الأستاذ المهنية:</strong> المواد التعليمية، سنوات الخبرة، وأرقام التواصل المباشر (واتساب/تيليغرام) التي يختار الأستاذ إتاحتها للطلاب.</li>
            <li><strong>الوثائق الخاصة:</strong> بطاقات الهوية الوطنية، الشهادات الجامعية، ووصولات الدفع التي تُرفع للتحقق.</li>
          </ul>
        </section>

        <section className="space-y-3 bg-[#111D38] p-6 rounded-2xl border border-[#1E3A5F]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            2. نظام التخزين الخاص المعزول (Private Storage Isolation)
          </h2>
          <p>
            تُحفظ وثائق الهوية الوطنية والشهادات ووصولات الدفع في مسار تخزين معزول تماماً خارج النطاق العام للويب. لا يمكن لأي طرف خارجي الوصول إلى هذه الملفات مباشرة عبر المتصفح، ولا يُسمح بالاطلاع عليها إلا لإدارة المنصة المخولة ولصاحب الحساب شخصياً عبر جلسة مشفرة وآمنة.
          </p>
        </section>

        <section className="space-y-3 bg-[#111D38] p-6 rounded-2xl border border-[#1E3A5F]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            3. عدم مشاركة البيانات أو بيعها
          </h2>
          <p>
            نلتزم التزاماً قاطعاً بعدم بيع أو تأجير أو مشاركة بيانات أي مستخدم لأي جهات إعلانية خارجية أو أطراف تجارية. تُستخدم البيانات حصرياً لتمكين تجربة التعليم والتواصل داخل منصة قراتي.
          </p>
        </section>

        <section className="space-y-3 bg-[#111D38] p-6 rounded-2xl border border-[#1E3A5F]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-teal-400" />
            4. حقوق المستخدم وإدارة الحساب
          </h2>
          <p>
            يحق لكل مستخدم تعديل بياناته، تحديث كلمة مروره، أو طلب حذف حسابه نهائياً في أي وقت عبر التواصل مع إدارة المنصة.
          </p>
        </section>
      </div>

      {/* Navigation Footer */}
      <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/terms" className="text-teal-300 hover:underline flex items-center gap-1.5 text-xs font-bold">
          <FileText className="w-4 h-4" /> الاطلاع على شروط الاستخدام المنظمة
        </Link>
        <Link href="/">
          <Button variant="outline" size="sm" className="border-slate-700 text-stone-200 gap-1 font-bold">
            العودة للرئيسية <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
