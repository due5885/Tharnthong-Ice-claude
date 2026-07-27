import React, { useState } from 'react';
import { AttendanceRecord, Employee } from '../types';
import { getPayPeriodLabel, PAY_PERIOD_ORDER } from '../lib/payPeriod';
import { useHorizontalWheelScroll } from '../lib/useHorizontalWheelScroll';

interface AttendanceViewProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onAddAttendance: (record: Omit<AttendanceRecord, 'id'>) => void;
  onDeleteAttendance: (id: string) => void;
  onShowToast: (msg: string) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  employees,
  attendanceRecords,
  selectedDate,
  onDateChange,
  onAddAttendance,
  onDeleteAttendance,
  onShowToast,
}) => {
  const [entryDate, setEntryDate] = useState(selectedDate);
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || '');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [note, setNote] = useState('');
  const tableScrollRef = useHorizontalWheelScroll<HTMLDivElement>();

  const selectedMonth = selectedDate.slice(0, 7);

  const monthRecords = attendanceRecords
    .filter((r) => r.date.slice(0, 7) === selectedMonth)
    .sort((a, b) => b.date.localeCompare(a.date));

  const recordsByPeriod = PAY_PERIOD_ORDER.map((periodLabel) => ({
    periodLabel,
    records: monthRecords.filter((r) => getPayPeriodLabel(r.date) === periodLabel),
  }));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e2) => e2.id === employeeId);
    if (!emp) {
      onShowToast('กรุณาเลือกพนักงาน (เพิ่มรายชื่อพนักงานก่อนที่หน้า "ขึ้นน้ำแข็ง-น้ำแข็งเหลือ")');
      return;
    }
    if (!checkIn && !checkOut) {
      onShowToast('กรุณาระบุเวลาเข้าหรือออกงานอย่างน้อย 1 ช่อง');
      return;
    }

    onAddAttendance({
      employeeId: emp.id,
      employeeName: emp.name,
      date: entryDate,
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      note: note.trim() || undefined,
    });

    setCheckIn('');
    setCheckOut('');
    setNote('');
    onShowToast(`บันทึกเวลาเข้างานของ "${emp.name}" เรียบร้อยแล้ว`);
  };

  return (
    <div className="space-y-6 pb-24">
      <section className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D2E0EB] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#1E3A5F] flex items-center gap-2 font-sans">
              <span className="material-symbols-outlined text-[#0284C7]">schedule</span>
              วันทำงานพนักงาน
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              บันทึกเวลาเข้า-ออกงาน จัดกลุ่มตามงวดจ่ายเงินเดือน (1-10 / 11-20 / 21-สิ้นเดือน) — ไม่คำนวณเงินเดือนอัตโนมัติ
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#CBD5E1] px-3 py-1.5 rounded-xl">
            <span className="material-symbols-outlined text-sm text-[#0284C7]">calendar_month</span>
            <span className="text-xs font-bold text-[#1E3A5F]">เดือนที่ดู:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#0284C7] data-mono outline-none cursor-pointer"
            />
          </div>
        </div>

        {employees.length === 0 && (
          <div className="bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs font-semibold px-4 py-3 rounded-2xl flex items-start gap-2">
            <span className="material-symbols-outlined text-base">warning</span>
            <span>ยังไม่มีรายชื่อพนักงาน — เพิ่มรายชื่อได้ที่ปุ่ม "จัดการพนักงาน" ในหน้า "ขึ้นน้ำแข็ง-น้ำแข็งเหลือ"</span>
          </div>
        )}

        {/* Quick entry form */}
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2 border-t border-[#E2E8F0]">
          <div>
            <label className="text-xs font-bold text-[#1E3A5F] block mb-1">พนักงาน</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#1E3A5F] focus:ring-2 focus:ring-[#0284C7] outline-none"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-[#1E3A5F] block mb-1">วันที่</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#1E3A5F] focus:ring-2 focus:ring-[#0284C7] outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#16A34A] block mb-1">เวลาเข้า</label>
            <input
              type="time"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full px-3 py-2 border border-[#BBF7D0] rounded-xl text-xs font-bold text-[#16A34A] focus:ring-2 focus:ring-[#16A34A] outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#DC2626] block mb-1">เวลาออก</label>
            <input
              type="time"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full px-3 py-2 border border-[#FCA5A5] rounded-xl text-xs font-bold text-[#DC2626] focus:ring-2 focus:ring-[#DC2626] outline-none"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-[#64748B] block mb-1">หมายเหตุ</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="เช่น ลา, มาสาย"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex-1 px-3 py-2 border border-[#CBD5E1] rounded-xl text-xs focus:ring-2 focus:ring-[#0284C7] outline-none"
              />
              <button
                type="submit"
                className="w-9 h-9 shrink-0 rounded-xl bg-[#1E3A5F] hover:bg-[#152C4A] text-white flex items-center justify-center transition-colors cursor-pointer"
                title="บันทึก"
              >
                <span className="material-symbols-outlined text-lg">save</span>
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* History grouped by pay period */}
      {recordsByPeriod.map(({ periodLabel, records }) => (
        <section key={periodLabel} className="bg-white rounded-2xl border border-[#D2E0EB] shadow-xs overflow-hidden">
          <div className="bg-[#EBF2F7] px-4 py-3 border-b border-[#D2E0EB] flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#1E3A5F] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0284C7] text-lg">event_note</span>
              {periodLabel}
            </h3>
            <span className="text-xs font-bold text-[#64748B]">{records.length} รายการ</span>
          </div>

          {records.length === 0 ? (
            <div className="p-6 text-center text-[#94A3B8] text-xs">ยังไม่มีบันทึกในงวดนี้</div>
          ) : (
            <div ref={tableScrollRef} className="overflow-x-auto thin-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase text-[10px] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="p-3">วันที่</th>
                    <th className="p-3">พนักงาน</th>
                    <th className="p-3">เวลาเข้า</th>
                    <th className="p-3">เวลาออก</th>
                    <th className="p-3">หมายเหตุ</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-[#EBF1F7]/80 transition-colors">
                      <td className="p-3 font-medium text-[#1E293B] whitespace-nowrap">{r.date}</td>
                      <td className="p-3 font-bold text-[#1E3A5F] whitespace-nowrap">{r.employeeName}</td>
                      <td className="p-3 font-bold text-[#16A34A] data-mono">{r.checkIn || '-'}</td>
                      <td className="p-3 font-bold text-[#DC2626] data-mono">{r.checkOut || '-'}</td>
                      <td className="p-3 text-[#64748B]">{r.note || '-'}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onDeleteAttendance(r.id)}
                          className="p-1.5 text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-xl transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
};
