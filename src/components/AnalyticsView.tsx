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
  Network,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Code,
  Play,
  AlertCircle,
  Wrench,
  CheckCircle2
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

  // States for Warranty & Script Hub
  const [scriptLanguage, setScriptLanguage] = useState<"javascript" | "sql" | "firestore">("javascript");
  const [auditFilter, setAuditFilter] = useState<"all" | "active" | "expired" | "exceeded">("all");
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const runCheckSimulation = () => {
    setIsSimulating(true);
    setSimulationLogs(["Initializing script execution...", "Loading database configuration..."]);
    
    setTimeout(() => {
      setSimulationLogs(prev => [...prev, "Connected to Kingcom DB database instance successfully."]);
    }, 400);

    setTimeout(() => {
      setSimulationLogs(prev => [...prev, "Running query: SELECT * FROM jobs WHERE warranty IS NOT NULL..."]);
    }, 800);

    setTimeout(() => {
      const today = new Date().toISOString().split("T")[0];
      
      // Let's gather real jobs with warranty
      const realWarrantyJobs = jobs.filter(j => j.warranty);
      
      // If there are none, we'll simulate 3 standard customers for a complete demo
      const demoJobs = realWarrantyJobs.length > 0 ? realWarrantyJobs : [
        {
          id: "JOB-7701",
          customerName: "สมชาย คลังสินค้า (โรงงานเคมี)",
          warranty: {
            warrantyStartDate: "2025-01-10",
            warrantyEndDate: "2026-01-10",
            totalFreeServices: 3,
            usedFreeServices: 4,
            claims: [
              { id: "1", date: "2025-03-12", notes: "กล้องมุมอับปรับมุมเลนส์ใหม่", technicianName: "วิชัย" },
              { id: "2", date: "2025-06-18", notes: "สแกนหา S/N Switch ที่ดับ", technicianName: "นที" },
              { id: "3", date: "2025-09-02", notes: "เซ็ตเน็ตเวิร์ก IP Camera ใหม่", technicianName: "สมชาย" },
              { id: "4", date: "2025-11-20", notes: "สายขาดหนูกัดเปลี่ยนสายลิงก์ใหม่", technicianName: "วิชัย" },
            ]
          }
        },
        {
          id: "JOB-9022",
          customerName: "โรงแรม สบายดี ระยอง",
          warranty: {
            warrantyStartDate: "2026-02-15",
            warrantyEndDate: "2027-02-15",
            totalFreeServices: 3,
            usedFreeServices: 2,
            claims: [
              { id: "1", date: "2026-04-01", notes: "NVR มีเสียงเตือนอัพเดตพัดลมระบายความร้อน", technicianName: "อานนท์" },
              { id: "2", date: "2026-06-10", notes: "ติดตั้งแอปมือถือเพิ่มให้ผู้จัดการ", technicianName: "วิชัย" },
            ]
          }
        },
        {
          id: "JOB-3104",
          customerName: "ร้านกาแฟคอฟฟี่ที สยาม",
          warranty: {
            warrantyStartDate: "2025-05-14",
            warrantyEndDate: "2026-05-14",
            totalFreeServices: 3,
            usedFreeServices: 1,
            claims: [
              { id: "1", date: "2025-10-10", notes: "PoE Switch จ่ายไฟไม่นิ่ง เปลี่ยนพอร์ตจ่ายไฟ", technicianName: "วิชัย" },
            ]
          }
        }
      ];

      const logs: string[] = [];
      logs.push(`Found ${demoJobs.length} installation(s) with service warranty setup:`);
      logs.push("--------------------------------------------------------------------------------");

      demoJobs.forEach(job => {
        const { warrantyStartDate, warrantyEndDate, totalFreeServices, usedFreeServices } = job.warranty!;
        const isExpired = today > warrantyEndDate;
        const remaining = totalFreeServices - usedFreeServices;
        const isOverQuota = usedFreeServices > totalFreeServices;
        const hasExhaustedQuota = usedFreeServices === totalFreeServices;
        
        logs.push(`🔍 Checking Job ID: ${job.id} | Customer: ${job.customerName}`);
        logs.push(`   - Warranty: ${warrantyStartDate} to ${warrantyEndDate}`);
        
        if (isExpired) {
          logs.push(`   - ❌ STATUS: EXPIRED (หมดประกันแล้วตั้งแต่ ${warrantyEndDate})`);
          logs.push(`   - Quota: ${usedFreeServices}/${totalFreeServices} services used`);
          logs.push(`   - 🚨 DECISION: Charge Onsite fee standard (e.g. 1,500 THB)`);
        } else if (isOverQuota) {
          logs.push(`   - ⚠️ STATUS: OVER_QUOTA (เรียกเกิน 3 ครั้งหรือโควต้าเต็มแล้ว: เรียก ${usedFreeServices}/${totalFreeServices} ครั้ง)`);
          logs.push(`   - 🚨 DECISION: Charge Onsite fee for over-limit services!`);
        } else if (hasExhaustedQuota) {
          logs.push(`   - ⚠️ STATUS: QUOTA_EXHAUSTED (โควต้าหมดพอดี: เรียก ${usedFreeServices}/${totalFreeServices} ครั้ง)`);
          logs.push(`   - 🚨 DECISION: Next service call must be charged!`);
        } else {
          logs.push(`   - ✅ STATUS: ACTIVE & ELIGIBLE (กำลังคุ้มครอง, สิทธิ์เหลือ ${remaining} ครั้ง)`);
          logs.push(`   - 🟢 DECISION: Eligible for FREE onsite service.`);
        }
        logs.push("--------------------------------------------------------------------------------");
      });

      logs.push("Script execution completed successfully.");
      setSimulationLogs(prev => [...prev, ...logs]);
      setIsSimulating(false);
    }, 1200);
  };

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

      {/* NEW SECTION: Onsite Warranty & Claims Audit Control */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4 gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> ระบบวิเคราะห์สิทธิ์และตรวจสอบประกันสินค้า (Warranty & Claims Audit Control)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              คำนวณสิทธิ์บริการ Onsite Service ฟรี 3 ครั้งภายใน 1 ปีนับจากวันที่ติดตั้ง และแสดงรายงานลูกค้าที่เรียกใช้บริการเกินกำหนดหรือหมดอายุประกันภัย
            </p>
          </div>
          
          {/* Audit Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-bold text-slate-400">กรองสถานะ:</span>
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
              {(["all", "active", "expired", "exceeded"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setAuditFilter(filter)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all capitalize cursor-pointer ${
                    auditFilter === filter
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {filter === "all" && "ทั้งหมด"}
                  {filter === "active" && "ยังไม่หมดอายุ"}
                  {filter === "expired" && "หมดประกัน 1 ปี"}
                  {filter === "exceeded" && "เรียกเกิน 3 ครั้ง"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Monitor Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Active/Audit List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                ตารางรายงานข้อมูลการรับประกัน (Warranty Audit Report)
              </h4>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                พบข้อมูล {
                  jobs.filter(j => j.warranty).filter(j => {
                    const todayStr = new Date().toISOString().split("T")[0];
                    const isExpired = todayStr > j.warranty!.warrantyEndDate;
                    const isExceeded = j.warranty!.usedFreeServices > j.warranty!.totalFreeServices || j.warranty!.usedFreeServices >= 3;
                    if (auditFilter === "active") return !isExpired;
                    if (auditFilter === "expired") return isExpired;
                    if (auditFilter === "exceeded") return isExceeded;
                    return true;
                  }).length
                } รายการ
              </span>
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-3">ข้อมูลลูกค้า / เลขที่ใบงาน</th>
                      <th className="p-3">ระยะเวลารับประกัน 1 ปี</th>
                      <th className="p-3 text-center">จำนวนเข้าดูแลฟรี</th>
                      <th className="p-3 text-right">สถานะ / สิทธิ์การเคลม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const todayStr = new Date().toISOString().split("T")[0];
                      const warrantyJobs = jobs.filter(j => j.warranty);
                      
                      // Fallback demo list if no warranty jobs exist in current database
                      const activeList = warrantyJobs.length > 0 ? warrantyJobs : [
                        {
                          id: "JOB-7701",
                          customerName: "สมชาย คลังสินค้า (โรงงานเคมี)",
                          date: "2025-01-10",
                          warranty: {
                            warrantyStartDate: "2025-01-10",
                            warrantyEndDate: "2026-01-10",
                            totalFreeServices: 3,
                            usedFreeServices: 4,
                            claims: [{}, {}, {}, {}]
                          }
                        },
                        {
                          id: "JOB-9022",
                          customerName: "โรงแรม สบายดี ระยอง",
                          date: "2026-02-15",
                          warranty: {
                            warrantyStartDate: "2026-02-15",
                            warrantyEndDate: "2027-02-15",
                            totalFreeServices: 3,
                            usedFreeServices: 2,
                            claims: [{}, {}]
                          }
                        },
                        {
                          id: "JOB-3104",
                          customerName: "ร้านกาแฟคอฟฟี่ที สยาม",
                          date: "2025-05-14",
                          warranty: {
                            warrantyStartDate: "2025-05-14",
                            warrantyEndDate: "2026-05-14",
                            totalFreeServices: 3,
                            usedFreeServices: 1,
                            claims: [{}]
                          }
                        }
                      ];

                      const filtered = activeList.filter(j => {
                        const isExpired = todayStr > j.warranty!.warrantyEndDate;
                        const isExceeded = j.warranty!.usedFreeServices > j.warranty!.totalFreeServices || j.warranty!.usedFreeServices >= 3;
                        if (auditFilter === "active") return !isExpired;
                        if (auditFilter === "expired") return isExpired;
                        if (auditFilter === "exceeded") return isExceeded;
                        return true;
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                              ไม่มีพบข้อมูลรับประกันตรงตามตัวกรองที่เลือก
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((job) => {
                        const { warrantyStartDate, warrantyEndDate, totalFreeServices, usedFreeServices } = job.warranty!;
                        const isExpired = todayStr > warrantyEndDate;
                        const isExceeded = usedFreeServices > totalFreeServices || usedFreeServices >= 3;
                        const remaining = totalFreeServices - usedFreeServices;
                        
                        return (
                          <tr key={job.id} className="hover:bg-white transition">
                            <td className="p-3">
                              <div className="font-bold text-slate-800">{job.customerName}</div>
                              <div className="font-mono text-[10px] text-slate-400 mt-0.5">{job.id} (วันที่ติดตั้ง: {job.date})</div>
                            </td>
                            <td className="p-3">
                              <div className="font-medium text-slate-600">{warrantyStartDate} ถึง {warrantyEndDate}</div>
                              <div className="mt-1">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  isExpired 
                                    ? "bg-rose-50 text-rose-600 border border-rose-100" 
                                    : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                }`}>
                                  {isExpired ? "หมดอายุประกัน" : "กำลังคุ้มครอง"}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <div className="font-bold text-slate-800">{usedFreeServices} / {totalFreeServices} ครั้ง</div>
                              <div className="w-16 bg-slate-200 h-1.5 rounded-full mx-auto overflow-hidden mt-1">
                                <div 
                                  className={`h-full rounded-full ${
                                    isExceeded ? "bg-rose-500" : remaining === 0 ? "bg-amber-500" : "bg-indigo-500"
                                  }`} 
                                  style={{ width: `${Math.min(100, (usedFreeServices / totalFreeServices) * 100)}%` }}
                                ></div>
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              {isExpired ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                                  <AlertCircle className="w-3 h-3" /> หมดอายุประกัน (คิดค่าบริการ)
                                </span>
                              ) : isExceeded ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md animate-pulse">
                                  <ShieldAlert className="w-3 h-3" /> เกินสิทธิ์ฟรี 3 ครั้ง (คิดเงินเพิ่ม)
                                </span>
                              ) : remaining === 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                                  <AlertCircle className="w-3 h-3" /> สิทธิ์ฟรีหมดแล้ว (สแตนด์บายชาร์จ)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                                  <ShieldCheck className="w-3 h-3" /> ปกติ (เหลือสิทธิ์ฟรี {remaining} ครั้ง)
                                </span>
                              )}
                              <div className="text-[10px] text-slate-400 mt-1">
                                {isExpired ? "เก็บเงินค่าเดินทางและซ่อม" : isExceeded ? "คิดค่าซ่อมเพิ่มนอกโควต้า" : "เข้าซ่อมดูแลฟรีไม่มีชาร์จ"}
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Design & Flow Explanation Card */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2.5">
              <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-indigo-500" /> สรุปขั้นตอนแนวทางการออกแบบระบบควบคุมการเรียกซ่อม (Core Design)
              </h5>
              <ol className="list-decimal list-inside text-slate-600 text-[11px] space-y-1 leading-relaxed">
                <li><strong>กำหนดประเภทงานติดตั้ง (Installation):</strong> เมื่อสร้างใบงานติดตั้ง ระบบจะทำการเปิดใช้งานประกัน 1 ปี และโควต้า onsite ฟรี 3 ครั้งในฐานข้อมูลโดยอัตโนมัติ</li>
                <li><strong>ระบบนับจำนวนเคลม (Service Quota Meter):</strong> ช่างเทคนิคจะเข้ามาล็อกประวัติการเคลม (วันที่, อาการเสีย, วิธีแก้ไข) ในแท็บสิทธิ์ประกันของลูกค้า</li>
                <li><strong>ระบบตรวจสอบความถูกต้องอัตโนมัติ (Automated Check):</strong> หากลูกค้าเรียกใช้ครบ 3 ครั้งแล้ว หรือวันเวลาเกิน 1 ปี ระบบหลังบ้านและหน้าจอจะส่งเสียงเตือน/แจ้งว่าสิทธิ์หมดอายุ เพื่อให้ฝ่ายบริการแจ้งเรียกเก็บเงิน Onsite Service เพิ่มเติมได้จริง</li>
              </ol>
            </div>
          </div>

          {/* Right: Code Scripts Hub (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                คลังซอร์สโค้ดและสคริปต์ตรวจสิทธิ์ (Developer Script Console)
              </h4>
              <span className="text-[10px] text-indigo-600 font-extrabold">PRODUCTION READY</span>
            </div>

            {/* Code Tabs */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 text-white flex flex-col h-[350px]">
              <div className="bg-slate-800 border-b border-slate-700 p-2 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {(["javascript", "sql", "firestore"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setScriptLanguage(lang)}
                      className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition-all ${
                        scriptLanguage === lang
                          ? "bg-slate-950 text-emerald-400 border border-slate-700"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {lang === "javascript" && "Node.js (JS)"}
                      {lang === "sql" && "PostgreSQL (SQL)"}
                      {lang === "firestore" && "Firestore (SDK)"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
              </div>

              {/* Code display area */}
              <div className="p-3.5 font-mono text-[10px] overflow-y-auto flex-1 leading-relaxed bg-slate-950 text-slate-300">
                {scriptLanguage === "javascript" && (
                  <pre>{`// สคริปต์ Node.js / JavaScript ตรวจสิทธิ์ประกันภัย
function checkCustomerWarranty(job) {
  const today = new Date().toISOString().split('T')[0];
  
  if (!job.warranty) {
    return { status: "NO_WARRANTY", isEligible: false };
  }
  
  const { 
    warrantyEndDate, 
    totalFreeServices, 
    usedFreeServices 
  } = job.warranty;

  const isExpired = today > warrantyEndDate;
  const isOverQuota = usedFreeServices >= totalFreeServices;
  
  if (isExpired) {
    return {
      status: "EXPIRED",
      isEligible: false,
      reason: "ระยะเวลาคุ้มครองสิ้นสุดเกิน 1 ปีแล้ว"
    };
  }
  
  if (isOverQuota) {
    return {
      status: "LIMIT_EXCEEDED",
      isEligible: false,
      reason: \`ใช้งานโควต้าฟรีเกิน \${totalFreeServices} ครั้งแล้ว\`
    };
  }
  
  return {
    status: "ACTIVE_OK",
    isEligible: true,
    remaining: totalFreeServices - usedFreeServices
  };
}`}</pre>
                )}

                {scriptLanguage === "sql" && (
                  <pre>{`-- คำสั่ง PostgreSQL ดึงรายชื่อลูกค้าที่ซ่อมเกิน 3 ครั้งหรือหมดประกัน
SELECT 
  id, 
  customer_name,
  warranty->>'warrantyEndDate' AS end_date,
  (warranty->>'usedFreeServices')::INT AS used_count,
  (warranty->>'totalFreeServices')::INT AS limit_count
FROM jobs
WHERE warranty IS NOT NULL
  AND (
    CURRENT_DATE > (warranty->>'warrantyEndDate')::DATE
    OR (warranty->>'usedFreeServices')::INT >= 3
  );`}</pre>
                )}

                {scriptLanguage === "firestore" && (
                  <pre>{`// ใช้สคริปต์ Firebase Firestore SDK ตรวจรายชื่อ
import { db } from "./firebase-config";
import { collection, query, getDocs } from "firebase/firestore";

async function scanWarrantyViolators() {
  const jobsCol = collection(db, "jobs");
  const snapshot = await getDocs(jobsCol);
  const today = new Date().toISOString().split("T")[0];
  
  snapshot.forEach(doc => {
    const job = doc.data();
    if (job.warranty) {
      const isExpired = today > job.warranty.warrantyEndDate;
      const overLimit = job.warranty.usedFreeServices >= 3;
      
      if (isExpired || overLimit) {
        console.log(\`🚨 ลูกค้า: \${job.customerName}\`);
        console.log(\`   เหตุผล: \${isExpired ? "หมดประกัน 1 ปี" : "ซ่อมฟรีเกิน 3 ครั้ง"}\`);
      }
    }
  });
}`}</pre>
                )}
              </div>
            </div>

            {/* Test Simulation Panel */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-700 uppercase flex items-center gap-1">
                  <Terminal className="w-4 h-4 text-slate-500" /> คอนโซลจำลองการรันสคริปต์ตรวจสิทธิ์จริง
                </span>
                <button
                  onClick={runCheckSimulation}
                  disabled={isSimulating}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 disabled:opacity-50 text-[10px] font-mono font-bold rounded-xl flex items-center gap-1 transition cursor-pointer shadow-sm"
                >
                  <Play className="w-3 h-3 fill-emerald-400" />
                  {isSimulating ? "กำลังประมวลผล..." : "รันสคริปต์ทดสอบ (Run Check)"}
                </button>
              </div>

              <div className="bg-slate-950 text-slate-300 font-mono text-[10px] p-3 rounded-xl h-[130px] overflow-y-auto leading-relaxed border border-slate-800 scrollbar-thin">
                {simulationLogs.length === 0 ? (
                  <div className="text-slate-500 italic h-full flex items-center justify-center">
                    กดปุ่ม "รันสคริปต์ทดสอบ (Run Check)" เพื่อรันการประมวลผลหาลูกค้าที่หมดประกันหรือซ่อมเกิน 3 ครั้ง
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {simulationLogs.map((log, i) => (
                      <div key={i} className={
                        log.includes("🚨") || log.includes("❌")
                          ? "text-rose-400" 
                          : log.includes("✅") || log.includes("🟢")
                          ? "text-emerald-400"
                          : log.includes("⚠️")
                          ? "text-amber-300"
                          : "text-slate-300"
                      }>
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

