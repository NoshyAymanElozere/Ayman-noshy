import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Printer,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Receipt,
  Loader2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { InvoiceData, InvoiceItem } from './types/invoice';
import { numberToArabicWords } from './utils/tafqeet';

const STORAGE_KEY = 'ayman_noshy_system_invoice_v2';

const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultInvoice = (): InvoiceData => ({
  invoiceNumber: '001',
  invoiceType: 'sale',
  invoiceDate: getTodayDate(),
  sellerName: 'أيمن نصحي',
  sellerPhone: '',
  buyerName: '',
  buyerPhone: '',
  items: [
    {
      id: 'item-1',
      name: 'بسكوت',
      unitPrice: 100,
      quantity: 5,
      total: 500,
    },
  ],
  discount: '',
  notes: 'شكراً لتعاملكم التجاري معنا.',
});

export default function App() {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const [invoice, setInvoice] = useState<InvoiceData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return getDefaultInvoice();
  });

  // Save changes locally
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoice));
    } catch {
      // storage unavailable
    }
  }, [invoice]);

  // Calculations
  const subtotal = invoice.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const discountVal = typeof invoice.discount === 'number' ? invoice.discount : 0;
  const netTotal = Math.max(0, subtotal - discountVal);
  const tafqeetText = numberToArabicWords(netTotal);

  // Field handlers
  const handleItemChange = (
    id: string,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    setInvoice((prev) => {
      const newItems = prev.items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'unitPrice' || field === 'quantity') {
          const price = field === 'unitPrice' ? (value === '' ? 0 : Number(value)) : Number(item.unitPrice) || 0;
          const qty = field === 'quantity' ? (value === '' ? 0 : Number(value)) : Number(item.quantity) || 0;
          updated.total = price * qty;
        }
        return updated;
      });
      return { ...prev, items: newItems };
    });
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      name: '',
      unitPrice: '',
      quantity: 1,
      total: 0,
    };
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleDeleteItem = (id: string) => {
    if (invoice.items.length <= 1) {
      setInvoice((prev) => ({
        ...prev,
        items: [{ id: `item-${Date.now()}`, name: '', unitPrice: '', quantity: 1, total: 0 }],
      }));
      return;
    }
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const handleResetToExample = () => {
    setInvoice(getDefaultInvoice());
    showToast('تمت استعادة المثال التجريبي (بسكوت 100 × 5 = 500)');
  };

  const handleClearInvoice = () => {
    setInvoice({
      invoiceNumber: String(Math.floor(Math.random() * 900) + 100),
      invoiceType: invoice.invoiceType,
      invoiceDate: getTodayDate(),
      sellerName: 'أيمن نصحي',
      sellerPhone: '',
      buyerName: '',
      buyerPhone: '',
      items: [
        {
          id: `item-${Date.now()}`,
          name: '',
          unitPrice: '',
          quantity: 1,
          total: 0,
        },
      ],
      discount: '',
      notes: 'شكراً لتعاملكم التجاري معنا.',
    });
    showToast('تم فتح فاتورة جديدة فارغة');
  };

  const showToast = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 4500);
  };

  // Direct Automatic PDF Download (ينزل الفاتورة تلقائي على الموبايل والكمبيوتر)
  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      const fileName = `فاتورة_${invoice.invoiceType === 'sale' ? 'بيع' : 'شراء'}_ايمن_نصحي_${invoice.invoiceNumber || '001'}.pdf`;
      pdf.save(fileName);
      showToast(`تم تنزيل الفاتورة تلقائياً: ${fileName}`);
    } catch (err) {
      console.error('PDF error:', err);
      // Fallback to browser print dialog
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Direct print window
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 pb-24 md:pb-12 print:bg-white print:p-0 print:m-0 print:pb-0">
      
      {/* Top System Bar - Hidden during print */}
      <header className="no-print bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
        <div className="max-w-4xl mx-auto px-3 py-2.5 sm:px-4 flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 text-white p-1.5 rounded-md flex items-center justify-center">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                  أيمن نصحي
                </span>
                <span className="text-[10px] bg-slate-800 text-emerald-400 font-semibold px-1.5 py-0.2 rounded border border-slate-700">
                  نظام الفواتير
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                إنشاء وتنزيل فواتير البيع والشراء بالجنيه المصري (PDF تلقائي)
              </p>
            </div>
          </div>

          {/* Action buttons header */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              type="button"
              className="cursor-pointer inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg shadow-sm active:scale-95 transition disabled:opacity-70"
              title="تنزيل الفاتورة مباشرة بصيغة PDF على جهازك"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري التنزيل...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>تنزيل PDF تلقائي</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              type="button"
              className="cursor-pointer inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1.5 sm:py-2 rounded-lg border border-slate-700 transition"
              title="فتح نافذة الطباعة"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">طباعة</span>
            </button>

            <button
              onClick={handleResetToExample}
              type="button"
              className="cursor-pointer inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2 py-1.5 rounded-lg border border-slate-700 transition"
              title="تعبئة مثال تجريبي"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="hidden md:inline">مثال</span>
            </button>

            <button
              onClick={handleClearInvoice}
              type="button"
              className="cursor-pointer text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              title="فاتورة جديدة"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-2 sm:px-4 pt-3 sm:pt-5 print:max-w-none print:p-0 print:m-0">
        
        {/* Toast feedback */}
        {noticeMessage && (
          <div className="no-print mb-3 bg-emerald-700 text-white text-xs sm:text-sm rounded-lg p-2.5 px-3 flex items-center justify-between shadow-md transition animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{noticeMessage}</span>
            </div>
            <button
              onClick={() => setNoticeMessage(null)}
              className="text-emerald-200 hover:text-white text-xs px-1.5 py-0.5"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* System Settings & Quick Toggles (Clean, Compact, Mobile-Optimized) */}
        <div className="no-print mb-3 bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            
            {/* Invoice Type Radio Tabs */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-600">نوع الفاتورة:</span>
              <div className="inline-flex rounded-md bg-slate-100 p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setInvoice((prev) => ({ ...prev, invoiceType: 'sale' }))}
                  className={`cursor-pointer px-2.5 py-1 text-xs font-bold rounded transition ${
                    invoice.invoiceType === 'sale'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  فاتورة بيع
                </button>
                <button
                  type="button"
                  onClick={() => setInvoice((prev) => ({ ...prev, invoiceType: 'purchase' }))}
                  className={`cursor-pointer px-2.5 py-1 text-xs font-bold rounded transition ${
                    invoice.invoiceType === 'purchase'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  فاتورة شراء
                </button>
              </div>
            </div>

            {/* Quick Helper Note for Mobile */}
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>الإجمالي الحالي:</span>
              <span className="font-extrabold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                {netTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
              </span>
            </div>

          </div>
        </div>

        {/* =========================================================================
            THE SYSTEM INVOICE DOCUMENT (زي السيستم تماماً - A4 System Invoice Layout)
           ========================================================================= */}
        <div
          ref={invoiceRef}
          id="printable-invoice"
          className="invoice-paper bg-white border border-slate-300 rounded-xl shadow-md p-4 sm:p-6 md:p-8 text-slate-900 print:shadow-none print:border-none print:p-0 print:rounded-none"
        >
          {/* System Top Header */}
          <div className="border-b-2 border-slate-800 pb-3 sm:pb-4 mb-4">
            <div className="flex items-center justify-between gap-2">
              
              {/* Business Name & Header */}
              <div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-emerald-600 rounded-xs"></div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {invoice.sellerName || 'أيمن نصحي'}
                  </h2>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-600 font-semibold mt-0.5">
                  نظام إصدار الفواتير التجارية المعتمدة
                </p>
              </div>

              {/* Invoice Title & Type Badge */}
              <div className="text-left">
                <div className="inline-block border-2 border-slate-900 bg-slate-900 text-white font-black text-xs sm:text-sm px-3 py-1 rounded">
                  {invoice.invoiceType === 'sale' ? 'فاتورة بيع' : 'فاتورة شراء'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  SYSTEM INVOICE
                </div>
              </div>

            </div>
          </div>

          {/* System Metadata Bar (رقم الفاتورة، التاريخ، اسم البائع/المشتري) */}
          <div className="bg-slate-50 print-bg-slate border border-slate-300 rounded-lg p-2.5 sm:p-3 mb-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              
              {/* Invoice Number */}
              <div>
                <span className="block text-[10px] font-bold text-slate-500">رقم الفاتورة:</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[11px] text-slate-400 font-bold">#</span>
                  <input
                    type="text"
                    value={invoice.invoiceNumber}
                    onChange={(e) => setInvoice((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                    placeholder="001"
                    className="invoice-input w-full font-bold text-slate-900 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs focus:outline-emerald-500"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <span className="block text-[10px] font-bold text-slate-500">تاريخ الإصدار:</span>
                <input
                  type="date"
                  value={invoice.invoiceDate}
                  onChange={(e) => setInvoice((prev) => ({ ...prev, invoiceDate: e.target.value }))}
                  className="invoice-input w-full font-bold text-slate-900 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs focus:outline-emerald-500 mt-0.5"
                />
              </div>

              {/* Seller Name */}
              <div>
                <span className="block text-[10px] font-bold text-slate-500">
                  {invoice.invoiceType === 'sale' ? 'اسم البائع:' : 'اسم المستلم:'}
                </span>
                <input
                  type="text"
                  value={invoice.sellerName}
                  onChange={(e) => setInvoice((prev) => ({ ...prev, sellerName: e.target.value }))}
                  placeholder="أيمن نصحي"
                  className="invoice-input w-full font-bold text-slate-900 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs focus:outline-emerald-500 mt-0.5"
                />
              </div>

              {/* Buyer Name */}
              <div>
                <span className="block text-[10px] font-bold text-slate-500">
                  {invoice.invoiceType === 'sale' ? 'اسم المشتري (العميل):' : 'اسم المورد:'}
                </span>
                <input
                  type="text"
                  value={invoice.buyerName}
                  onChange={(e) => setInvoice((prev) => ({ ...prev, buyerName: e.target.value }))}
                  placeholder="اكتب اسم المشتري..."
                  className="invoice-input w-full font-bold text-slate-900 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs focus:outline-emerald-500 mt-0.5 placeholder:text-slate-400"
                />
              </div>

            </div>
          </div>

          {/* =================== SYSTEM ITEMS TABLE (زي السيستم تماماً) =================== */}
          <div className="mb-3 overflow-x-auto border border-slate-300 rounded-lg bg-white shadow-2xs">
            <table className="w-full text-right border-collapse text-[11px] sm:text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold border-b border-slate-800">
                  <th className="py-2 px-1.5 w-7 sm:w-10 text-center">#</th>
                  <th className="py-2 px-2 sm:px-3 min-w-[120px]">بيان الصنف</th>
                  <th className="py-2 px-1.5 sm:px-2 w-18 sm:w-28 text-center">سعر الوحدة</th>
                  <th className="py-2 px-1 sm:px-2 w-12 sm:w-20 text-center">الكمية</th>
                  <th className="py-2 px-2 sm:px-3 w-20 sm:w-32 text-center">إجمالي الصنف</th>
                  <th className="no-print py-2 px-1 w-8 sm:w-10 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items.map((item, index) => (
                  <tr
                    key={item.id}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70 print-bg-slate'}
                  >
                    <td className="py-1.5 px-1 text-center font-bold text-slate-500 border-l border-slate-200 text-[10px] sm:text-xs">
                      {index + 1}
                    </td>
                    <td className="py-1.5 px-2 sm:px-3 border-l border-slate-200">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        placeholder="اسم الصنف (بسكوت)..."
                        className="invoice-input w-full font-bold text-slate-900 bg-transparent border-0 border-b border-dotted border-slate-300 focus:border-emerald-500 focus:ring-0 py-0.5 text-[11px] sm:text-xs"
                      />
                    </td>
                    <td className="py-1.5 px-1 sm:px-2 text-center border-l border-slate-200">
                      <div className="flex items-center justify-center gap-0.5">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              'unitPrice',
                              e.target.value === '' ? '' : parseFloat(e.target.value)
                            )
                          }
                          placeholder="100"
                          className="invoice-input w-12 sm:w-20 text-center font-bold text-slate-900 bg-transparent border-0 border-b border-dotted border-slate-300 focus:border-emerald-500 focus:ring-0 py-0.5 text-[11px] sm:text-xs"
                        />
                        <span className="text-[9px] text-slate-400">ج.م</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-1 sm:px-2 text-center border-l border-slate-200">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            'quantity',
                            e.target.value === '' ? '' : parseInt(e.target.value, 10)
                          )
                        }
                        placeholder="5"
                        className="invoice-input w-9 sm:w-16 text-center font-bold text-slate-900 bg-transparent border-0 border-b border-dotted border-slate-300 focus:border-emerald-500 focus:ring-0 py-0.5 text-[11px] sm:text-xs"
                      />
                    </td>
                    <td className="py-1.5 px-1.5 sm:px-3 text-center font-bold text-slate-900">
                      <span>
                        {(Number(item.total) || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-[9px] text-slate-500 font-normal mr-0.5">ج.م</span>
                    </td>
                    <td className="no-print py-1.5 px-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="cursor-pointer text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition"
                        title="حذف هذا الصنف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Item Button Row (Screen only) */}
          <div className="no-print mb-4">
            <button
              type="button"
              onClick={handleAddItem}
              className="cursor-pointer w-full py-2 px-3 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-dashed border-slate-300 hover:border-emerald-400 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.99]"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>إضافة صنف جديد (+)</span>
            </button>
          </div>

          {/* =================== SYSTEM TOTALS & TAFQEET =================== */}
          <div className="border border-slate-300 rounded-lg overflow-hidden mb-3">
            <div className="grid grid-cols-1 md:grid-cols-12">
              
              {/* Right section: Tafqeet & Notes */}
              <div className="md:col-span-7 p-3 bg-slate-50 print-bg-slate border-b md:border-b-0 md:border-l border-slate-300 space-y-2 text-xs">
                <div>
                  <span className="block text-[10px] font-extrabold text-slate-500 mb-0.5">
                    المبلغ الإجمالي بالحروف (تفقيط معتمد):
                  </span>
                  <div className="bg-white border border-slate-200 p-2 rounded font-bold text-slate-900 text-xs sm:text-sm text-right leading-relaxed">
                    {tafqeetText}
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-500 mb-0.5">
                    ملاحظات الفاتورة:
                  </span>
                  <input
                    type="text"
                    value={invoice.notes}
                    onChange={(e) => setInvoice((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="شكراً لتعاملكم التجاري معنا..."
                    className="invoice-input w-full bg-white border border-slate-200 rounded p-1.5 text-slate-800 text-xs focus:outline-emerald-500"
                  />
                </div>
              </div>

              {/* Left section: Calculations Box */}
              <div className="md:col-span-5 p-3 bg-white space-y-2 text-xs">
                
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-[11px] font-medium">مجموع الأصناف:</span>
                  <span className="font-bold text-slate-900">
                    {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-[11px] font-medium">الخصم التجاري (إن وجد):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={invoice.discount}
                      onChange={(e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          discount: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)),
                        }))
                      }
                      placeholder="0"
                      className="invoice-input w-16 text-center font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-xs focus:outline-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400">ج.م</span>
                  </div>
                </div>

                {/* Final Net Total Highlight */}
                <div className="border-t-2 border-slate-900 pt-2 mt-2">
                  <div className="bg-slate-900 text-white rounded-lg p-2.5 flex justify-between items-center">
                    <div>
                      <span className="block text-[10px] text-slate-300 font-bold">
                        الصافي النهائي المطلوب:
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-lg sm:text-xl font-black tracking-tight text-white">
                          {netTotal.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-[11px] text-emerald-400 font-bold">جنيه مصري</span>
                      </div>
                    </div>
                    <div className="text-left font-mono text-[10px] text-slate-400">
                      EGP
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* System Footer Note (No signatures, official system seal style) */}
          <div className="pt-2 text-center text-[10px] text-slate-500 border-t border-slate-200 flex flex-wrap items-center justify-between gap-1">
            <span>فاتورة معتمدة صادرة إلكترونياً - نظام فواتير أيمن نصحي</span>
            <span>تاريخ الطباعة: {invoice.invoiceDate}</span>
          </div>

        </div>

        {/* Bottom Floating Bar on Mobile (تنزيل PDF فوري بلمسة واحدة) - Hidden in Print */}
        <div className="no-print fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 sm:hidden shadow-lg flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            type="button"
            className="cursor-pointer flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition disabled:opacity-75"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري تنزيل الفاتورة...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>تنزيل الفاتورة PDF تلقائياً</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            type="button"
            className="cursor-pointer py-2.5 px-3 bg-slate-900 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 active:scale-95 transition"
            title="طباعة"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة</span>
          </button>
        </div>

      </main>
    </div>
  );
}
