import React, { useState } from 'react';
import {
  CustomerAccount,
  ExpenseItem,
  IceProduct,
  MonthlyFixedExpense,
  SummaryOperationsData,
} from '../types';

interface SummaryViewProps {
  summaryData: SummaryOperationsData;
  expenses: ExpenseItem[];
  monthlyExpenses: MonthlyFixedExpense[];
  customers: CustomerAccount[];
  products: IceProduct[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  icePurchaseCost: number;
  onUpdateIcePurchaseCost: (amount: number) => void;
  onAddMonthlyExpense: (name: string, amount: number) => void;
  onUpdateMonthlyExpense: (id: string, name: string, amount: number) => void;
  onDeleteMonthlyExpense: (id: string) => void;
  onNavigateToExpenses: () => void;
  onShowToast: (msg: string) => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  summaryData,
  expenses,
  monthlyExpenses,
  customers,
  products,
  selectedDate,
  onDateChange,
  icePurchaseCost,
  onUpdateIcePurchaseCost,
  onAddMonthlyExpense,
  onUpdateMonthlyExpense,
  onDeleteMonthlyExpense,
  onNavigateToExpenses,
  onShowToast,
}) => {
  const [reportType, setReportType] = useState<'daily' | 'monthly'>('daily');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => selectedDate.slice(0, 7));

  // Form for adding new fixed expense
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState<number>(0);

  // Calculate Product Quantities for all products dynamically
  const productTotals: Record<string, number> = {};
  products.forEach((p) => {
    productTotals[p.key] = 0;
  });

  customers.forEach((c) => {
    if (c.quantities) {
      Object.entries(c.quantities).forEach(([k, qty]) => {
        const val = typeof qty === 'number' ? qty : 0;
        productTotals[k] = (productTotals[k] || 0) + val;
      });
    }
  });

  // Calculate total expenses for current mode
  const totalDailyExpenseRecorded = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalFixedMonthlyExpense = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0);

  const grandTotalExpense =
    reportType === 'daily'
      ? totalDailyExpenseRecorded
      : totalDailyExpenseRecorded + totalFixedMonthlyExpense;

  // Net Profit calculation
  const calculatedNetProfit =
    summaryData.totalRevenue - (icePurchaseCost || 0) - grandTotalExpense;

  const handleAddFixedExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseName.trim()) {
      onShowToast('กรุณาระบุชื่อรายการค่าใช้จ่าย');
      return;
    }

    onAddMonthlyExpense(newExpenseName.trim(), Math.max(0, newExpenseAmount));
    setNewExpenseName('');
    setNewExpenseAmount(0);
    onShowToast(`เพิ่มรายการ "${newExpenseName}" เรียบร้อยแล้ว`);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header and Daily/Monthly Toggle */}
      <section className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D2E0EB] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#1E3A5F] flex items-center gap-2 font-sans">
              <span className="material-symbols-outlined text-[#0284C7]">analytics</span>
              สรุปภาพรวมผลการดำเนินงาน
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              เลือกรูปแบบสรุปรายวัน หรือสรุปประมวลผลรายเดือน
            </p>
          </div>

          {/* Daily vs Monthly Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-[#E2E8F0] rounded-xl border border-[#CBD5E1]">
            <button
              onClick={() => setReportType('daily')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                reportType === 'daily'
                  ? 'bg-[#1E3A5F] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#1E3A5F]'
              }`}
            >
              สรุปรายวัน
            </button>
            <button
              onClick={() => setReportType('monthly')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                reportType === 'monthly'
                  ? 'bg-[#1E3A5F] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#1E3A5F]'
              }`}
            >
              สรุปรายเดือน
            </button>
          </div>
        </div>

        {/* Date / Month Picker Filter */}
        <div className="flex items-center gap-3 pt-2 border-t border-[#E2E8F0]">
          {reportType === 'daily' ? (
            <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#CBD5E1] px-3 py-1.5 rounded-xl">
              <span className="material-symbols-outlined text-sm text-[#0284C7]">calendar_today</span>
              <span className="text-xs font-bold text-[#1E3A5F]">เลือกวัน:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#0284C7] data-mono outline-none cursor-pointer"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#CBD5E1] px-3 py-1.5 rounded-xl">
              <span className="material-symbols-outlined text-sm text-[#0284C7]">calendar_month</span>
              <span className="text-xs font-bold text-[#1E3A5F]">เลือกเดือน:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#0284C7] data-mono outline-none cursor-pointer"
              />
            </div>
          )}

          <span className="text-xs font-semibold text-[#64748B]">
            {reportType === 'daily' ? `ข้อมูลประจำวันที่ ${selectedDate}` : `ประมวลผลประจำเดือน ${selectedMonth}`}
          </span>
        </div>
      </section>

      {/* Top Main Bento Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Total Revenue Big Card */}
        <div className="lg:col-span-2 bg-[#1E3A5F] text-white p-6 rounded-2xl shadow-xs flex flex-col justify-between relative overflow-hidden min-h-[190px]">
          <div className="absolute top-2 right-2 p-2 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-9xl fill-1">payments</span>
          </div>

          <div>
            <p className="text-xs font-bold tracking-widest uppercase opacity-80 text-[#7DD3FC]">
              {reportType === 'daily' ? 'TOTAL REVENUE (รายรับรวมวันนี้)' : 'MONTHLY REVENUE (รายรับรวมเดือนนี้)'}
            </p>
            <h3 className="text-3xl md:text-4xl font-bold mt-1 tracking-tight data-mono">
              ฿ {summaryData.totalRevenue.toLocaleString()}.00
            </h3>
          </div>

          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-white/20">
            <div className="flex flex-col">
              <span className="text-xs opacity-75 font-medium">เงินสด (Cash)</span>
              <span className="text-lg md:text-xl font-bold text-[#7DD3FC] data-mono">
                ฿ {summaryData.cashRevenue.toLocaleString()}
              </span>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="flex flex-col">
              <span className="text-xs opacity-75 font-medium">เครดิต/ค้างชำระ (Credit)</span>
              <span className="text-lg md:text-xl font-bold text-[#BAE6FD] data-mono">
                ฿ {summaryData.creditRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Top Right Summary Metric Cards for each product */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {products.map((prod) => {
            const totalQty = productTotals[prod.key] || 0;
            return (
              <div
                key={prod.id}
                className="bg-white border border-[#D2E0EB] p-3 rounded-2xl flex flex-col justify-between hover:border-[#0284C7] transition-all shadow-xs"
              >
                <div className="flex items-center gap-2">
                  {prod.imageUrl ? (
                    <img
                      src={prod.imageUrl}
                      alt={prod.labelTh}
                      className="w-7 h-7 rounded-lg object-cover border border-[#CBD5E1] shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="material-symbols-outlined text-[#0284C7] text-lg">
                      {prod.icon || 'ac_unit'}
                    </span>
                  )}
                  <span className="text-xs font-bold text-[#1E3A5F] truncate">
                    {prod.labelTh}
                  </span>
                </div>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-xl font-bold text-[#1E3A5F] data-mono">
                    {totalQty.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-[#0369A1] bg-[#E0F2FE] px-1.5 py-0.5 rounded-full">
                    {prod.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input Box: Ice Purchase Cost (ต้นทุนค่าน้ำแข็งที่สั่งซื้อมา) - Request #6 */}
      <section className="bg-white p-5 rounded-2xl border border-[#BAE6FD] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E0F2FE] flex items-center justify-center text-[#0284C7]">
              <span className="material-symbols-outlined text-xl">shopping_cart</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1E3A5F]">
                ต้นทุนค่าน้ำแข็งที่สั่งซื้อมา
              </h3>
              <p className="text-xs text-[#64748B]">
                ใส่ยอดต้นทุนที่ซื้อน้ำแข็งมาใส่คลังเพื่อคำนวณกำไรสุทธิ (ใส่ภายหลังได้)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#CBD5E1] p-2 rounded-2xl self-start sm:self-auto">
            <span className="text-xs font-bold text-[#1E3A5F]">฿</span>
            <input
              type="number"
              min="0"
              placeholder="0.00"
              value={icePurchaseCost || ''}
              onChange={(e) => onUpdateIcePurchaseCost(parseFloat(e.target.value) || 0)}
              className="w-32 font-bold text-lg text-[#0284C7] data-mono outline-none text-right bg-white px-2 py-1 border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#0284C7]"
            />
            <span className="text-xs font-bold text-[#64748B]">บาท</span>
          </div>
        </div>
      </section>

      {/* Fixed Operating Expenses Manager Section (เงินเดือน, ค่าเช่าที่, ค่าน้ำค่าไฟ) - Request #6 */}
      <section className="bg-white p-5 rounded-2xl border border-[#D2E0EB] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#DC2626] text-xl">
              receipt_long
            </span>
            <div>
              <h3 className="font-bold text-base text-[#1E3A5F]">
                รายการค่าใช้จ่ายดำเนินงานประจำ (เงินเดือน, ค่าเช่า, ค่าน้ำไฟ)
              </h3>
              <p className="text-xs text-[#64748B]">
                เพิ่ม ลบ และเปลี่ยนชื่อรายการค่าใช้จ่ายประจำได้ตามต้องการ
              </p>
            </div>
          </div>

          <span className="text-xs font-bold bg-[#FEE2E2] text-[#DC2626] px-3 py-1 rounded-full border border-[#FECACA]">
            รวมประจำเดือน: ฿ {totalFixedMonthlyExpense.toLocaleString()}
          </span>
        </div>

        {/* Existing Fixed Expenses Table */}
        <div className="divide-y divide-[#E2E8F0]">
          {monthlyExpenses.map((exp) => (
            <div
              key={exp.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8FAFC] px-2 rounded-xl transition-all"
            >
              <div className="flex-1">
                <input
                  type="text"
                  value={exp.name}
                  onChange={(e) =>
                    onUpdateMonthlyExpense(exp.id, e.target.value, exp.amount)
                  }
                  className="font-bold text-sm text-[#1E3A5F] bg-transparent border-b border-transparent focus:border-[#0284C7] focus:bg-white px-1 py-0.5 rounded-sm outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-1 text-xs">
                  <span className="text-[#64748B] font-bold">฿</span>
                  <input
                    type="number"
                    min="0"
                    value={exp.amount}
                    onChange={(e) =>
                      onUpdateMonthlyExpense(
                        exp.id,
                        exp.name,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-24 font-bold text-[#DC2626] text-right data-mono outline-none"
                  />
                  <span className="text-[#64748B] text-[11px]">บาท</span>
                </div>

                <button
                  onClick={() => onDeleteMonthlyExpense(exp.id)}
                  className="p-1.5 text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-xl transition-colors cursor-pointer"
                  title="ลบรายการ"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Form to Add New Fixed Expense */}
        <form
          onSubmit={handleAddFixedExpense}
          className="pt-3 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
        >
          <div className="sm:col-span-6">
            <label className="text-xs font-semibold text-[#64748B] block mb-1">
              เพิ่มชื่อรายการค่าใช้จ่ายใหม่
            </label>
            <input
              type="text"
              placeholder="เช่น ค่าเช่าสถานที่, เงินเดือนพนักงาน B"
              value={newExpenseName}
              onChange={(e) => setNewExpenseName(e.target.value)}
              className="w-full px-3 py-2 border border-[#CBD5E1] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0284C7] outline-none"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="text-xs font-semibold text-[#64748B] block mb-1">
              จำนวนเงิน (บาท)
            </label>
            <input
              type="number"
              min="0"
              placeholder="0.00"
              value={newExpenseAmount || ''}
              onChange={(e) => setNewExpenseAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#DC2626] data-mono focus:ring-2 focus:ring-[#DC2626] outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full py-2 bg-[#1E3A5F] hover:bg-[#152C4A] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              เพิ่มรายการ
            </button>
          </div>
        </form>
      </section>

      {/* Net Profit & Loss Financial Statement */}
      <section className="bg-white p-6 rounded-2xl border border-[#D2E0EB] shadow-xs space-y-4">
        <h3 className="font-bold text-lg text-[#1E3A5F] flex items-center gap-2 font-sans">
          <span className="material-symbols-outlined text-[#0284C7]">account_balance</span>
          สรุปงบกำไร - ขาดทุนสุทธิ ({reportType === 'daily' ? 'รายวัน' : 'รายเดือน'})
        </h3>

        <div className="space-y-3 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
          {/* Row 1: Total Revenue */}
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-[#1E293B]">1. รายรับรวมจากการขาย:</span>
            <span className="font-bold text-lg text-[#0284C7] data-mono">
              + ฿ {summaryData.totalRevenue.toLocaleString()}
            </span>
          </div>

          {/* Row 2: Ice Purchase Cost */}
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-[#64748B]">
              2. (-) ต้นทุนค่าน้ำแข็งที่สั่งซื้อมา:
            </span>
            <span className="font-bold text-base text-[#DC2626] data-mono">
              - ฿ {(icePurchaseCost || 0).toLocaleString()}
            </span>
          </div>

          {/* Row 3: Recorded Expenses */}
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-[#64748B]">
              3. (-) ค่าใช้จ่ายรวมทั้งหมด:
            </span>
            <span className="font-bold text-base text-[#DC2626] data-mono">
              - ฿ {grandTotalExpense.toLocaleString()}
            </span>
          </div>

          <div className="pt-3 border-t border-[#CBD5E1] flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-[#1E3A5F] uppercase block">
                กำไรสุทธิคงเหลือจริง (NET PROFIT)
              </span>
              <span className="text-[11px] text-[#64748B]">
                (รายรับ - ต้นทุนน้ำแข็ง - ค่าใช้จ่าย)
              </span>
            </div>

            <span
              className={`text-2xl md:text-3xl font-bold data-mono ${
                calculatedNetProfit >= 0 ? 'text-[#0284C7]' : 'text-[#DC2626]'
              }`}
            >
              ฿ {calculatedNetProfit.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Link to Expenses tab */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onNavigateToExpenses}
            className="text-xs font-bold text-[#0284C7] hover:underline flex items-center gap-1 cursor-pointer"
          >
            ดูรายละเอียดบันทึกค่าใช้จ่ายรายวันทั้งหมด
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </section>
    </div>
  );
};
