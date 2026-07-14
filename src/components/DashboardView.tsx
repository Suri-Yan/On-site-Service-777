import React from "react";
import {
  Calendar,
  Clock,
  Briefcase,
  Layers,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Bell,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { Job, Equipment, SystemNotification } from "../types";

interface DashboardViewProps {
  jobs: Job[];
  equipments: Equipment[];
  notifications: SystemNotification[];
  onSelectJob: (job: Job) => void;
  onNavigateToTab: (tab: string) => void;
  onMarkAllNotificationsRead: () => void;
}

export default function DashboardView({
  jobs,
  equipments,
  notifications,
  onSelectJob,
  onNavigateToTab,
  onMarkAllNotificationsRead,
}: DashboardViewProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split("T")[0];

  // Helper: check if date is in current week
  const isThisWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
    const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    return date >= firstDay && date <= lastDay;
  };

  // Job Filters
  const todayJobs = jobs.filter((job) => job.date === todayStr);
  const tomorrowJobs = jobs.filter((job) => job.date === tomorrowStr);
  const weekJobs = jobs.filter((job) => isThisWeek(job.date));

  const totalScanned = equipments.length;
  const inProgressJobs = jobs.filter((job) => job.status === "In Progress").length;
  const pendingJobs = jobs.filter((job) => job.status === "Pending").length;
  const urgentJobs = jobs.filter((job) => job.jobType === "Emergency").length;

  const handleOpenGoogleCalendar = () => {
    window.open("https://calendar.google.com", "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Visual Header Grid banner - Professional Polish Corporate Style */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 max-w-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            ระบบบริหารตารางนัดหมายและสแกนอุปกรณ์
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-3 text-slate-100">
            สวัสดีช่างเทคนิค ยินดีต้อนรับสู่ระบบสแกน & จัดการใบงาน
          </h1>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            สแกนอุปกรณ์และดึงข้อมูลอัจฉริยะ ซิงค์ใบงานนัดหมายตรงเข้า Google Calendar และจำลองแจ้งเตือนความคืบหน้าเรียลไทม์
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => onNavigateToTab("jobs")}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Briefcase className="w-4 h-4" /> เริ่มสแกน & บันทึกงาน
            </button>
            <button
              onClick={handleOpenGoogleCalendar}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-semibold rounded-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" /> เปิด Google Calendar <ExternalLink className="w-3 h-3 text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Top statistics overview row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">อุปกรณ์ติดตั้งแล้ว</div>
            <div className="text-2xl font-bold text-slate-900">{totalScanned} ตัว</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">งานกำลังดำเนินการ</div>
            <div className="text-2xl font-bold text-slate-900">{inProgressJobs} ใบ</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">งานรอช่างเข้าดำเนินการ</div>
            <div className="text-2xl font-bold text-slate-900">{pendingJobs} ใบ</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition col-span-2 lg:col-span-1">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">ใบงานด่วน / ฉุกเฉิน</div>
            <div className="text-2xl font-bold text-slate-950">{urgentJobs} ใบ</div>
          </div>
        </div>
      </div>

      {/* Job Schedulers Tabs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Today, Tomorrow, This Week Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-lg">กำหนดการใบงาน</h2>
            <button
              onClick={() => onNavigateToTab("jobs")}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-0.5"
            >
              ดูใบงานทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Today Block */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                  งานวันนี้ ({todayJobs.length})
                </span>
                <span className="text-xs font-mono text-slate-400">{todayStr}</span>
              </div>
              {todayJobs.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">ไม่มีงานตามกำหนดการในวันนี้</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {todayJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => onSelectJob(job)}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between group cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-sm text-slate-800 group-hover:text-blue-600 transition">
                          {job.customerName}
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-slate-400">
                          <span className="font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> {job.startTime} - {job.endTime}
                          </span>
                          <span>•</span>
                          <span>{job.jobType}</span>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          job.status === "In Progress"
                            ? "bg-blue-50 text-blue-600"
                            : job.status === "Completed"
                            ? "bg-green-50 text-green-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tomorrow Block */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md">
                  งานพรุ่งนี้ ({tomorrowJobs.length})
                </span>
                <span className="text-xs font-mono text-slate-400">{tomorrowStr}</span>
              </div>
              {tomorrowJobs.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">ไม่มีงานตามกำหนดการในวันพรุ่งนี้</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {tomorrowJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => onSelectJob(job)}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between group cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-sm text-slate-800 group-hover:text-blue-600 transition">
                          {job.customerName}
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-slate-400">
                          <span className="font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {job.startTime} - {job.endTime}
                          </span>
                          <span>•</span>
                          <span>{job.jobType}</span>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-50 text-amber-600">
                        {job.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Week Block */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  งานสัปดาห์นี้ ({weekJobs.length})
                </span>
                <span className="text-xs font-medium text-slate-400">ภายในสัปดาห์นี้</span>
              </div>
              {weekJobs.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">ไม่มีกำหนดการอื่นในสัปดาห์นี้</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {weekJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => onSelectJob(job)}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between group cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-sm text-slate-800 group-hover:text-blue-600 transition">
                          {job.customerName}
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-slate-400">
                          <span className="font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" /> {job.date} | {job.startTime}
                          </span>
                          <span>•</span>
                          <span>{job.jobType}</span>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          job.status === "In Progress"
                            ? "bg-blue-50 text-blue-600"
                            : job.status === "Completed"
                            ? "bg-green-50 text-green-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Notification Center & Reminder options preview */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-lg">แจ้งเตือน & คิวงานด่วน</h2>
            <button
              onClick={onMarkAllNotificationsRead}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              อ่านทั้งหมด
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">
              <Bell className="w-4.5 h-4.5 text-blue-600 animate-bounce" />
              <span>แจ้งเตือนล่าสุด (FCM Live Feed)</span>
            </div>

            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">ไม่มีแจ้งเตือนใหม่ในระบบ</p>
            ) : (
              <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-xl border transition flex gap-3 ${
                      notif.read
                        ? "bg-slate-50/50 border-slate-100 opacity-70"
                        : "bg-blue-50/10 border-blue-100 shadow-xs"
                    }`}
                  >
                    <div className="mt-0.5">
                      {notif.category === "urgent" ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100 animate-pulse mt-1" />
                      ) : notif.category === "completed" ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1" />
                      )}
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <div className="font-semibold text-xs text-slate-800 flex justify-between">
                        <span>{notif.title}</span>
                        <span className="font-mono text-[9px] text-slate-400">
                          {new Date(notif.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick reminder scheduler guidelines card */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <CheckCircle className="w-4.5 h-4.5 text-blue-600" />
              ระบบตั้งเวลาเตือนความจำนัด
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed mt-2">
              เมื่อสร้างใบงาน ระบบจะส่งแจ้งเตือนและข้อความตอบรับการนัดผ่านช่องทาง Google Calendar, อีเมล หรือ SMS
              อัตโนมัติ พร้อมตั้งเตือนล่วงหน้าตามช่วงเวลาที่กำหนด
            </p>
            <div className="flex gap-2 mt-4 flex-wrap">
              <span className="text-[10px] font-bold bg-white text-slate-700 border border-slate-200 px-2 py-1 rounded">
                1 วันก่อนนัด
              </span>
              <span className="text-[10px] font-bold bg-white text-slate-700 border border-slate-200 px-2 py-1 rounded">
                3 ชั่วโมงก่อนนัด
              </span>
              <span className="text-[10px] font-bold bg-white text-slate-700 border border-slate-200 px-2 py-1 rounded">
                1 ชั่วโมงก่อนนัด
              </span>
              <span className="text-[10px] font-bold bg-white text-slate-700 border border-slate-200 px-2 py-1 rounded">
                30 นาที
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
