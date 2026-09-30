'use client';

import React from 'react';
import { X, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TermsPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export function TermsPolicyModal({ isOpen, onClose, onAccept }: TermsPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="clean-card bg-[#0D1527] border border-[#1E3A5F] w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden text-right">
        {/* Header */}
        <div className="p-5 border-b border-[#1E3A5F] flex items-center justify-between bg-[#111D38]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-700 flex items-center justify-center text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">ميثاق الاستخدام وسياسة الخصوصية</h3>
              <p className="text-xs text-stone-400">منظومة قراتي — PROF DZ التربوية الرسمية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-stone-300 leading-relaxed custom-scrollbar">
          <div className="p-3 bg-teal-950/40 border border-teal-700/50 rounded-xl text-teal-300 text-xs font-bold flex items-center justify-between">
            <span>نسخة السياسة المعتمدة: الإصدار الرسمي 2.0 (v2.0-2026)</span>
            <span className="text-[10px] font-mono text-teal-400">سياسة سارية ومعتمدة</span>
          </div>

          <section className="space-y-1.5">
            <h4 className="text-sm font-bold text-teal-300">1. طبيعة المنصة</h4>
            <p className="text-xs text-stone-300">
              PROF DZ هي منصة تعليمية واجتماعية تربط بين المستخدمين، ومنهم الأساتذة والطلاب والأولياء، وتوفر أدوات لاكتشاف الحسابات والمحتوى التعليمي والتواصل بين المستخدمين. PROF DZ ليست طرفًا في أي اتفاق أو علاقة تعليمية أو تجارية تنشأ مباشرة بين المستخدمين.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="text-sm font-bold text-teal-300">2. مسؤولية الحساب</h4>
            <p className="text-xs text-stone-300">
              كل مستخدم مسؤول عن صحة البيانات والمعلومات والمحتوى الذي يقدمه، وعن الحفاظ على سرية بيانات الدخول، وعن جميع الأنشطة التي تتم من خلال حسابه.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="text-sm font-bold text-teal-300">3. مسؤولية الأستاذ</h4>
            <p className="text-xs text-stone-300">
              الأستاذ مسؤول بالكامل عن المعلومات التي يقدمها عن نفسه، مؤهلاته، خبراته، مواده، أسعاره، خدماته، منتجاته ومحتواه التعليمي، وعن أي التزام أو خدمة يقدمها للمستخدمين.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="text-sm font-bold text-teal-300">4. العلاقة بين الأستاذ والطالب</h4>
            <p className="text-xs text-stone-300">
              PROF DZ توفر وسيلة للتواصل والاكتشاف ولا تضمن أو تضمن مسبقًا نجاح أي علاقة تعليمية بين الأستاذ والطالب. أي اتفاق حول الدروس، الأسعار، المواعيد، المحتوى، الجودة، النتائج أو طريقة الدفع يتم بين الأطراف المعنية مباشرة.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="text-sm font-bold text-teal-300">5. المدفوعات والتحويلات الخارجية</h4>
            <p className="text-xs text-stone-300">
              PROF DZ ليست طرفًا في أي تحويل مالي أو دفع أو استرداد يتم مباشرة بين الأستاذ والطالب أو خارج أنظمة PROF DZ. لا تتحمل PROF DZ مسؤولية الخلافات أو الخسائر أو الاحتيال الناتج عن معاملات مالية تتم خارج المنصة.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="text-sm font-bold text-teal-300">6. جودة الخدمات والنتائج التعليمية</h4>
            <p className="text-xs text-stone-300">
              لا تضمن PROF DZ مستوى معينًا من جودة التدريس أو النتائج التعليمية أو نجاح الطالب. شارة التحقق لا تعني أن PROF DZ تضمن جودة الأستاذ أو خدماته، وإنما تشير فقط إلى إتمام عملية التحقق المعتمدة في المنصة.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="text-sm font-bold text-teal-300">7. المحتوى والملكية الفكرية</h4>
            <p className="text-xs text-stone-300">
              المستخدم مسؤول عن امتلاكه أو امتلاكه الحق في نشر أي نصوص أو صور أو فيديوهات أو ملفات أو مواد تعليمية يرفعها إلى PROF DZ. لا يجوز نشر مواد تنتهك حقوق الملكية الفكرية أو الخصوصية أو حقوق الآخرين.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="text-sm font-bold text-teal-300">8. الاستخدام الممنوع</h4>
            <p className="text-xs text-stone-300">
              يُمنع استخدام PROF DZ لانتحال الشخصية، الاحتيال، نشر معلومات مضللة عمدًا، إساءة استخدام المنصة، محاولة الوصول غير المصرح به إلى حسابات أو بيانات الآخرين، أو رفع ملفات ضارة أو محتوى مخالف للقانون.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="text-sm font-bold text-teal-300">9. التواصل الخارجي</h4>
            <p className="text-xs text-stone-300">
              قد توفر PROF DZ وسائل تواصل مثل WhatsApp أو Telegram. عند انتقال المستخدم إلى خدمة خارجية، يخضع استخدام تلك الخدمة لشروط وسياسات مزودها، ولا تتحمل PROF DZ مسؤولية ما يحدث داخل تلك الخدمات.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="text-sm font-bold text-teal-300">10. الإشراف والإجراءات الإدارية</h4>
            <p className="text-xs text-stone-300">
              يجوز لـPROF DZ اتخاذ إجراءات لحماية المنصة والمستخدمين، بما في ذلك تقييد أو تعليق أو إيقاف الحسابات أو المحتوى عند وجود مخالفة أو خطر أمني أو إساءة استخدام، وفقًا للسياسات والإجراءات المعمول بها.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="text-sm font-bold text-teal-300">11. التحقق</h4>
            <p className="text-xs text-stone-300">
              قد تطلب PROF DZ مستندات للتحقق من الهوية أو المؤهلات. تقديم المستندات لا يعني ضمان قبول الطلب، وتحتفظ PROF DZ بحق مراجعة المعلومات والتحقق منها وفق إجراءاتها.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="text-sm font-bold text-teal-300">12. البيانات والخصوصية</h4>
            <p className="text-xs text-stone-300">
              تجمع PROF DZ البيانات اللازمة لإنشاء الحساب وتشغيل المنصة وتحسين الخدمات وحماية الأمن ومنع إساءة الاستخدام. يتم التعامل مع البيانات وفق الغرض الذي جُمعت من أجله وبما يتوافق مع المتطلبات القانونية والسياسات المعمول بها.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="text-sm font-bold text-teal-300">13. الصور والملفات</h4>
            <p className="text-xs text-stone-300">
              المستخدم مسؤول عن الملفات التي يرفعها. يجب ألا تحتوي الملفات على برمجيات ضارة أو محتوى غير قانوني أو بيانات شخصية لا يملك المستخدم الحق في نشرها.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="text-sm font-bold text-teal-300">14. حدود مسؤولية المنصة</h4>
            <p className="text-xs text-stone-300">
              PROF DZ تبذل جهودًا معقولة للحفاظ على الخدمة وأمنها، لكنها لا تضمن أن الخدمة ستعمل دون انقطاع أو أخطاء في جميع الأوقات. إلى الحد الذي يسمح به القانون، لا تتحمل PROF DZ المسؤولية عن الأضرار أو الخسائر الناتجة عن علاقات أو اتفاقات أو معاملات مباشرة بين المستخدمين.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="text-sm font-bold text-teal-300">15. تحديث السياسات</h4>
            <p className="text-xs text-stone-300">
              قد يتم تحديث هذه الشروط والسياسات عند الحاجة. يجب حفظ نسخة أو رقم إصدار السياسة التي وافق عليها المستخدم، ويجب أن يكون المستخدم قادرًا على معرفة النسخة التي قبلها.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="text-sm font-bold text-teal-300">16. الموافقة</h4>
            <p className="text-xs text-stone-300">
              باستخدام PROF DZ وإنشاء الحساب، يقر المستخدم بأنه قرأ الشروط وسياسة الخصوصية ووافق عليها، وأن البيانات التي قدمها صحيحة، وأنه يتحمل مسؤولية استخدامه للمنصة.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E3A5F] bg-[#111D38] flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-stone-300">
            إغلاق
          </Button>
          {onAccept && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
            >
              أوافق على الشروط والسياسة
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
