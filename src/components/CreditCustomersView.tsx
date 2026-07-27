import React from 'react';
import { CreditTermDays, CustomerAccount } from '../types';

interface CreditCustomersViewProps {
  customers: CustomerAccount[];
  onUpdateCustomer: (id: string, updated: Partial<CustomerAccount>) => void;
  onShowToast: (msg: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const CREDIT_TERM_OPTIONS: CreditTermDays[] = [5, 7, 10, 15, 'monthly'];

function baseDateFor(customer: CustomerAccount, selectedDate: string): string {
  return customer.lastUpdated ? customer.lastUpdated.slice(0, 10) : selectedDate;
}

function computeDueDate(baseDate: string, term?: CreditTermDays): Date | null {
  if (!term) return null;
  const d = new Date(baseDate);
  if (isNaN(d.getTime())) return null;
  if (term === 'monthly') {
    d.setMonth(d.getMonth() + 1);
  } else {
    d.setDate(d.getDate() + term);
  }
  return d;
}

function formatThaiDate(d: Date): string {
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function termLabel(term?: CreditTermDays): string {
  if (!term) return 'ยังไม่กำหนด';
  return term === 'monthly' ? 'รายเดือน' : `${term} วัน`;
}

function downloadCsv(rows: string[][], filename: string) {
  const csvBody = rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csvBody], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const CreditCustomersView: React.FC<CreditCustomersViewProps> = ({
  customers,
  onUpdateCustomer,
  onShowToast,
  selectedDate,
  onDateChange,
}) => {
  const creditCustomers = customers.filter((c) => c.status === 'Credit');

  const handleTermChange = (customer: CustomerAccount, value: string) => {
    const term: CreditTermDays = value === 'monthly' ? 'monthly' : (Number(value) as CreditTermDays);
    onUpdateCustomer(customer.id, { creditTermDays: term });
    onShowToast(`ตั้งเงื่อนไขเครดิตของ "${customer.name}" เป็น ${termLabel(term)} เรียบร้อยแล้ว`);
  };

  const handleExportCsv = () => {
    const header = ['รหัส', 'ชื่อลูกค้า', 'สายส่ง', 'ยอดค้างชำระ', 'เงื่อนไขเครดิต', 'วันครบกำหนดชำระ'];
    const rows = creditCustomers.map((c) => {
      const due = computeDueDate(baseDateFor(c, selectedDate), c.creditTermDays);
      return [
        c.code,
        c.name,
        c.route,
        c.totalAmount.toString(),
        termLabel(c.creditTermDays),
        due ? formatThaiDate(due) : '-',
      ];
    });
    downloadCsv([header, ...rows], `ลูกค้าเครดิต-${selectedDate}.csv`);
    onShowToast('ดาวน์โหลดไฟล์รายชื่อลูกค้าเครดิตเรียบร้อยแล้ว');
  };

  const handleCopyText = async () => {
    const lines = [
      `รายชื่อลูกค้าเครดิต ณ วันที่ ${selectedDate}`,
      '',
      ...creditCustomers.map((c) => {
        const due = computeDueDate(baseDateFor(c, selectedDate), c.creditTermDays);
        return `• ${c.name} (${c.route}) ยอด ฿${c.totalAmount.toLocaleString()} — เงื่อนไข ${termLabel(
          c.creditTermDays
        )}${due ? ` — ครบกำหนด ${formatThaiDate(due)}` : ''}`;
      }),
    ];
    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      onShowToast('คัดลอกข้อความแล้ว นำไปวางส่งทาง LINE ได้เลย');
      return;
    } catch {
      // Fall through to legacy fallback below (older browsers / blocked Clipboard API)
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      onShowToast(
        copied ? 'คัดลอกข้อความแล้ว นำไปวางส่งทาง LINE ได้เลย' : 'คัดลอกข้อความไม่สำเร็จ ลองอีกครั้ง'
      );
    } catch {
      onShowToast('คัดลอกข้อความไม่สำเร็จ ลองอีกครั้ง');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#1E3A5F] font-sans flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0284C7]">event_repeat</span>
            ลูกค้าเครดิต
          </h2>
          <div className="flex items-center gap-2 mt-1 text-[#1E293B] text-xs md:text-sm">
            <span className="material-symbols-outlined text-sm text-[#0284C7]">calendar_today</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="data-mono font-bold bg-[#E0F2FE] text-[#0369A1] px-2 py-0.5 rounded-lg border border-[#BAE6FD] cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCsv}
            disabled={creditCustomers.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#1E3A5F] rounded-xl text-xs font-bold transition-all border border-[#CBD5E1] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm text-[#0284C7]">download</span>
            ดาวน์โหลด Excel/CSV
          </button>

          <button
            onClick={handleCopyText}
            disabled={creditCustomers.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#1E3A5F] rounded-xl text-xs font-bold transition-all border border-[#CBD5E1] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm text-[#0284C7]">content_copy</span>
            คัดลอกข้อความส่ง LINE
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {creditCustomers.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-[#D2E0EB] text-center text-[#64748B] font-medium text-sm">
            ยังไม่มีลูกค้าที่ลงบัญชีเป็น "เครดิต" ในระบบ — พอลูกน้องลงบัญชีลูกค้าเป็นเครดิตในหน้า "ลงบัญชีลูกค้า" รายชื่อจะขึ้นที่นี่อัตโนมัติ
          </div>
        ) : (
          creditCustomers.map((customer) => {
            const dueDate = computeDueDate(baseDateFor(customer, selectedDate), customer.creditTermDays);
            const isOverdue = dueDate ? dueDate.getTime() < new Date().setHours(0, 0, 0, 0) : false;

            return (
              <div
                key={customer.id}
                className="bg-white rounded-2xl p-4 border border-[#D2E0EB] hover:border-[#0284C7] shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base text-[#1E3A5F]">{customer.name}</span>
                    {isOverdue && (
                      <span className="text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] px-2 py-0.5 rounded-full">
                        เกินกำหนดชำระ
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#64748B] font-medium">
                    สายส่ง: {customer.route} • รหัส {customer.code}
                  </span>
                  <div className="mt-1 font-bold text-lg text-[#0284C7] data-mono">
                    ฿ {customer.totalAmount.toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-[#64748B] uppercase">เงื่อนไขเครดิต</span>
                    <select
                      value={customer.creditTermDays ?? ''}
                      onChange={(e) => handleTermChange(customer, e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-white text-xs font-bold text-[#1E3A5F] cursor-pointer focus:ring-2 focus:ring-[#0284C7] outline-none"
                    >
                      <option value="" disabled>
                        เลือกเงื่อนไข
                      </option>
                      {CREDIT_TERM_OPTIONS.map((term) => (
                        <option key={term} value={term}>
                          {termLabel(term)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-[#64748B] uppercase">ครบกำหนดชำระ</span>
                    <span
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        isOverdue ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#F1F5F9] text-[#1E3A5F]'
                      }`}
                    >
                      {dueDate ? formatThaiDate(dueDate) : 'ยังไม่กำหนด'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
