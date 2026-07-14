import React, { useState } from "react";
import {
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Layers,
  Users,
  Briefcase,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Percent,
  Cpu,
  Monitor,
  Network
} from "lucide-react";
import { Job, Equipment, Customer } from "../types";

interface AnalyticsViewProps {
  jobs: Job[];
  equipments: Equipment[];
  customers: Customer[];
}

export default function AnalyticsView({ jobs, equipments, customers }: AnalyticsViewProps) {
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Stats calculation
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === "Completed").length;
  const pendingJobs = jobs.filter((j) => j.status === "Pending").length;
  const inProgressJobs = jobs.filter((j) => j.status === "In Progress").length;

  // Calculate total revenue: each job can have a simulated/actual revenue
  // We can default to a pricing model if no revenue is set:
  // Installation: 15,000, Repair: 3,500, Maintenance/PM: 5,000, Relocation: 4,000, Expansion: 8,500, Emergency: 6,000
  const getJobEstimatedRevenue = (job: Job) => {
    if (job.revenue) return job.revenue;
    switch (job.jobType) {
      case "Installation":
        return 18500;
      case "Repair":
        return 3500;
      case "Maintenance":
        return 5000;
      case "Relocation":
        return 4500;
      case "Expansion":
        return 9500;
      case "Emergency":
        return 6000;
      default:
        return 5000;
    }
  };

  const totalRevenue = jobs
    .filter((j) => j.status === "Completed" || j.status === "In Progress")
    .reduce((sum, j) => sum + getJobEstimatedRevenue(j), 0);

  const totalCustomers = customers.length;
  const totalEquipments = equipments.length;

  // Count hardware by categories
  // Camera, NVR, DVR, HDD, PoE Switch, Switch, Router, ONU, Access Point, UPS, Rack, Patch Panel, สาย LAN, Fiber, Connector, Power Supply, อื่นๆ
  const camerasCount = equipments.filter(
    (e) =>
      e.category === "Camera" ||
      e.model.toLowerCase().includes("camera") ||
      (e.brand && ["dahua", "hikvision", "unv", "hilook", "ezviz", "imou", "vigi"].includes(e.brand.toLowerCase()))
  ).length;

  const routersCount = equipments.filter(
    (e) =>
      e.category === "Router" ||
      e.model.toLowerCase().includes("router") ||
      (e.brand && ["mikrotik", "draytek", "ubiquiti"].includes(e.brand.toLowerCase()))
  ).length;

  const switchesCount = equipments.filter(
    (e) =>
      e.category === "Switch" ||
      e.category === "PoE Switch" ||
      e.model.toLowerCase().includes("switch") ||
      (e.brand && ["ruijie", "planet"].includes(e.brand.toLowerCase()))
  ).length;

  // Find most popular brand
  const brandCounts: { [key: string]: number } = {};
  equipments.forEach((eq) => {
    if (eq.brand) {
      const b = eq.brand.trim();
      brandCounts[b] = (brandCounts[b] || 0) + 1;
    }
  });

  const sortedBrands = Object.entries(brandCounts).sort((a, b) => b[1] - a[1]);
  const topBrand = sortedBrands[0]?.[0] || "MikroTik";
  const topBrandCount = sortedBrands[0]?.[1] || 0;

  // Simulated export handlers
  const handleExportExcel = () => {
    setExportingExcel(true);
    setExportSuccess(null);
    setTimeout(() => {
      setExportingExcel(false);
      setExportSuccess("Excel");
      setTimeout(() => setExportSuccess(null), 3000);
    }, 2000);
  };

  const handleExportPdf = () => {
    setExportingPdf(true);
    setExportSuccess(null);
    setTimeout(() => {
      setExportingPdf(false);
      setExportSuccess("PDF");
      setTimeout(() => setExportSuccess(null), 3000);
    }, 2000);
  };

  return (
    <div className="space-y-6 text-left" id="analytics-view-container">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">หน้าสรุปรายงานและวิเคราะห์ข้อมูล (Analytics Panel)</h2>
          <p className="text-xs text-slate-500">สถิติปริมาณงานติดตั้ง อุปกรณ์ที่ใช้ รายได้สะสม และยี่ห้อสินค้าที่ใช้มากที่สุด</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exportingExcel ? "กำลังสร้าง Excel..." : "ส่งออกรายงาน Excel"}
          </button>

          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="px-4 py-2 bg-[#155dfc] hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            {exportingPdf ? "กำลังสร้าง PDF..." : "ส่งออกสรุป PDF"}
          </button>
        </div>
      </div>

      {/* Export Alerts */}
      {exportSuccess && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-green-600" />
          <span>สร้างไฟล์สรุปผลและส่งออกรายงาน <strong>{exportSuccess} Report</strong> เรียบร้อยแล้ว! ไฟล์พร้อมดาวน์โหลดในเครื่องเซิร์ฟเวอร์สำนักงานใหญ่</span>
        </div>
      )}

      {/* Grid of Key Performance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total revenue estimation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3 bg-blue-50 text-[#155dfc] rounded-xl shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">รายได้สะสม (ประมาณการ)</div>
            <div className="text-xl font-black text-slate-900 mt-1">฿{totalRevenue.toLocaleString()}</div>
            <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> +12.4% เดือนนี้
            </div>
          </div>
        </div>

        {/* Total installed hardware */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">อุปกรณ์ติดตั้งทั้งหมด</div>
            <div className="text-xl font-black text-slate-900 mt-1">{totalEquipments} รายการ</div>
            <div className="text-[10px] text-slate-400 mt-0.5">ครอบคลุมทั้งระบบ LAN & CCTV</div>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">ลูกค้าใหม่ & เก่า</div>
            <div className="text-xl font-black text-slate-900 mt-1">{totalCustomers} รายการ</div>
            <div className="text-[10px] text-amber-600 font-bold mt-0.5">เพิ่มขยาย 2 รายสัปดาห์นี้</div>
          </div>
        </div>

        {/* Brand leader */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">ยี่ห้อที่ใช้งานบ่อยสุด</div>
            <div className="text-xl font-black text-slate-900 mt-1">{topBrand}</div>
            <div className="text-[10px] text-rose-600 font-bold mt-0.5">ติดตั้งแล้ว {topBrandCount} ตัว</div>
          </div>
        </div>
      </div>

      {/* Detail Categories Analytics Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Cameras Count card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 text-slate-700 rounded-lg">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block uppercase">ระบบกล้องวงจรปิด</span>
              <span className="text-lg font-black text-slate-800">จำนวนกล้องทั้งหมด</span>
            </div>
          </div>
          <span className="text-2xl font-black text-[#155dfc]">{camerasCount} กล้อง</span>
        </div>

        {/* Routers count card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 text-slate-700 rounded-lg">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block uppercase">ระบบอินเทอร์เน็ต WiFi</span>
              <span className="text-lg font-black text-slate-800">จำนวน Router</span>
            </div>
          </div>
          <span className="text-2xl font-black text-indigo-600">{routersCount} ตัว</span>
        </div>

        {/* Switches count card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 text-slate-700 rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block uppercase">ระบบเน็ตเวิร์กกระจายสาย</span>
              <span className="text-lg font-black text-slate-800">จำนวน Switch</span>
            </div>
          </div>
          <span className="text-2xl font-black text-emerald-600">{switchesCount} ตัว</span>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Horizontal bar chart representing popular brands */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <BarChart3 className="w-4.5 h-4.5 text-[#155dfc]" /> ยี่ห้อที่เข้าสถิติระบบสูงสุด (Top Brand Statistics)
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">สแกน S/N เที่ยงตรง</span>
          </div>

          <div className="space-y-4 pt-1">
            {sortedBrands.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">ยังไม่มีข้อมูลการสแกนฮาร์ดแวร์เพื่อสร้างสถิติยี่ห้อ</p>
            ) : (
              sortedBrands.slice(0, 6).map(([brand, count], index) => {
                const percentage = Math.round((count / totalEquipments) * 100) || 10;
                return (
                  <div key={brand} className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-800">{index + 1}. {brand}</span>
                      <span className="text-slate-500 font-bold">{count} ตัว ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#155dfc] h-full rounded-full transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ring Chart of Job Types Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Percent className="w-4.5 h-4.5 text-indigo-600" /> สัดส่วนประเภทงานบริการที่ดำเนินการ
            </h3>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4 pt-2">
            {/* Elegant SVG representation of Job Type Breakdown */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                {/* Simulated colorful strokes */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#155dfc"
                  strokeWidth="12"
                  strokeDasharray={`${totalJobs > 0 ? (jobs.filter(j => j.jobType === "Installation").length / totalJobs) * 251.2 : 120} 251.2`}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeDasharray={`${totalJobs > 0 ? (jobs.filter(j => j.jobType === "Maintenance").length / totalJobs) * 251.2 : 50} 251.2`}
                  strokeDashoffset={-70}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#f59e0b"
                  strokeWidth="12"
                  strokeDasharray={`${totalJobs > 0 ? (jobs.filter(j => j.jobType === "Repair").length / totalJobs) * 251.2 : 30} 251.2`}
                  strokeDashoffset={-140}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-800">{totalJobs}</span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase">ใบงานสะสม</span>
              </div>
            </div>

            {/* Legends */}
            <div className="grid grid-cols-2 gap-2.5 w-full text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#155dfc] shrink-0"></span>
                <span className="text-slate-600 truncate">ติดตั้ง ({jobs.filter(j => j.jobType === "Installation").length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shrink-0"></span>
                <span className="text-slate-600 truncate">PM บำรุงรักษา ({jobs.filter(j => j.jobType === "Maintenance").length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shrink-0"></span>
                <span className="text-slate-600 truncate">งานซ่อม ({jobs.filter(j => j.jobType === "Repair").length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                <span className="text-slate-600 truncate">ด่วนพิเศษ ({jobs.filter(j => j.jobType === "Emergency").length})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
