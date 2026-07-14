export type UserRole = "Admin" | "Manager" | "Technician";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
}

export interface Equipment {
  brand: string;
  model: string;
  serialNumber: string;
  macAddress?: string;
  imei?: string;
  installationDate?: string;
  customerName?: string;
  location?: string;
  warrantyStart?: string;
  warrantyEnd?: string;
  notes?: string;
  photos: string[]; // Base64 image data strings
}

export interface Job {
  id: string;
  customerName: string;
  jobType: "Installation" | "Repair" | "Maintenance" | "Emergency";
  phone: string;
  address: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  notes?: string;
  googleCalendarEventId?: string;
  status: "Pending" | "In Progress" | "Completed" | "Canceled";
  reminders: ("1day" | "3hours" | "1hour" | "30min")[];
  equipmentSerials: string[]; // Serial numbers connected to this job
  technicianName?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  category: "appointment" | "urgent" | "new" | "rescheduled" | "completed";
  createdAt: string;
  read: boolean;
}

export interface EquipmentHistoryItem {
  date: string;
  type: "Installation" | "Repair" | "Replacement" | "Inspection";
  technician: string;
  jobId: string;
  notes: string;
  photos: string[];
}
