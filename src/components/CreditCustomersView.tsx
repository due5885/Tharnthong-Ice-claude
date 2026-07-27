import React from 'react';
import { CreditTermDays, CustomerAccount, DeliveryRecord } from '../types';

interface CreditCustomersViewProps {
  customers: CustomerAccount[];
  deliveries: DeliveryRecord[];
  onUpdateCustomer: (id: string, updated: Partial<CustomerAccount>) => void;
  onShowToast: (msg: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

interface CreditBillRow {
  id: string;
  date: string;
  totalAmount: number;
  summaryText: string;
}

interface CreditCustomerGroup {
  customer: CustomerAccount;
  bills: CreditBillRow[];
}

const CREDIT_TERM_OPTIONS: CreditTermDays[] = [5, 7, 10, 15, 'monthly'];

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

function buildCreditGroups(
  customers: CustomerAccount[],
  deliveries: DeliveryRecord[],
  selectedDate: string
): CreditCustomerGroup[] {
  const creditBills = deliveries.filter((d) => d.status === 'Credit');
  const groups: CreditCustomerGroup[] = [];

  const findCustomer = (bill: DeliveryRecord): CustomerAccount | undefined =>
    (bill.customerId && customers.find((c) => c.id === bill.customerId)) ||
    customers.find((c) => c.name === bill.customerName);

  creditBills.forEach((bill) => {
    const customer = findCustomer(bill);
    if (!customer) return; // customer no longer exists (deleted) — skip

    let group = groups.find((g) => g.customer.id === customer.id);
    if (!group) {
      group = { customer, bills: [] };
      groups.push(group);
    }
    group.bills.push({
      id: bill.id,
      date: bill.date,
      totalAmount: bill.totalAmount,
      summaryText: bill.summaryText,
    });
  });

  // Fallback: customers whose current ledger row is "Credit" but have no matching dated bill yet
  // (e.g. status set outside the normal confirm flow) — still show them so nothing silently disappears.
  customers.forEach((customer) => {
    if (customer.status !== 'Credit') return;
    if (groups.some((g) => g.customer.id === customer.id)) return;
    groups.push({
      customer,
      bills: [
        {
          id: `fallback-${customer.id}`,
          date: customer.lastUpdated ? customer.lastUpdated.slice(0, 10) : selectedDate,
          totalAmount: customer.totalAmount,
          summaryText: '',
        },
      ],
    });
  });

  groups.forEach((g) => g.bills.sort((a, b) => (a.date < b.date ? 1 : -1)));
  groups.sort((a, b) => a.customer.name.localeCompare(b.customer.name, 'th'));
  return groups;
}

export const CreditCustomersView: React.FC<CreditCustomersViewProps> = ({
  customers,
  deliveries,
  onUpdateCustomer,
  onShowToast,
  selectedDate,
  onDateChange,
}) => {
  const groups = buildCreditGroups(customers, deliveries, selectedDate);

  const handleTermChange = (customer: CustomerAccount, value: string) => {
    const term: CreditTermDays = value === 'monthly' ? 'monthly' : (Number(value) as CreditTermDays);
    onUpdateCustomer(customer.id, { creditTermDays: term });
    onShowToast(`ตั้งเงื่อนไขเครดิตของ "${customer.name}" เป็น ${termLabel(term)} เรียบร้อยแล้ว`);
  };

  const handleExportCsv = () => {
    const header = ['รหัส', 'ชื่อลูกค้า', 'สายส่ง', 'วันที่ลงบิล', 'ยอดบิล', 'เงื่อนไขเครดิต', 'วันครบกำหนดชำระ'];
    const rows: string[][] = [];
    groups.forEach(({ customer, bills }) => {
      bills.forEach((bill) => {
        const due = computeDueDate(bill.date, customer.creditTermDays);
        rows.push([
          customer.code,
          customer.name,
          customer.route,
          bill.date,
          bill.totalAmount.toString(),
          termLabel(customer.creditTermDays),
          due ? formatThaiDate(due) : '-',
        ]);
      });
    });
    downloadCsv([header, ...rows], `ลูกค้าเครดิต-${selectedDate}.csv`);
    onShowToast('ดาวน์โหลดไฟล์รายชื่อลูกค้าเครดิตเรียบร้อยแล้ว');
  };

  const handleCopyText = async () => {
    const lines = [`รายชื่อลูกค้าเครดิต ณ วันที่ ${selectedDate}`, ''];
    groups.forEach(({ customer, bills }) => {
      lines.push(`• ${customer.name} (${customer.route}) — เงื่อนไข ${termLabel(customer.creditTermDays)}`);
      bills.forEach((bill) => {
        const due = computeDueDate(bill.date, customer.creditTermDays);
        lines.push(
          `   - วันที่ ${bill.date} ยอด ฿${bill.totalAmount.toLocaleString()}${
            due ? ` — ครบกำหนด ${formatThaiDate(due)}` : ''
          }`
        );
      });
    });
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
            disabled={groups.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#1E3A5F] rounded-xl text-xs font-bold transition-all border border-[#CBD5E1] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm text-[#0284C7]">download</span>
            ดาวน์โหลด Excel/CSV
          </button>

          <button
            onClick={handleCopyText}
            disabled={groups.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#1E3A5F] rounded-xl text-xs font-bold transition-all border border-[#CBD5E1] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm text-[#0284C7]">content_copy</span>
            คัดลอกข้อความส่ง LINE
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {groups.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-[#D2E0EB] text-center text-[#64748B] font-medium text-sm">
            ยังไม่มีลูกค้าที่ลงบัญชีเป็น "เครดิต" ในระบบ — พอลูกน้องลงบัญชีลูกค้าเป็นเครดิตในหน้า "ลงบัญชีลูกค้า" รายชื่อจะขึ้นที่นี่อัตโนมัติ
          </div>
        ) : (
          groups.map(({ customer, bills }) => {
            const groupTotal = bills.reduce((sum, b) => sum + b.totalAmount, 0);
            const dueDates = bills.map((b) => computeDueDate(b.date, customer.creditTermDays)).filter(Boolean) as Date[];
            const isOverdue = dueDates.some((d) => d.getTime() < new Date().setHours(0, 0, 0, 0));

            return (
              <div
                key={customer.id}
                className="bg-white rounded-2xl p-4 border border-[#D2E0EB] hover:border-[#0284C7] shadow-xs transition-all space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-[#F1F5F9]">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-[#1E3A5F]">{customer.name}</span>
                      {isOverdue && (
                        <span className="text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] px-2 py-0.5 rounded-full">
                          เกินกำหนดชำระ
                        </span>
                      )}
                      <span className="text-[10px] font-bold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] px-2 py-0.5 rounded-full">
                        {bills.length} บิลค้าง
                      </span>
                    </div>
                    <span className="text-xs text-[#64748B] font-medium">
                      สายส่ง: {customer.route} • รหัส {customer.code}
                    </span>
                    <div className="mt-1 font-bold text-lg text-[#0284C7] data-mono">
                      รวม ฿ {groupTotal.toLocaleString()}
                    </div>
                  </div>

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
                </div>

                <div className="space-y-1.5">
                  {bills.map((bill) => {
                    const due = computeDueDate(bill.date, customer.creditTermDays);
                    const billOverdue = due ? due.getTime() < new Date().setHours(0, 0, 0, 0) : false;
                    return (
                      <div
                        key={bill.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#1E3A5F] data-mono">{bill.date}</span>
                          {bill.summaryText && <span className="text-[#64748B]">{bill.summaryText}</span>}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-bold text-[#0284C7] data-mono">
                            ฿ {bill.totalAmount.toLocaleString()}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-lg font-bold ${
                              billOverdue ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#E0F2FE] text-[#0369A1]'
                            }`}
                          >
                            {due ? `ครบกำหนด ${formatThaiDate(due)}` : 'ยังไม่กำหนดวัน'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
