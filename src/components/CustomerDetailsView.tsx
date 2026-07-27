import React, { useState } from 'react';
import { CustomerAccount, DeliveryRecord, IceBucketHolding, RouteItem } from '../types';

interface CustomerDetailsViewProps {
  customers: CustomerAccount[];
  routes: RouteItem[];
  recentDeliveries: DeliveryRecord[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onUpdateCustomer: (id: string, updated: Partial<CustomerAccount>) => void;
  onShowToast: (msg: string) => void;
}

export const CustomerDetailsView: React.FC<CustomerDetailsViewProps> = ({
  customers,
  routes,
  recentDeliveries,
  selectedDate,
  onDateChange,
  onUpdateCustomer,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('ALL');
  const [viewPeriod, setViewPeriod] = useState<'DAILY' | 'MONTHLY' | 'ALL'>('DAILY');
  const [selectedMonth, setSelectedMonth] = useState(() => selectedDate.substring(0, 7)); // YYYY-MM

  // Debt Settlement Modal State
  const [settleCustomer, setSettleCustomer] = useState<CustomerAccount | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNote, setPayNote] = useState('');

  // History Detail Modal State
  const [historyCustomer, setHistoryCustomer] = useState<CustomerAccount | null>(null);

  // Filter Customers
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRoute = selectedRoute === 'ALL' || c.route === selectedRoute;
    return matchesSearch && matchesRoute;
  });

  // Helper to calculate total period delivery sales for a customer
  const getCustomerPeriodStats = (custName: string) => {
    const custDeliveries = recentDeliveries.filter((d) => {
      if (d.customerName !== custName) return false;
      if (viewPeriod === 'DAILY') return d.date === selectedDate;
      if (viewPeriod === 'MONTHLY') return d.date.startsWith(selectedMonth);
      return true; // ALL
    });

    let totalPurchased = 0;
    let amountPaid = 0;
    let periodDebt = 0;

    custDeliveries.forEach((d) => {
      totalPurchased += d.totalAmount || 0;
      if (d.status === 'Cash' || d.status === 'Credit') {
        amountPaid += d.totalAmount || 0;
      } else if (d.status === 'Debt') {
        periodDebt += d.totalAmount || 0;
      } else if (d.status === 'OldPayment' || d.status === 'NewAndOld') {
        const newPaid = d.statusDetails?.newAmountPaid || 0;
        const oldPaid = d.statusDetails?.oldDebtPaid || 0;
        amountPaid += newPaid + oldPaid;
        const totalBill = d.totalAmount || 0;
        if (totalBill > newPaid) {
          periodDebt += totalBill - newPaid;
        }
      }
    });

    return { totalPurchased, amountPaid, periodDebt, deliveryCount: custDeliveries.length };
  };

  // Grand Totals Calculation
  let grandTotalSales = 0;
  let grandTotalPaid = 0;
  let grandPeriodDebt = 0;
  let grandAccumulatedDebt = 0;

  filteredCustomers.forEach((c) => {
    const stats = getCustomerPeriodStats(c.name);
    grandTotalSales += stats.totalPurchased;
    grandTotalPaid += stats.amountPaid;
    grandPeriodDebt += stats.periodDebt;
    grandAccumulatedDebt += c.accumulatedDebt || (c.status === 'Debt' ? c.totalAmount : 0);
  });

  // Handle Debt Settlement
  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleCustomer) return;
    if (payAmount <= 0) {
      onShowToast('กรุณาระบุจำนวนเงินที่รับชำระ');
      return;
    }

    const currentDebt = settleCustomer.accumulatedDebt || (settleCustomer.status === 'Debt' ? settleCustomer.totalAmount : 0);
    const newDebt = Math.max(0, currentDebt - payAmount);

    const newHistoryItem = {
      id: `PAY-${Date.now()}`,
      date: selectedDate,
      amountPaid: payAmount,
      debtRemaining: newDebt,
      type: 'DEBT_SETTLEMENT' as const,
      note: payNote.trim() || 'ชำระหนี้ค้างสะสม',
    };

    const existingHistory = settleCustomer.paymentHistory || [];

    onUpdateCustomer(settleCustomer.id, {
      accumulatedDebt: newDebt,
      status: newDebt === 0 ? 'Cash' : settleCustomer.status,
      paymentHistory: [newHistoryItem, ...existingHistory],
    });

    onShowToast(`บันทึกรับชำระเงินจาก "${settleCustomer.name}" จำนวน ฿${payAmount.toLocaleString()} เรียบร้อยแล้ว`);
    setSettleCustomer(null);
    setPayAmount(0);
    setPayNote('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1E3A5F] to-[#0284C7] rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#BAE6FD] text-xs font-bold uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-sm">badge</span>
            <span>Customer Financial Summary</span>
          </div>
          <h1 className="text-2xl font-bold">รายละเอียดบัญชี & ยอดค้างชำระลูกค้า</h1>
          <p className="text-xs text-[#E0F2FE] mt-1">
            ดึงข้อมูลรายชื่อลูกค้าจากระบบบัญชี สรุปยอดซื้อ รับชำระ ยอดค้างชำระประจำรอบ และยอดค้างสะสม
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/20 backdrop-blur-xs shrink-0">
          <button
            onClick={() => setViewPeriod('DAILY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewPeriod === 'DAILY'
                ? 'bg-white text-[#1E3A5F] shadow-xs'
                : 'text-white hover:bg-white/10'
            }`}
          >
            รายวัน
          </button>
          <button
            onClick={() => setViewPeriod('MONTHLY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewPeriod === 'MONTHLY'
                ? 'bg-white text-[#1E3A5F] shadow-xs'
                : 'text-white hover:bg-white/10'
            }`}
          >
            รายเดือน
          </button>
          <button
            onClick={() => setViewPeriod('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewPeriod === 'ALL'
                ? 'bg-white text-[#1E3A5F] shadow-xs'
                : 'text-white hover:bg-white/10'
            }`}
          >
            ทั้งหมด
          </button>
        </div>
      </div>

      {/* Filter and Date Bar */}
      <div className="bg-white border border-[#D2E0EB] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#94A3B8] text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="ค้นหาลูกค้า..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.value || e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#CBD5E1] rounded-xl text-xs focus:ring-2 focus:ring-[#0284C7] outline-none"
            />
          </div>

          {/* Route Filter */}
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="px-3 py-2 border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#1E293B] focus:ring-2 focus:ring-[#0284C7] outline-none cursor-pointer"
          >
            <option value="ALL">ทุกสายส่ง</option>
            {routes.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date / Month Selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {viewPeriod === 'DAILY' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="px-3 py-1.5 border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#1E3A5F] focus:ring-2 focus:ring-[#0284C7] outline-none cursor-pointer"
            />
          )}

          {viewPeriod === 'MONTHLY' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#1E3A5F] focus:ring-2 focus:ring-[#0284C7] outline-none cursor-pointer"
            />
          )}
        </div>
      </div>

      {/* Grand Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-[#D2E0EB] p-4 rounded-2xl shadow-xs">
          <div className="text-xs font-bold text-[#64748B]">ยอดซื้อรวมประจำรอบ</div>
          <div className="text-2xl font-bold text-[#1E3A5F] mt-1 data-mono">
            ฿{grandTotalSales.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">จากลูกค้า {filteredCustomers.length} ราย</div>
        </div>

        <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-4 rounded-2xl shadow-xs">
          <div className="text-xs font-bold text-[#166534]">ยอดชำระแล้วประจำรอบ</div>
          <div className="text-2xl font-bold text-[#15803D] mt-1 data-mono">
            ฿{grandTotalPaid.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#166534] mt-1">เงินสด / โอนชำระ</div>
        </div>

        <div className="bg-[#FFFBEB] border border-[#FDE68A] p-4 rounded-2xl shadow-xs">
          <div className="text-xs font-bold text-[#92400E]">ยอดค้างประจำรอบ</div>
          <div className="text-2xl font-bold text-[#D97706] mt-1 data-mono">
            ฿{grandPeriodDebt.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#92400E] mt-1">รอการจัดเก็บ</div>
        </div>

        <div className="bg-[#FEF2F2] border border-[#FCA5A5] p-4 rounded-2xl shadow-xs">
          <div className="text-xs font-bold text-[#991B1B]">ยอดค้างชำระสะสมรวมสุทธิ</div>
          <div className="text-2xl font-bold text-[#DC2626] mt-1 data-mono">
            ฿{grandAccumulatedDebt.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#991B1B] mt-1">ค้างสะสมทุกงวดรวมกัน</div>
        </div>
      </div>

      {/* Customer Financial Details Table */}
      <div className="bg-white border border-[#D2E0EB] rounded-3xl shadow-xs overflow-hidden">
        <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0284C7]">format_list_bulleted</span>
            <h3 className="font-bold text-sm text-[#1E3A5F]">
              รายการสรุปยอดรายลูกค้า ({filteredCustomers.length} ราย)
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[65vh]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EBF2F7] text-[#1E3A5F] font-bold uppercase text-[11px] border-b border-[#D2E0EB] sticky top-0 z-10">
              <tr>
                <th className="p-3.5">รหัส / ชื่อลูกค้า</th>
                <th className="p-3.5">สายส่ง</th>
                <th className="p-3.5">🪣 ถังน้ำแข็งประจำร้าน</th>
                <th className="p-3.5 text-right">ยอดซื้อรอบนี้</th>
                <th className="p-3.5 text-right">จ่ายแล้ว</th>
                <th className="p-3.5 text-right">ค้างรอบนี้</th>
                <th className="p-3.5 text-right">ยอดค้างสะสมรวม</th>
                <th className="p-3.5 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredCustomers.map((cust) => {
                const stats = getCustomerPeriodStats(cust.name);
                const accumDebt = cust.accumulatedDebt ?? (cust.status === 'Debt' ? cust.totalAmount : 0);
                const buckets = cust.iceBuckets || [];

                return (
                  <tr key={cust.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-3.5 font-bold text-[#1E293B]">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-[#E0F2FE] text-[#0369A1] px-1.5 py-0.5 rounded-md">
                          {cust.code}
                        </span>
                        <span>{cust.name}</span>
                      </div>
                    </td>

                    <td className="p-3.5 font-semibold text-[#64748B]">{cust.route}</td>

                    <td className="p-3.5">
                      {buckets.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {buckets.map((b) => (
                            <span
                              key={b.id}
                              className="text-[10px] font-semibold bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1] px-2 py-0.5 rounded-lg flex items-center gap-1"
                            >
                              🪣 {b.bucketSize} <strong className="text-[#0284C7]">({b.count} ใบ)</strong>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#94A3B8] italic">ไม่มีถังน้ำแข็ง</span>
                      )}
                    </td>

                    <td className="p-3.5 text-right font-bold text-[#1E3A5F] data-mono">
                      ฿{stats.totalPurchased.toLocaleString()}
                    </td>

                    <td className="p-3.5 text-right font-bold text-[#166534] data-mono">
                      ฿{stats.amountPaid.toLocaleString()}
                    </td>

                    <td className="p-3.5 text-right font-bold text-[#D97706] data-mono">
                      ฿{stats.periodDebt.toLocaleString()}
                    </td>

                    <td className="p-3.5 text-right font-bold data-mono">
                      {accumDebt > 0 ? (
                        <span className="text-[#DC2626] bg-[#FEE2E2] px-2 py-1 rounded-xl">
                          ฿{accumDebt.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[#166534] bg-[#DCFCE7] px-2 py-1 rounded-xl">
                          ฿0 (ไม่มีค้าง)
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSettleCustomer(cust);
                            setPayAmount(accumDebt);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">payments</span>
                          <span>รับชำระหนี้</span>
                        </button>

                        <button
                          onClick={() => setHistoryCustomer(cust)}
                          className="px-2 py-1 text-[11px] font-bold text-[#475569] bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] rounded-xl transition-all cursor-pointer"
                          title="ดูประวัติย้อนหลัง"
                        >
                          <span className="material-symbols-outlined text-xs">history</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Debt Modal */}
      {settleCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-[#BAE6FD]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-[#DCFCE7] text-[#166534] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">payments</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#1E3A5F]">บันทึกรับชำระเงินค้างสะสม</h3>
                  <p className="text-xs text-[#64748B]">{settleCustomer.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSettleCustomer(null)}
                className="p-1 text-[#64748B] hover:bg-[#F1F5F9] rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSettleSubmit} className="mt-4 space-y-4">
              <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl flex justify-between items-center">
                <span className="text-xs font-semibold text-[#991B1B]">ยอดค้างสะสมปัจจุบัน</span>
                <span className="text-lg font-bold text-[#DC2626] data-mono">
                  ฿{(settleCustomer.accumulatedDebt ?? (settleCustomer.status === 'Debt' ? settleCustomer.totalAmount : 0)).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1E3A5F]">จำนวนเงินที่รับชำระ (บาท)</label>
                <input
                  type="number"
                  min="0"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2.5 border border-[#CBD5E1] rounded-xl text-base font-bold text-[#0284C7] data-mono focus:ring-2 focus:ring-[#0284C7] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1E3A5F]">หมายเหตุ / ช่องทางชำระ</label>
                <input
                  type="text"
                  placeholder="เช่น โอนเข้าบัญชีธารทอง, ชำระเงินสดล่วงหน้า"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-[#CBD5E1] rounded-xl text-xs focus:ring-2 focus:ring-[#0284C7] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleCustomer(null)}
                  className="flex-1 py-2.5 border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#475569] hover:bg-[#F1F5F9] cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0284C7] text-white rounded-xl text-xs font-bold hover:bg-[#0369A1] shadow-md cursor-pointer"
                >
                  บันทึกรับเงิน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Payment & Delivery History Modal */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-[#BAE6FD] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="font-bold text-[#1E3A5F] text-base">
                  ประวัติรับ-ส่งน้ำแข็ง & การชำระเงิน
                </h3>
                <p className="text-xs text-[#0284C7] font-semibold">{historyCustomer.name} ({historyCustomer.code})</p>
              </div>
              <button
                onClick={() => setHistoryCustomer(null)}
                className="p-1 text-[#64748B] hover:bg-[#F1F5F9] rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 no-scrollbar">
              {/* Ice Buckets Info */}
              <div className="bg-[#F8FAFC] border border-[#CBD5E1] p-3 rounded-2xl">
                <div className="text-xs font-bold text-[#1E3A5F] mb-1 flex items-center gap-1">
                  <span>🪣 ถังน้ำแข็งที่ตั้งไว้ที่ร้าน:</span>
                </div>
                {historyCustomer.iceBuckets && historyCustomer.iceBuckets.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {historyCustomer.iceBuckets.map((b) => (
                      <span key={b.id} className="text-xs bg-white border border-[#CBD5E1] px-2 py-1 rounded-xl text-[#334155] font-semibold">
                        {b.bucketSize}: <strong className="text-[#0284C7]">{b.count} ใบ</strong> ({b.note || 'ไม่มีระบุ'})
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-[#94A3B8]">ยังไม่ได้ระบุถังน้ำแข็ง</span>
                )}
              </div>

              {/* Payment History Logs */}
              <div>
                <h4 className="text-xs font-bold uppercase text-[#64748B] mb-2">ประวัติการรับชำระเงินค้าง</h4>
                {historyCustomer.paymentHistory && historyCustomer.paymentHistory.length > 0 ? (
                  <div className="space-y-2">
                    {historyCustomer.paymentHistory.map((p) => (
                      <div key={p.id} className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-[#166534] block">{p.date}</span>
                          <span className="text-[11px] text-[#64748B]">{p.note}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#15803D] text-sm data-mono block">
                            +฿{p.amountPaid.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-[#991B1B]">คงเหลือ: ฿{p.debtRemaining.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-[#94A3B8] p-3 bg-[#F8FAFC] rounded-2xl text-center">
                    ยังไม่มีประวัติชำระหนี้ค้างสะสม
                  </div>
                )}
              </div>

              {/* Deliveries */}
              <div>
                <h4 className="text-xs font-bold uppercase text-[#64748B] mb-2">รายการรับ-ส่งน้ำแข็งล่าสุด</h4>
                {recentDeliveries.filter((d) => d.customerName === historyCustomer.name).length > 0 ? (
                  <div className="space-y-2">
                    {recentDeliveries
                      .filter((d) => d.customerName === historyCustomer.name)
                      .map((d) => (
                        <div key={d.id} className="p-3 bg-white border border-[#E2E8F0] rounded-2xl flex justify-between items-center text-xs">
                          <div>
                            <div className="font-bold text-[#1E3A5F]">{d.date} • {d.time}</div>
                            <div className="text-[11px] text-[#64748B] mt-0.5">{d.summaryText}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-[#0284C7] data-mono text-sm">
                              ฿{d.totalAmount.toLocaleString()}
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1]">
                              {d.status}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-xs text-[#94A3B8] p-3 bg-[#F8FAFC] rounded-2xl text-center">
                    ยังไม่มีรายการจัดส่งน้ำแข็งในระบบ
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] text-right">
              <button
                onClick={() => setHistoryCustomer(null)}
                className="px-4 py-2 bg-[#1E3A5F] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
