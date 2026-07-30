import React, { useState } from 'react';
import { CustomerAccount, DeliveryRecord, RouteItem } from '../types';
import { DateInput } from './DateInput';

interface SublineCashViewProps {
  customers: CustomerAccount[];
  routes: RouteItem[];
  recentDeliveries: DeliveryRecord[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onAddCustomer: (customer: Omit<CustomerAccount, 'id'>) => void;
  onDeleteCustomer: (id: string, name: string) => void;
  onRecordPayment: (
    customerId: string,
    amount: number,
    isFronted: boolean,
    method: 'Cash' | 'Transfer',
    note: string
  ) => void;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export const SublineCashView: React.FC<SublineCashViewProps> = ({
  customers,
  routes,
  recentDeliveries,
  selectedDate,
  onDateChange,
  onAddCustomer,
  onDeleteCustomer,
  onRecordPayment,
  onBack,
  onShowToast,
}) => {
  const [newName, setNewName] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [entryType, setEntryType] = useState<'receive' | 'fronted'>('receive');
  const [method, setMethod] = useState<'Cash' | 'Transfer'>('Cash');
  const [note, setNote] = useState('ค่าน้ำแข็ง');

  const sublineRoute = routes.find((r) => r.type === 'subline');
  const sublineCustomers = customers.filter(
    (c) => routes.find((r) => r.name === c.route)?.type === 'subline'
  );

  const todaysLog = recentDeliveries
    .filter(
      (d) =>
        d.date === selectedDate &&
        routes.find((r) => r.name === d.routeName)?.type === 'subline'
    )
    .slice(0, 20);

  const handleAddName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const targetRouteName = sublineRoute?.name || 'สายย่อย';
    onAddCustomer({
      code: `C-${Math.floor(100 + Math.random() * 900)}`,
      name: newName.trim(),
      route: targetRouteName,
      quantities: {},
      extraAmount: 0,
      totalAmount: 0,
      status: 'Cash',
    });
    onShowToast(`เพิ่มร้านสายย่อย "${newName.trim()}" เรียบร้อยแล้ว`);
    setNewName('');
  };

  const handleConfirmReceive = () => {
    const numAmount = parseFloat(amount);
    if (!selectedCustomerId) {
      onShowToast('กรุณาเลือกชื่อสายย่อย');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      onShowToast('กรุณาระบุจำนวนเงินให้ถูกต้อง');
      return;
    }
    const customer = sublineCustomers.find((c) => c.id === selectedCustomerId);
    onRecordPayment(selectedCustomerId, numAmount, entryType === 'fronted', method, note.trim());
    onShowToast(
      `บันทึก${entryType === 'fronted' ? 'ร้านใหญ่สำรองจ่ายแทน' : 'รับเงิน'} "${customer?.name}" ฿${numAmount.toLocaleString()} เรียบร้อยแล้ว`
    );
    setAmount('');
    setEntryType('receive');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-[#D2E0EB] shadow-xs flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center text-[#1E3A5F] transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#1E3A5F] flex items-center gap-2 font-sans">
              <span className="material-symbols-outlined text-[#059669]">account_balance_wallet</span>
              รับเงินสายย่อย
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              บันทึกเฉพาะเงินค่าน้ำแข็งที่สายอื่นนำมาจ่าย ไม่ใช่รายการลูกค้า
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl px-3 py-2">
          <span className="material-symbols-outlined text-sm text-[#059669]">calendar_today</span>
          <DateInput
            value={selectedDate}
            onChange={onDateChange}
            className="data-mono font-bold text-[#047857] text-sm cursor-pointer bg-transparent outline-none"
          />
        </div>
      </div>

      {/* รายชื่อสายย่อย */}
      <div className="bg-white rounded-2xl p-5 border border-[#D2E0EB] shadow-xs space-y-3">
        <div>
          <h3 className="font-bold text-base text-[#1E3A5F]">รายชื่อสายย่อย</h3>
          <p className="text-xs text-[#64748B]">เพิ่มหรือลบชื่อเองได้ เช่น ชลบุรี-ข้าวหลาม</p>
        </div>

        <form onSubmit={handleAddName} className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="ชื่อสายย่อย เช่น ชลบุรี-ข้าวหลาม"
            className="flex-1 px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl text-sm focus:ring-2 focus:ring-[#059669] outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#059669] text-white rounded-xl text-xs font-bold hover:bg-[#047857] transition-colors cursor-pointer flex items-center gap-1 shrink-0"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            เพิ่มสายย่อย
          </button>
        </form>

        {sublineCustomers.length === 0 ? (
          <p className="text-xs text-[#94A3B8]">ยังไม่มีสายย่อย — เพิ่มชื่อด้านบนก่อน</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sublineCustomers.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-3 pr-1.5 py-1.5"
              >
                <span className="text-sm font-semibold text-[#1E293B]">{c.name}</span>
                <button
                  type="button"
                  onClick={() => onDeleteCustomer(c.id, c.name)}
                  className="p-1 text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors cursor-pointer"
                  title="ลบชื่อสายย่อย"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* รับเงินค่าน้ำแข็ง */}
      <div className="bg-[#ECFDF5] rounded-2xl p-5 border border-[#A7F3D0] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#059669]">receipt_long</span>
          <div>
            <h3 className="font-bold text-base text-[#1E3A5F]">รับเงินค่าน้ำแข็งวันที่ {formatDMY(selectedDate)}</h3>
            <p className="text-xs text-[#64748B]">เลือกชื่อสาย แล้วใส่ยอดที่จ่ายวันนี้</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1.3fr_auto] gap-3 items-end">
          <div>
            <label className="text-xs font-bold text-[#1E3A5F] block mb-1">สายย่อย</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-[#CBD5E1] bg-white text-sm font-medium focus:ring-2 focus:ring-[#059669] outline-none cursor-pointer"
            >
              <option value="">เลือกสายย่อย</option>
              {sublineCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#1E3A5F] block mb-1">จำนวนเงินค่าน้ำแข็ง</label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full h-11 px-3 border rounded-xl text-center font-bold text-sm data-mono focus:ring-2 outline-none ${
                entryType === 'fronted'
                  ? 'border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] focus:ring-[#DC2626]'
                  : 'border-[#CBD5E1] bg-white focus:ring-[#059669]'
              }`}
            />
            {entryType === 'fronted' && amount && !isNaN(parseFloat(amount)) && (
              <p className="text-[11px] font-bold text-[#DC2626] mt-1">
                จะบันทึกเป็น -{parseFloat(amount).toLocaleString()} บาท
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-[#1E3A5F] block mb-1">รายการ</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setEntryType('receive')}
                className={`h-11 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  entryType === 'receive'
                    ? 'bg-[#059669] text-white shadow-xs'
                    : 'bg-white border border-[#CBD5E1] text-[#64748B]'
                }`}
              >
                รับเงิน
              </button>
              <button
                type="button"
                onClick={() => setEntryType('fronted')}
                className={`h-11 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  entryType === 'fronted'
                    ? 'bg-[#DC2626] text-white shadow-xs'
                    : 'bg-white border border-[#CBD5E1] text-[#64748B]'
                }`}
              >
                ร้านใหญ่สำรอง
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirmReceive}
            className="h-11 px-5 bg-[#1E3A5F] hover:bg-[#152A45] text-white rounded-xl text-sm font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-lg">check_circle</span>
            ยืนยันรับเงิน
          </button>
        </div>

        <div>
          <label className="text-xs font-bold text-[#1E3A5F] block mb-1">วิธีรับเงิน</label>
          <div className="grid grid-cols-2 gap-2 max-w-xs">
            <button
              type="button"
              onClick={() => setMethod('Cash')}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                method === 'Cash'
                  ? 'bg-[#059669] text-white shadow-xs'
                  : 'bg-white border border-[#CBD5E1] text-[#64748B]'
              }`}
            >
              เงินสด
            </button>
            <button
              type="button"
              onClick={() => setMethod('Transfer')}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                method === 'Transfer'
                  ? 'bg-[#059669] text-white shadow-xs'
                  : 'bg-white border border-[#CBD5E1] text-[#64748B]'
              }`}
            >
              โอน
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-[#1E3A5F] block mb-1">หมายเหตุ</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-[#CBD5E1] bg-white rounded-xl text-sm focus:ring-2 focus:ring-[#059669] outline-none"
          />
        </div>
      </div>

      {/* Today's log */}
      {todaysLog.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-[#D2E0EB] shadow-xs space-y-2">
          <h3 className="font-bold text-sm text-[#1E3A5F]">รายการที่บันทึกวันนี้</h3>
          <div className="space-y-1.5">
            {todaysLog.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-2 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs"
              >
                <span className="text-[#64748B] data-mono w-12 shrink-0">{d.time}</span>
                <span className="font-semibold text-[#1E293B] flex-1 truncate">{d.customerName}</span>
                <span className="text-[#64748B] shrink-0">{d.paymentMethod === 'Transfer' ? 'โอน' : 'เงินสด'}</span>
                <span
                  className={`font-bold data-mono shrink-0 ${
                    d.totalAmount < 0 ? 'text-[#DC2626]' : 'text-[#059669]'
                  }`}
                >
                  ฿{d.totalAmount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function formatDMY(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
}
