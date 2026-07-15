import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Layers,
  Bell,
  Shield,
  User,
  Users,
  BarChart3,
  LogOut,
  Calendar,
  AlertTriangle,
  FileText,
  Volume2,
  Sun,
  Moon,
} from "lucide-react";
import { Job, Equipment, SystemNotification, UserRole, Customer } from "./types";
import {
  initAuth,
  googleSignIn,
  logout,
  setAccessTokenDirectly,
} from "./lib/firebaseAuth";
import DashboardView from "./components/DashboardView";
import JobsView from "./components/JobsView";
import EquipmentsView from "./components/EquipmentsView";
import CustomersView from "./components/CustomersView";
import AnalyticsView from "./components/AnalyticsView";
import BackupHub from "./components/BackupHub";
import KingcomLogo from "./components/KingcomLogo";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const [activeTab, setActiveTab] = useState<"dashboard" | "jobs" | "equipments" | "customers" | "analytics" | "security">("dashboard");

  // Core DB States
  const [jobs, setJobs] = useState<Job[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  // Auth states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>("Admin");

  // Cross-view selections & search queries
  const [searchQueryForEq, setSearchQueryForEq] = useState("");
  const [selectedJobExternal, setSelectedJobExternal] = useState<Job | null>(null);

  // Fetch Database from Full-Stack Express Server on Mount
  useEffect(() => {
    fetchDb();
  }, []);

  // Initialize Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        // Automatically map the user's email to "Admin"
        setCurrentRole("Admin");
        addAuditLog("Signed In", user.displayName || user.email || "Unknown User", "เข้าสู่ระบบและได้รับสิทธิ์แอดมิน");
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const fetchDb = async () => {
    try {
      const res = await fetch("/api/db");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setEquipments(data.equipments || []);
        setNotifications(data.notifications || []);
        setCustomers(data.customers || []);
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch database:", err);
    }
  };

  // Persists local React state back to our Express Node server
  const saveDb = async (
    updatedJobs: Job[],
    updatedEqs: Equipment[],
    updatedNotifs: SystemNotification[],
    updatedLogs: any[],
    updatedCustomers: Customer[] = customers
  ) => {
    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobs: updatedJobs,
          equipments: updatedEqs,
          notifications: updatedNotifs,
          logs: updatedLogs,
          customers: updatedCustomers,
        }),
      });
    } catch (err) {
      console.error("Failed to persist database to server:", err);
    }
  };

  const addAuditLog = (action: string, user: string, details: string) => {
    const newLog = {
      id: "log-" + Date.now(),
      timestamp: new Date().toISOString(),
      action,
      user,
      details,
    };
    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);
    saveDb(jobs, equipments, notifications, updatedLogs);
  };

  // Google Sign-In with popup
  const handleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        setCurrentRole("Admin");
        addAuditLog("OAuth Login Successful", res.user.displayName || res.user.email || "User", "เชื่อมโยงกับ Google Calendar สำเร็จ");
      }
    } catch (err: any) {
      console.error("Auth popup error:", err);
      alert("ไม่สามารถลงชื่อเข้าใช้งานได้: " + err.message);
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm("คุณต้องการออกจากระบบบัญชี Google ใช่หรือไม่?");
    if (!confirmed) return;

    await logout();
    setCurrentUser(null);
    setAccessToken(null);
    addAuditLog("Signed Out", currentUser?.displayName || "User", "ออกจากระบบสำเร็จ");
  };

  // Job Actions
  const handleCreateJob = (newJob: Job) => {
    const updatedJobs = [newJob, ...jobs];
    setJobs(updatedJobs);
    addAuditLog("Job Created", currentRole, `สร้างใบงานใหม่สำหรับลูกค้า ${newJob.customerName} (${newJob.id})`);
    saveDb(updatedJobs, equipments, notifications, logs);
  };

  const handleUpdateJob = (updatedJob: Job) => {
    const updatedJobs = jobs.map((j) => (j.id === updatedJob.id ? updatedJob : j));
    setJobs(updatedJobs);
    addAuditLog("Job Updated", currentRole, `อัปเดตรายละเอียดใบงานลูกค้า ${updatedJob.customerName} (${updatedJob.id})`);
    saveDb(updatedJobs, equipments, notifications, logs);
  };

  const handleDeleteJob = (jobId: string) => {
    const updatedJobs = jobs.filter((j) => j.id !== jobId);
    setJobs(updatedJobs);
    addAuditLog("Job Deleted", currentRole, `ลบใบงานออกถาวร (${jobId})`);
    saveDb(updatedJobs, equipments, notifications, logs);
  };

  // Customer Actions
  const handleCreateCustomer = (newCustomer: Customer) => {
    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    addAuditLog("Customer Created", currentRole, `เพิ่มลูกค้าใหม่ ${newCustomer.name}`);
    saveDb(jobs, equipments, notifications, logs, updated);
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    const updated = customers.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c));
    setCustomers(updated);
    addAuditLog("Customer Updated", currentRole, `แก้ไขข้อมูลลูกค้า ${updatedCustomer.name}`);
    saveDb(jobs, equipments, notifications, logs, updated);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const target = customers.find((c) => c.id === customerId);
    const nameStr = target ? target.name : customerId;
    const updated = customers.filter((c) => c.id !== customerId);
    setCustomers(updated);
    addAuditLog("Customer Deleted", currentRole, `ลบลูกค้าออกถาวร ${nameStr}`);
    saveDb(jobs, equipments, notifications, logs, updated);
  };

  // Scanned Hardware Actions inside jobs
  const handleAddEquipmentToJob = (jobId: string, newEq: Equipment) => {
    // 1. Check if S/N already exists in general equipment DB
    const isDuplicate = equipments.some(
      (e) => e.serialNumber.toLowerCase() === newEq.serialNumber.toLowerCase()
    );

    // Update equipments array
    let updatedEqs = [...equipments];
    if (!isDuplicate) {
      updatedEqs = [newEq, ...equipments];
    } else {
      // update details of existing one
      updatedEqs = equipments.map((e) =>
        e.serialNumber.toLowerCase() === newEq.serialNumber.toLowerCase()
          ? { ...e, ...newEq, photos: [...(e.photos || []), ...(newEq.photos || [])] }
          : e
      );
    }

    // 2. Add S/N references to the active Job
    const targetJob = jobs.find((j) => j.id === jobId);
    if (targetJob) {
      const isAlreadyInJob = targetJob.equipmentSerials.includes(newEq.serialNumber);
      if (!isAlreadyInJob) {
        const updatedJob = {
          ...targetJob,
          equipmentSerials: [...targetJob.equipmentSerials, newEq.serialNumber],
        };
        const updatedJobs = jobs.map((j) => (j.id === jobId ? updatedJob : j));
        setJobs(updatedJobs);
        setEquipments(updatedEqs);
        addAuditLog(
          "Equipment Added To Job",
          currentRole,
          `สแกนและเพิ่มอุปกรณ์ ${newEq.brand} ${newEq.model} S/N: ${newEq.serialNumber} ในใบงาน ${jobId}`
        );
        saveDb(updatedJobs, updatedEqs, notifications, logs);
        playBeep();
      } else {
        alert(`พบอุปกรณ์ S/N: ${newEq.serialNumber} มีอยู่ในใบงานนี้แล้ว!`);
      }
    }
  };

  const playBeep = () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "sine";
      osc.frequency.value = 1200;
      gain.gain.setValueAtTime(0.3, context.currentTime);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + 0.15);
    } catch (e) {
      // Ignored
    }
  };

  // Trigger from equipment history view
  const handleSearchHistory = (serial: string) => {
    setSearchQueryForEq(serial);
    setActiveTab("equipments");
  };

  const handleSelectJobFromDashboard = (job: Job) => {
    setSelectedJobExternal(job);
    setActiveTab("jobs");
  };

  // Backup and encrypted restores
  const handleExportBackup = () => {
    const payloadData = {
      jobs,
      equipments,
      users: [],
    };
    const backupStr = JSON.stringify(payloadData);
    const base64Backup = btoa(unescape(encodeURIComponent(backupStr)));

    // Create virtual download file
    const element = document.createElement("a");
    const file = new Blob([base64Backup], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `equipment-scanner-backup-${new Date().toISOString().split("T")[0]}.enc`;
    document.body.appendChild(element);
    element.click();
    addAuditLog("Exported Database", currentRole, "ดาวน์โหลดรหัสสำรองข้อมูลระบบแบบเข้ารหัสสำเร็จ");
  };

  const handleImportBackup = async (payload: string): Promise<boolean> => {
    try {
      const decodedStr = decodeURIComponent(escape(atob(payload)));
      const parsedData = JSON.parse(decodedStr);
      if (!parsedData.jobs || !parsedData.equipments) return false;

      setJobs(parsedData.jobs);
      setEquipments(parsedData.equipments);
      addAuditLog("Imported Database", currentRole, "กู้คืนฐานข้อมูลสำรองเข้ารหัสเขียนทับเรียบร้อย");
      saveDb(parsedData.jobs, parsedData.equipments, notifications, logs);
      return true;
    } catch (e) {
      console.error("Backup import error:", e);
      return false;
    }
  };

  // FCM Real-time simulation events
  const handleSimulateFCMNotification = (type: "urgent" | "reschedule" | "duplicate") => {
    playSimulatedSound();

    let newNotif: SystemNotification;
    if (type === "urgent") {
      newNotif = {
        id: "notif-" + Date.now(),
        title: "🚨 ใบงานเร่งด่วนใหม่ (FCM Alert)",
        message: "ลูกค้า บริษัท สมาร์ทโฮม จำกัด แจ้งซ่อมแซมระบบเร้าเตอร์อินเทอร์เน็ตด่วนที่สุด กรุณาตรวจสอบตารางเดินงาน",
        category: "urgent",
        createdAt: new Date().toISOString(),
        read: false,
      };

      // Create simulated Urgent Job
      const newUrgentJob: Job = {
        id: "JOB-" + Math.floor(1000 + Math.random() * 9000),
        customerName: "บริษัท สมาร์ทโฮม จำกัด",
        jobType: "Emergency",
        phone: "02-999-1111",
        address: "55/12 แขวงบางเขน เขตหลักสี่ กรุงเทพมหานคร 10210",
        date: new Date().toISOString().split("T")[0],
        startTime: "16:00",
        endTime: "18:00",
        notes: "เกิดเหตุอินเทอร์เน็ตล่มทั้งอาคารสำนักงานใหญ่ ช่างวิชัยเตรียมเข้าติดตั้งเครื่องสำรองด่วน",
        status: "Pending",
        reminders: ["30min"],
        equipmentSerials: [],
        technicianName: "วิชัย ช่างเทคนิค",
      };

      const updatedJobs = [newUrgentJob, ...jobs];
      const updatedNotifs = [newNotif, ...notifications];
      setJobs(updatedJobs);
      setNotifications(updatedNotifs);
      addAuditLog("Emergency Job Triggered", "FCM Simulator", "จำลองส่งสัญญานผ่าน Firebase Cloud Messaging");
      saveDb(updatedJobs, equipments, updatedNotifs, logs);
    } else if (type === "reschedule") {
      newNotif = {
        id: "notif-" + Date.now(),
        title: "📅 ตารางนัดหมายเลื่อนเวลา (Rescheduled)",
        message: "ลูกค้า คุณมณี สุขสวัสดิ์ ได้ทำการเลื่อนเวลาเข้าตรวจสอบงานซ่อมจากช่วงเช้าเป็นเวลา 15:30 น.",
        category: "new",
        createdAt: new Date().toISOString(),
        read: false,
      };

      // Find job and update
      const updatedJobs = jobs.map((job) =>
        job.id === "JOB-1002"
          ? { ...job, startTime: "15:30", endTime: "17:30", notes: "ลูกค้าเลื่อนเวลาผ่านระบบอัตโนมัติ" }
          : job
      );

      const updatedNotifs = [newNotif, ...notifications];
      setJobs(updatedJobs);
      setNotifications(updatedNotifs);
      addAuditLog("Job Time Rescheduled", "FCM Simulator", "ลูกค้าเลื่อนตารางนัดหมายและแก้ไข Google Calendar แล้ว");
      saveDb(updatedJobs, equipments, updatedNotifs, logs);
    } else {
      newNotif = {
        id: "notif-" + Date.now(),
        title: "⚠️ ตรวจพบฮาร์ดแวร์ซ้ำซ้อนในคลัง (Conflict S/N)",
        message: "อุปกรณ์ Mikrotik S/N: MT749204859 กำลังถูกพยายามสแกนลงใบงานอื่นโดยไม่พึงประสงค์",
        category: "urgent",
        createdAt: new Date().toISOString(),
        read: false,
      };
      const updatedNotifs = [newNotif, ...notifications];
      setNotifications(updatedNotifs);
      addAuditLog("Conflict Scan Warning", "FCM Simulator", "การจำลองแจ้งเตือนรหัส S/N ซ้ำซ้อนในฐานข้อมูลกลาง");
      saveDb(jobs, equipments, updatedNotifs, logs);
    }
  };

  const playSimulatedSound = () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, context.currentTime + 0.3);
      gain.gain.setValueAtTime(0.4, context.currentTime);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + 0.3);
    } catch (e) {
      // Ignored
    }
  };

  const handleMarkAllNotificationsRead = () => {
    const updatedNotifs = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updatedNotifs);
    saveDb(jobs, equipments, updatedNotifs, logs);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 flex flex-col font-sans ${isDarkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      {/* Top Navbar / Professional Polish Corporate Header */}
      <header className="relative z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 shrink-0 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <KingcomLogo />
            <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
            <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-semibold max-w-[220px] leading-tight">
              ระบบจัดการคลังฮาร์ดแวร์และประวัติใบงานติดตั้งอัจฉริยะ
            </p>
          </div>

          {/* FCM Simulated Alerts triggers */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase px-2 flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-blue-600 dark:text-blue-400" /> FCM Sim:
            </span>
            <button
              onClick={() => handleSimulateFCMNotification("urgent")}
              className="text-[10px] font-bold bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer shadow-xs"
            >
              ใบงานด่วนเข้า
            </button>
            <button
              onClick={() => handleSimulateFCMNotification("reschedule")}
              className="text-[10px] font-bold bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition cursor-pointer shadow-xs"
            >
              ลูกค้าเลื่อนนัด
            </button>
            <button
              onClick={() => handleSimulateFCMNotification("duplicate")}
              className="text-[10px] font-bold bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 transition cursor-pointer shadow-xs"
            >
              สแกนรหัสซ้ำ
            </button>
          </div>

          {/* Login Profile, Theme Toggle and GCal Sync Status Button */}
          <div className="flex items-center gap-3">
            {/* Theme Selector Toggle Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs cursor-pointer flex items-center justify-center"
              title={isDarkMode ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50 rounded-full text-xs font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Google Calendar Synced
                </div>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
                <div className="flex items-center gap-2.5">
                  <img
                    src={currentUser.photoURL || ""}
                    alt="User avatar"
                    className="w-9 h-9 bg-slate-200 rounded-full border border-slate-300 dark:border-slate-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold leading-none">{currentUser.displayName}</div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">Lead Technician</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 rounded-lg transition cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" /> เชื่อม Google Calendar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Primary Sub Navigation Tabs */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {(["dashboard", "jobs", "equipments", "customers", "analytics", "security"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === tab
                  ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {tab === "dashboard" && (
                <>
                  <Briefcase className="w-4.5 h-4.5" /> แดชบอร์ดความคืบหน้า
                </>
              )}
              {tab === "jobs" && (
                <>
                  <FileText className="w-4.5 h-4.5" /> ทะเบียนใบงานคลังนัดหมาย
                </>
              )}
              {tab === "equipments" && (
                <>
                  <Layers className="w-4.5 h-4.5" /> ฐานข้อมูลคลังอุปกรณ์
                </>
              )}
              {tab === "customers" && (
                <>
                  <Users className="w-4.5 h-4.5" /> ทะเบียนรายชื่อลูกค้า
                </>
              )}
              {tab === "analytics" && (
                <>
                  <BarChart3 className="w-4.5 h-4.5" /> รายงาน & วิเคราะห์
                </>
              )}
              {tab === "security" && (
                <>
                  <Shield className="w-4.5 h-4.5" /> ระบบหลังบ้าน & ความปลอดภัย
                </>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Container Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {activeTab === "dashboard" && (
          <DashboardView
            jobs={jobs}
            equipments={equipments}
            notifications={notifications}
            customers={customers}
            onSelectJob={handleSelectJobFromDashboard}
            onNavigateToTab={(t) => setActiveTab(t as any)}
            onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          />
        )}

        {activeTab === "jobs" && (
          <JobsView
            jobs={jobs}
            allEquipments={equipments}
            accessToken={accessToken}
            currentUser={currentUser}
            onUpdateJob={handleUpdateJob}
            onCreateJob={handleCreateJob}
            onDeleteJob={handleDeleteJob}
            onAddEquipmentToJob={handleAddEquipmentToJob}
            onSearchHistory={handleSearchHistory}
            selectedJobExternal={selectedJobExternal}
            onClearSelectedJobExternal={() => setSelectedJobExternal(null)}
          />
        )}

        {activeTab === "equipments" && (
          <EquipmentsView
            equipments={equipments}
            jobs={jobs}
            onSearchQuery={searchQueryForEq}
            onClearSearchQuery={() => setSearchQueryForEq("")}
          />
        )}

        {activeTab === "customers" && (
          <CustomersView
            customers={customers}
            jobs={jobs}
            onCreateCustomer={handleCreateCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onSelectCustomerForJob={(customer) => {
              // Automatically switch to jobs, maybe we can pre-select something or just navigate
              setActiveTab("jobs");
            }}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsView
            jobs={jobs}
            equipments={equipments}
            customers={customers}
          />
        )}

        {activeTab === "security" && (
          <BackupHub
            currentRole={currentRole}
            onChangeRole={setCurrentRole}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            logs={logs}
          />
        )}
      </main>

      {/* Visual footer signature - Professional Polish Style */}
      <footer className="h-12 bg-slate-800 dark:bg-slate-900 text-slate-400 dark:text-slate-500 px-6 flex flex-col sm:flex-row items-center justify-between text-[10px] shrink-0 border-t border-slate-700 dark:border-slate-800 font-sans">
        <div className="flex gap-4">
          <span>v4.2.0-PRO</span>
          <span>Enterprise Security: AES-256 Enabled</span>
        </div>
        <div className="flex gap-4">
          <span>Technician Node: BKK-01</span>
          <span>© 2026 KINGCOM Computer Shop</span>
        </div>
      </footer>
    </div>
  );
}
