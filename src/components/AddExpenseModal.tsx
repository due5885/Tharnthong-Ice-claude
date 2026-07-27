import React, { useState } from 'react';
import { ExpenseItem, RouteItem } from '../types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  routes?: RouteItem[];
  onAddExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
  onShowToast: (msg: string) => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  routes = [],
  onAddExpense,
  onShowToast,
}) => {
  const [selectedRoute, setSelectedRoute] = useState<string>('หน้าร้าน / ส่วนกลาง');
  const [category, setCategory] = useState<ExpenseItem['category']>('Fuel');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'Cash' | 'Debt'>('Cash');

  if (!isOpen) return null;

  const getCategoryDetails = (cat: ExpenseItem['category']) => {
    switch (cat) {
      case 'Fuel':
        return { categoryTh: 'ค่าน้ำมัน', icon: 'local_gas_station' };
      case 'Wages':
        return { categoryTh: 'ค่าแรง', icon: 'badge' };
      case 'Utilities':
        return { categoryTh: 'ค่าน้ำ-ค่าไฟ', icon: 'bolt' };
      case 'Maintenance':
        return { categoryTh: 'ซ่อมบำรุง', icon: 'build' };
      case 'Packaging':
        return { categoryTh: 'บรรจุภัณฑ์', icon: 'package' };
      case 'Other':
      default:
        return { categoryTh: 'อื่นๆ', icon: 'payments' };
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      onShowToast('กรุณาระบุจำนวนเงินรายจ่ายให้ถูกต้อง');
      return;
    }

    if (!description.trim()) {
      onShowToast('กรุณาระบุรายละเอียดรายการ');
      return;
    }

    const { categoryTh, icon } = getCategoryDetails(category);

    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = String(hours % 12 || 12).padStart(2, '0');
    const timeStr = `${formattedHours}:${minutes} ${ampm}`;

    onAddExpense({
      time: timeStr,
      route: selectedRoute,
      category,
      categoryTh,
      icon,
      description: description.trim(),
      amount: numAmount,
      status,
      date: now.toISOString().split('T')[0],
    });

    onShowToast(`บันทึกรายจ่าย [${selectedRoute}] ฿${numAmount.toLocaleString()} เรียบร้อยแล้ว`);
    setDescription('');
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E5E5DF] shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#8E8E80] hover:text-[#2C2C24] p-1 rounded-full cursor-pointer"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h3 className="text-xl font-bold text-[#5A5A40] mb-4 flex items-center gap-2 font-serif">
          <span className="material-symbols-outlined">add_circle</span>
          บันทึกรายจ่ายประจำวัน
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Route for Expense */}
          <div>
            <label className="block text-xs font-bold text-[#2C2C24] mb-1">
              สังกัดสายส่ง / ส่วนงาน
            </label>
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-[#0284C7] bg-[#F0F9FF] text-sm font-bold text-[#0369A1] focus:ring-2 focus:ring-[#0284C7] outline-none"
            >
              <option value="หน้าร้าน / ส่วนกลาง">หน้าร้าน / ส่วนกลาง (คำนวณส่วนกลาง)</option>
              {routes.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name} {r.driverName ? `(${r.driverName})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C2C24] mb-1">
              หมวดหมู่รายจ่าย
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseItem['category'])}
              className="w-full py-2.5 px-3 rounded-xl border border-[#E5E5DF] bg-white text-sm font-medium focus:ring-2 focus:ring-[#5A5A40] text-[#2C2C24]"
            >
              <option value="Fuel">ค่าน้ำมัน (Fuel)</option>
              <option value="Wages">ค่าแรงพนักงาน (Wages)</option>
              <option value="Utilities">ค่าน้ำ-ค่าไฟ (Utilities)</option>
              <option value="Maintenance">ซ่อมบำรุงเครื่องจักร/รถ (Maintenance)</option>
              <option value="Packaging">ถุงและบรรจุภัณฑ์ (Packaging)</option>
              <option value="Other">อื่นๆ (Other)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C2C24] mb-1">
              รายละเอียดรายการ
            </label>
            <input
              type="text"
              placeholder="เช่น น้ำมันดีเซล รถสาย A, เปลี่ยนสายพาน..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5DF] text-sm focus:ring-2 focus:ring-[#5A5A40] text-[#2C2C24]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C2C24] mb-1">
              จำนวนเงิน (บาท)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5DF] text-base font-bold text-[#5A5A40] data-mono focus:ring-2 focus:ring-[#5A5A40]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C2C24] mb-1">
              รูปแบบการจ่ายเงิน
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('Cash')}
                className={`py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  status === 'Cash'
                    ? 'bg-[#8C6D46]/15 text-[#8C6D46] border border-[#8C6D46]'
                    : 'bg-[#EBEBE4] text-[#8E8E80] border border-[#E5E5DF]'
                }`}
              >
                จ่ายเงินสด (Cash)
              </button>
              <button
                type="button"
                onClick={() => setStatus('Debt')}
                className={`py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  status === 'Debt'
                    ? 'bg-[#A85341]/15 text-[#A85341] border border-[#A85341]'
                    : 'bg-[#EBEBE4] text-[#8E8E80] border border-[#E5E5DF]'
                }`}
              >
                ตั้งค้างชำระ (Debt)
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#E5E5DF] font-bold text-[#2C2C24] text-sm hover:bg-[#EBEBE4] cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-[#5A5A40] text-white font-bold text-sm hover:bg-[#484833] active:scale-95 transition-all cursor-pointer"
            >
              บันทึกรายจ่าย
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
