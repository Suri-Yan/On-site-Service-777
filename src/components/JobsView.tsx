import React, { useState } from "react";
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle,
  User,
  Trash2,
  Share2,
  ExternalLink,
  Smartphone,
  Mail,
  Camera,
  Layers,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Job, Equipment } from "../types";
import Scanner from "./Scanner";
import PrintSticker from "./PrintSticker";

interface JobsViewProps {
  jobs: Job[];
  allEquipments: Equipment[];
  accessToken: string | null;
  currentUser: any;
  onUpdateJob: (updatedJob: Job) => void;
  onCreateJob: (newJob: Job) => void;
  onDeleteJob: (jobId: string) => void;
  onAddEquipmentToJob: (jobId: string, equipment: Equipment) => void;
  onSearchHistory: (serial: string) => void;
  selectedJobExternal?: Job | null;
  onClearSelectedJobExternal?: () => void;
}

export default function JobsView({
  jobs,
  allEquipments,
  accessToken,
  currentUser,
  onUpdateJob,
  onCreateJob,
  onDeleteJob,
  onAddEquipmentToJob,
  onSearchHistory,
  selectedJobExternal,
  onClearSelectedJobExternal,
}: JobsViewProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState<"All" | "Pending" | "In Progress" | "Completed" | "Canceled">("All");

  // Create Form State
  const [customerName, setCustomerName] = useState("");
  const [jobType, setJobType] = useState<"Installation" | "Repair" | "Maintenance" | "Emergency">("Installation");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [reminders, setReminders] = useState<("1day" | "3hours" | "1hour" | "30min")[]>(["3hours"]);

  // Sticker print modal
  const [stickerTarget, setStickerTarget] = useState<Equipment | null>(null);

  // Sync Google Calendar process states
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  // If a job was selected from another view (e.g. Dashboard)
  React.useEffect(() => {
    if (selectedJobExternal) {
      setSelectedJobId(selectedJobExternal.id);
      if (onClearSelectedJobExternal) onClearSelectedJobExternal();
    }
  }, [selectedJobExternal]);

  const activeJob = jobs.find((j) => j.id === selectedJobId) || null;

  // Handles Google Calendar API Event creation
  const handleAddToGoogleCalendar = async (job: Job) => {
    if (!accessToken) {
      alert("กรุณาเข้าสู่ระบบ Google Account ก่อนเชื่อมโยงปฏิทิน");
      return;
    }

    const confirmed = window.confirm(
      `คุณต้องการเพิ่มกิจกรรมนัดหมายสำหรับลูกค้า "${job.customerName}" ลงใน Google Calendar ใช่หรือไม่?`
    );
    if (!confirmed) return;

    setIsSyncing(job.id);

    try {
      // Maps grounding / maps links construction
      const googleMapsQuery = encodeURIComponent(job.address);
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${googleMapsQuery}`;

      const payload = {
        summary: `[งาน${getJobTypeLabel(job.jobType)}] คุณ ${job.customerName}`,
        description: `ประเภทงาน: ${job.jobType}\nเบอร์โทร: ${job.phone}\nที่อยู่จัดส่ง/ติดตั้ง: ${job.address}\nลิงก์แผนที่นำทาง: ${googleMapsUrl}\n\nรายละเอียดใบงานเพิ่มเติม:\n${job.notes || "-"}\n\n*ระบบอัปเดตอัตโนมัติจาก Equipment Scanner & Job Manager`,
        location: job.address,
        start: {
          dateTime: `${job.date}T${job.startTime}:00`,
          timeZone: "Asia/Bangkok",
        },
        end: {
          dateTime: `${job.date}T${job.endTime}:00`,
          timeZone: "Asia/Bangkok",
        },
      };

      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const eventData = await res.json();
        const updatedJob = { ...job, googleCalendarEventId: eventData.id };
        onUpdateJob(updatedJob);
        alert("เพิ่มนัดหมายลง Google Calendar เรียบร้อยแล้ว!");
      } else {
        const errData = await res.json();
        console.error("Google Calendar Error:", errData);
        alert(`เกิดข้อผิดพลาดในการเชื่อมต่อปฏิทิน: ${errData.error?.message || "ไม่ทราบสาเหตุ"}`);
      }
    } catch (err: any) {
      console.error("Failed to add to Google Calendar:", err);
      alert("ไม่สามารถเชื่อมต่อปฏิทินได้: " + err.message);
    } finally {
      setIsSyncing(null);
    }
  };

  // Handles Auto-update Google Calendar Event details
  const handleUpdateGoogleCalendar = async (job: Job) => {
    if (!accessToken || !job.googleCalendarEventId) return;

    try {
      const googleMapsQuery = encodeURIComponent(job.address);
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${googleMapsQuery}`;

      const payload = {
        summary: `[งาน${getJobTypeLabel(job.jobType)}] คุณ ${job.customerName}`,
        description: `ประเภทงาน: ${job.jobType}\nเบอร์โทร: ${job.phone}\nที่อยู่จัดส่ง/ติดตั้ง: ${job.address}\nลิงก์แผนที่นำทาง: ${googleMapsUrl}\n\nรายละเอียดใบงานเพิ่มเติม:\n${job.notes || "-"}\n\n*อัปเดตอัตโนมัติจากการเปลี่ยนตารางนัดหมาย`,
        location: job.address,
        start: {
          dateTime: `${job.date}T${job.startTime}:00`,
          timeZone: "Asia/Bangkok",
        },
        end: {
          dateTime: `${job.date}T${job.endTime}:00`,
          timeZone: "Asia/Bangkok",
        },
      };

      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${job.googleCalendarEventId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      console.log("Auto-updated Google Calendar Event:", job.googleCalendarEventId);
    } catch (err) {
      console.error("Auto-update Google Calendar failed:", err);
    }
  };

  // Handles Google Calendar Event deletion (with confirmation dialog)
  const handleDeleteFromGoogleCalendar = async (job: Job, quiet = false) => {
    if (!accessToken || !job.googleCalendarEventId) return;

    if (!quiet) {
      const confirmed = window.confirm(
        `ระบบตรวจพบว่าใบงานนี้ลิงก์อยู่กับปฏิทิน Google Calendar คุณต้องการลบกิจกรรมนัดหมายนี้ออกจากปฏิทินด้วยหรือไม่?`
      );
      if (!confirmed) return;
    }

    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${job.googleCalendarEventId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (res.ok) {
        console.log("Deleted Google Calendar Event:", job.googleCalendarEventId);
        if (!quiet) alert("ลบกิจกรรมออกจาก Google Calendar เรียบร้อยแล้ว");
      }
    } catch (err) {
      console.error("Delete Calendar Event error:", err);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !address || !date || !startTime || !endTime) {
      alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    const newJob: Job = {
      id: "JOB-" + Math.floor(1000 + Math.random() * 9000),
      customerName,
      jobType,
      phone,
      address,
      date,
      startTime,
      endTime,
      notes,
      status: "Pending",
      reminders,
      equipmentSerials: [],
      technicianName: currentUser?.displayName || "วิชัย ช่างเทคนิค",
    };

    onCreateJob(newJob);

    // Reset fields
    setCustomerName("");
    setPhone("");
    setAddress("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setNotes("");
    setShowCreateForm(false);
  };

  const handleStatusChange = (job: Job, newStatus: Job["status"]) => {
    const updatedJob: Job = { ...job, status: newStatus };
    onUpdateJob(updatedJob);

    // If canceled, auto delete google calendar event with user confirmation
    if (newStatus === "Canceled" && job.googleCalendarEventId) {
      handleDeleteFromGoogleCalendar(job);
    }
  };

  const handleDeleteClick = (job: Job) => {
    const confirmed = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบใบงาน "${job.id}"?`);
    if (!confirmed) return;

    if (job.googleCalendarEventId) {
      handleDeleteFromGoogleCalendar(job, true);
    }
    onDeleteJob(job.id);
    setSelectedJobId(null);
  };

  // Share schedules via LINE, Email, SMS
  const handleShare = (job: Job, channel: "line" | "sms" | "email") => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`;
    const text = `แจ้งตารางนัดหมายติดตั้งอุปกรณ์\nลูกค้า: ${job.customerName}\nประเภทงาน: ${job.jobType}\nวันที่: ${job.date}\nเวลา: ${job.startTime} - ${job.endTime} น.\nเบอร์โทรช่าง: ${job.phone}\nสถานที่: ${job.address}\nแผนที่นำทาง: ${mapsUrl}`;

    if (channel === "line") {
      window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, "_blank");
    } else if (channel === "sms") {
      window.open(`sms:${job.phone}?body=${encodeURIComponent(text)}`, "_blank");
    } else if (channel === "email") {
      window.open(
        `mailto:?subject=${encodeURIComponent(
          `ยืนยันเวลานัดหมายเข้าปฏิบัติงาน - คุณ ${job.customerName}`
        )}&body=${encodeURIComponent(text)}`,
        "_blank"
      );
    }
  };

  const getJobTypeLabel = (type: Job["jobType"]) => {
    switch (type) {
      case "Installation":
        return "ติดตั้งอุปกรณ์";
      case "Repair":
        return "ซ่อมแซม";
      case "Maintenance":
        return "บำรุงรักษา";
      case "Emergency":
        return "ด่วนที่สุด";
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (activeTabFilter === "All") return true;
    return job.status === activeTabFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">ระบบจัดการใบงาน (Jobs Ledger)</h2>
          <p className="text-xs text-slate-500">สร้างใบงานใหม่ มอบหมายงาน และเริ่มสแกนอุปกรณ์เพื่อเพิ่มลงประวัติได้ทันที</p>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg transition shadow-sm flex items-center gap-2 self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" /> สร้างใบงานใหม่
        </button>
      </div>

      {/* Filter Tabs and Jobs listing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Jobs Feed List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Scrollable Filters row */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {(["All", "Pending", "In Progress", "Completed", "Canceled"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveTabFilter(filter)}
                className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition shrink-0 cursor-pointer ${
                  activeTabFilter === filter
                    ? "bg-slate-950 text-white shadow-sm"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {filter === "All"
                  ? "ทั้งหมด"
                  : filter === "Pending"
                  ? "รอดำเนินการ"
                  : filter === "In Progress"
                  ? "กำลังทำ"
                  : filter === "Completed"
                  ? "เสร็จสิ้น"
                  : "ยกเลิก"}
              </button>
            ))}
          </div>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
                <p className="text-xs font-semibold text-slate-500">ไม่มีใบงานในสถานะนี้</p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`p-4 rounded-xl border transition text-left cursor-pointer ${
                    selectedJobId === job.id
                      ? "bg-slate-900 border-slate-900 text-white shadow-md"
                      : "bg-white border-slate-200 hover:border-slate-350 text-slate-700 shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        selectedJobId === job.id
                          ? "bg-white/15 text-blue-400"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {getJobTypeLabel(job.jobType)}
                    </span>
                    <span className="font-mono text-xs font-bold opacity-60">{job.id}</span>
                  </div>

                  <h3 className="font-bold text-sm line-clamp-1">{job.customerName}</h3>

                  <div className="flex items-center gap-3.5 mt-3 text-xs opacity-80 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 shrink-0" /> {job.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 shrink-0" /> {job.startTime} น.
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-dashed border-current/10 text-xs font-semibold">
                    <span className="opacity-80 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" /> {job.equipmentSerials.length} อุปกรณ์
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        job.status === "Completed"
                          ? "bg-green-600 text-white"
                          : job.status === "In Progress"
                          ? "bg-blue-600 text-white"
                          : job.status === "Canceled"
                          ? "bg-rose-600 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Active Job Details Drawer */}
        <div className="lg:col-span-2">
          {activeJob ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md">
                      {activeJob.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      ผู้บันทึก: {activeJob.technicianName || "วิชัย ช่างเทคนิค"}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">{activeJob.customerName}</h3>
                </div>

                <div className="flex gap-2 self-start">
                  <select
                    value={activeJob.status}
                    onChange={(e) => handleStatusChange(activeJob, e.target.value as Job["status"])}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-slate-900"
                  >
                    <option value="Pending">Pending (รอดำเนินการ)</option>
                    <option value="In Progress">In Progress (กำลังทำ)</option>
                    <option value="Completed">Completed (เสร็จสิ้น)</option>
                    <option value="Canceled">Canceled (ยกเลิกแล้ว)</option>
                  </select>

                  <button
                    onClick={() => handleDeleteClick(activeJob)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                    title="ลบใบงาน"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Grid meta info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2.5 text-xs font-medium text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="text-slate-400 font-normal">เบอร์ติดต่อลูกค้า</div>
                      <a href={`tel:${activeJob.phone}`} className="font-semibold text-slate-800 hover:underline">
                        {activeJob.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs font-medium text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="text-slate-400 font-normal">เวลาเข้าดำเนินการ</div>
                      <span className="font-semibold text-slate-800">
                        {activeJob.date} | {activeJob.startTime} - {activeJob.endTime} น.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-start gap-2.5 text-xs font-medium text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-slate-400 font-normal">ที่อยู่ติดตั้งอุปกรณ์</div>
                      <span className="font-semibold text-slate-800 line-clamp-2">{activeJob.address}</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          activeJob.address
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5 mt-1"
                      >
                        เปิดใน Google Maps <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {activeJob.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <span className="font-bold text-slate-700 block mb-1">หมายเหตุ:</span>
                  {activeJob.notes}
                </div>
              )}

              {/* Connect Google Calendar triggers */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center justify-center sm:justify-start gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    ซิงค์ข้อมูลกับ Google Calendar
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed max-w-sm">
                    ส่งตารางนัดหมายตรงเข้าสู่ปฏิทินของช่างเทคนิคโดยอัตโนมัติ พร้อมตั้งเตือนนัดหมาย และลิงก์แผนที่นำทาง
                  </p>
                </div>

                {activeJob.googleCalendarEventId ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> เชื่อมต่อกับ Calendar แล้ว
                    </span>
                    <button
                      onClick={() => handleUpdateGoogleCalendar(activeJob)}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:underline"
                    >
                      กดอัปเดตข้อมูลปฏิทินซ้ำ
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAddToGoogleCalendar(activeJob)}
                    disabled={isSyncing === activeJob.id}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSyncing === activeJob.id ? "กำลังเชื่อมโยง..." : "เพิ่มลง Google Calendar"}
                  </button>
                )}
              </div>

              {/* Share Schedules Panel */}
              <div className="space-y-2 pb-2">
                <h4 className="font-bold text-xs text-slate-700">ส่งต่อตารางนัดหมายให้ลูกค้า</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleShare(activeJob, "line")}
                    className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" /> แชร์ไป LINE
                  </button>

                  <button
                    onClick={() => handleShare(activeJob, "sms")}
                    className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" /> ส่ง SMS นัด
                  </button>

                  <button
                    onClick={() => handleShare(activeJob, "email")}
                    className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" /> ส่ง Email นัด
                  </button>
                </div>
              </div>

              {/* Scanned Hardware List connected to this job */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">อุปกรณ์ที่เกี่ยวข้องในใบงาน ({activeJob.equipmentSerials.length})</h4>
                  <span className="text-[10px] text-slate-400 font-medium">สแกนบาร์โค้ดด้านล่างเพื่อเพิ่มโดยอัตโนมัติ</span>
                </div>

                {activeJob.equipmentSerials.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    ยังไม่มีการสแกนอุปกรณ์สำหรับใบงานนี้
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeJob.equipmentSerials.map((sn) => {
                      const eq = allEquipments.find((e) => e.serialNumber === sn);
                      if (!eq) return null;
                      return (
                        <div
                          key={sn}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 group hover:border-slate-300 transition"
                        >
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{eq.brand}</span>
                            <h5 className="font-bold text-xs text-slate-800">{eq.model}</h5>
                            <div className="font-mono text-[10px] text-slate-500 font-bold">S/N: {eq.serialNumber}</div>
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setStickerTarget(eq)}
                              className="text-[10px] font-bold text-blue-700 bg-blue-50/60 hover:bg-blue-100/60 border border-blue-200 px-2.5 py-1.5 rounded-lg transition"
                            >
                              พิมพ์สติ๊กเกอร์
                            </button>
                            <button
                              onClick={() => onSearchHistory(eq.serialNumber)}
                              className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition"
                              title="ดูประวัติอุปกรณ์"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Print sticker preview modal */}
                {stickerTarget && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative">
                    <button
                      onClick={() => setStickerTarget(null)}
                      className="absolute top-3 right-3 text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      ปิดตัวอย่าง
                    </button>
                    <PrintSticker equipment={stickerTarget} />
                  </div>
                )}

                {/* Embed Active Scanner Component inside job */}
                {activeJob.status !== "Completed" && activeJob.status !== "Canceled" && (
                  <Scanner
                    onScanSuccess={(eq) => onAddEquipmentToJob(activeJob.id, eq)}
                    existingSerials={activeJob.equipmentSerials}
                    allEquipments={allEquipments}
                    onSearchHistory={onSearchHistory}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 text-center p-6">
              <FileText className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700 mb-1">เลือกใบงานเพื่อดูรายละเอียด</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                กดเลือกใบงานนัดหมายจากรายการด้านซ้ายเพื่อสแกนอุปกรณ์ ติดตามงานนัด หรืออัปเดต Google Calendar
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE JOB FULL DIALOG (MODAL OVERLAY) */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">สร้างใบงานนัดหมายใหม่</h3>
                <p className="text-xs text-slate-500">กรอกข้อมูลผู้จ้างและเวลาเข้าทำงาน ระบบจะจัดส่งตารางและซิงค์ทันที</p>
              </div>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-800 px-2 py-1 rounded"
              >
                ปิด
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อของลูกค้า / บริษัท *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="เช่น บริษัท ยิ้มสวย จำกัด, คุณกิตติ"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ประเภทงานเข้าปฏิบัติ *</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Installation">Installation (ติดตั้ง)</option>
                    <option value="Repair">Repair (งานซ่อม)</option>
                    <option value="Maintenance">Maintenance (บำรุงรักษา)</option>
                    <option value="Emergency">Emergency (ฉุกเฉินด่วน)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">เบอร์ติดต่อกลับลูกค้า *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 081-234-5678"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">สถานที่จัดส่ง/ที่ตั้งติดตั้ง *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ที่อยู่อย่างละเอียด พร้อมรหัสไปรษณีย์"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">วันที่เข้าทำงาน *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">เวลาเริ่มงาน *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">เวลาสิ้นสุด *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600">ตั้งค่าการเตือนความจำนัดล่วงหน้า</label>
                <div className="flex gap-2 flex-wrap">
                  {(["1day", "3hours", "1hour", "30min"] as const).map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => {
                        if (reminders.includes(opt)) {
                          setReminders(reminders.filter((r) => r !== opt));
                        } else {
                          setReminders([...reminders, opt]);
                        }
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition cursor-pointer ${
                        reminders.includes(opt)
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {opt === "1day"
                        ? "1 วันก่อนนัด"
                        : opt === "3hours"
                        ? "3 ชั่วโมงก่อน"
                        : opt === "1hour"
                        ? "1 ชั่วโมงก่อน"
                        : "30 นาทีล่วงหน้า"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">รายละเอียดและหมายเหตุเพิ่มเติม</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="รายละเอียดงาน ความต้องการพิเศษ การตั้งค่าเราเตอร์..."
                  rows={3}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 text-white text-sm font-semibold rounded-xl transition shadow-md"
                >
                  บันทึกใบงานใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
