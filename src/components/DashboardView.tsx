import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Briefcase,
  Layers,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Bell,
  CheckCircle,
  ExternalLink,
  Users,
  CheckSquare,
  DollarSign,
  ChevronLeft,
  MapPin
} from "lucide-react";
import { Job, Equipment, SystemNotification, Customer } from "../types";

interface DashboardViewProps {
  jobs: Job[];
  equipments: Equipment[];
  notifications: SystemNotification[];
  customers: Customer[];
  onSelectJob: (job: Job) => void;
  onNavigateToTab: (tab: "dashboard" | "customers" | "jobs" | "equipments" | "analytics" | "security") => void;
  onMarkAllNotificationsRead: () => void;
}

export default function DashboardView({
  jobs,
  equipments,
  notifications,
  customers,
  onSelectJob,
  onNavigateToTab,
  onMarkAllNotificationsRead
}: DashboardViewProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  // Selected date state for the interactive Job Calendar
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(todayStr);
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);

  // Stats calculation
  const todayJobs = jobs.filter((job) => job.date === todayStr);
  const completedJobs = jobs.filter((job) => job.status === "Completed");
  const pendingJobs = jobs.filter((job) => job.status === "Pending");
  const inProgressJobs = jobs.filter((job) => job.status === "In Progress");
  const urgentJobs = jobs.filter((job) => job.jobType === "Emergency" && job.status !== "Completed");

  // Revenue calculation
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

  // Generate Calendar Days for Interactive Widget
  const getDaysInMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + currentMonthOffset);
    const year = d.getFullYear();
    const month = d.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week (0-6)
    const totalDays = new Date(year, month + 1, 0).getDate();

    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthTotalDays - i,
        isCurrentMonth: false,
        dateString: `${year}-${String(month).padStart(2, "0")}-${String(prevMonthTotalDays - i).padStart(2, "0")}`
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        dateString: `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`
      });
    }

    // Pad till multiple of 7
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        dateString: `${year}-${String(month + 2).padStart(2, "0")}-${String(i).padStart(2, "0")}`
      });
    }

    return { days, monthName: d.toLocaleDateString("th-TH", { month: "long", year: "numeric" }) };
  };

  const { days: calendarDays, monthName: currentMonthName } = getDaysInMonth();

  // Jobs scheduled on the selected calendar date
  const selectedDateJobs = jobs.filter((j) => j.date === selectedCalendarDate);

  return (
    <div className="space-y-6 text-left" id="dashboard-view-container">
      {/* Visual Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 max-w-xl">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            ระบบบริหารตารางนัดหมาย สแกนอุปกรณ์และเช็คลิสต์ช่างเทคนิค
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-3 text-slate-100">
            แผงควบคุมระบบคิงคอม (Kingcom Core DB)
          </h1>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            ระบบประสานงานช่างภาคสนาม ติดตามงาน CCTV, LAN, WiFi, Fiber Optic, Access Control, Time Attendance, โซล่าเซลล์ และรายงานสรุป PM ประจำวัน
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => onNavigateToTab("jobs")}
              className="px-5 py-2.5 bg-[#155dfc] hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Briefcase className="w-4 h-4" /> ตารางนัดหมาย & ดำเนินงาน
            </button>
            <button
              onClick={() => onNavigateToTab("customers")}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 active:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4" /> ฐานข้อมูลลูกค้า
            </button>
          </div>
        </div>
      </div>

      {/* Grid of 8 stats requested by the user */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Stat 1: Today's jobs */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition">
          <div className="p-2.5 bg-blue-50 text-[#155dfc] rounded-xl shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">จำนวนงานวันนี้</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{todayJobs.length} งาน</div>
          </div>
        </div>

        {/* Stat 2: In Progress Jobs */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">งานค้าง / ดำเนินการ</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{inProgressJobs.length} งาน</div>
          </div>
        </div>

        {/* Stat 3: Completed Jobs */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition">
          <div className="p-2.5 bg-green-50 text-green-600 rounded-xl shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">งานเสร็จสิ้นแล้ว</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{completedJobs.length} งาน</div>
          </div>
        </div>

        {/* Stat 4: Pending Jobs */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">งานรอดำเนินการ</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{pendingJobs.length} งาน</div>
          </div>
        </div>

        {/* Stat 5: Revenue */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">รายได้ประมาณการ</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">฿{totalRevenue.toLocaleString()}</div>
          </div>
        </div>

        {/* Stat 6: Total Customers */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition">
          <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">จำนวนลูกค้าสะสม</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{customers.length} รายการ</div>
          </div>
        </div>

        {/* Stat 7: Total Installed Equipments */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">จำนวนอุปกรณ์ติดตั้ง</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{equipments.length} ตัว</div>
          </div>
        </div>

        {/* Stat 8: Urgent Emergency alarms */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5 hover:shadow-sm transition">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">คิวแจ้งเตือนฉุกเฉิน</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{urgentJobs.length} งาน</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Calendar & Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Calendar Widget (ปฏิทินงาน) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <CalendarIcon className="w-4.5 h-4.5 text-[#155dfc]" /> ปฏิทินจองเวลาและใบงาน (Job Calendar Schedule)
            </h3>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setCurrentMonthOffset((prev) => prev - 1)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-50 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 min-w-[120px] text-center">
                {currentMonthName}
              </span>
              <button
                onClick={() => setCurrentMonthOffset((prev) => prev + 1)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-50 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Monthly grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 pb-1 border-b border-slate-100">
            <div>อา</div>
            <div>จ</div>
            <div>อ</div>
            <div>พ</div>
            <div>พฤ</div>
            <div>ศ</div>
            <div>ส</div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, idx) => {
              const dateJobs = jobs.filter((j) => j.date === cell.dateString);
              const isSelected = selectedCalendarDate === cell.dateString;
              const isToday = todayStr === cell.dateString;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedCalendarDate(cell.dateString)}
                  className={`py-3.5 rounded-xl text-center relative cursor-pointer transition flex flex-col items-center justify-center ${
                    isSelected
                      ? "bg-slate-900 text-white font-extrabold shadow-md"
                      : cell.isCurrentMonth
                      ? "bg-white hover:bg-slate-50 text-slate-800"
                      : "bg-slate-50 text-slate-350"
                  } ${isToday && !isSelected ? "ring-2 ring-blue-500 font-extrabold" : ""}`}
                >
                  <span className="text-xs">{cell.day}</span>
                  {dateJobs.length > 0 && (
                    <div className="absolute bottom-1.5 flex gap-0.5 justify-center">
                      {dateJobs.map((j) => (
                        <span
                          key={j.id}
                          className={`w-1.5 h-1.5 rounded-full ${
                            j.status === "Completed"
                              ? "bg-emerald-500"
                              : j.status === "In Progress"
                              ? "bg-blue-500"
                              : "bg-amber-500"
                          }`}
                        ></span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Details of Selected Date jobs */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              รายการใบงานประจำวันที่: {new Date(selectedCalendarDate).toLocaleDateString("th-TH", { dateStyle: "long" })} ({selectedDateJobs.length} รายการ)
            </h4>

            {selectedDateJobs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">ไม่มีกิจกรรมหรือใบงานนัดหมายในวันที่เลือก</p>
            ) : (
              <div className="space-y-2">
                {selectedDateJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => onSelectJob(job)}
                    className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-xs cursor-pointer transition"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800">{job.id} - {job.customerName}</div>
                      <div className="text-slate-400 flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {job.startTime} - {job.endTime} น. | {job.jobType}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            )}
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
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
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
              <CheckCircle className="w-4.5 h-4.5 text-[#155dfc]" />
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
