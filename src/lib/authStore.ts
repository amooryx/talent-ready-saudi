import type { UserRole } from "./mockData";

// Simple hash simulation (NOT real crypto - prototype only)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return "hq$" + Math.abs(hash).toString(36) + "$" + btoa(str).slice(0, 8);
}

function verifyHash(password: string, hash: string): boolean {
  return simpleHash(password) === hash;
}

// Types
export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole | "university";
  name: string;
  createdAt?: string;
  disabled?: boolean;
  // Student fields
  university?: string;
  major?: string;
  gpa?: number;
  nationality?: string;
  transcriptUploaded?: boolean;
  transcriptVerified?: boolean;
  certifications?: { name: string; credlyId?: string; verified?: boolean }[];
  projects?: string[];
  academicScore?: number;
  skillsScore?: number;
  softSkillsScore?: number;
  roadmapProgress?: number;
  badges?: string[];
  avatar?: string;
  // HR fields
  company?: string;
  position?: string;
  industry?: string;
  // University fields
  universityName?: string;
  officialDomain?: string;
  adminContact?: string;
}

export interface Session {
  userId: string;
  role: UserRole | "university";
  loginAt: number;
  expiresAt: number;
  csrfToken: string;
}

interface RateLimit {
  attempts: number;
  lastAttempt: number;
  lockedUntil?: number;
}

const STORAGE_KEYS = {
  USERS: "hq_users",
  SESSION: "hq_session",
  RATE_LIMITS: "hq_rate_limits",
  ACTIVITY_LOG: "hq_activity_log",
};

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

// Generate CSRF token
function generateCSRF(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// Pre-registered demo users
function getDefaultUsers(): StoredUser[] {
  return [
    // Students
    {
      id: "s1", email: "abdullah@ksu.edu.sa", passwordHash: simpleHash("Student@123"), role: "student",
      name: "Abdullah Al-Harbi", university: "King Saud University", major: "Cybersecurity", gpa: 3.85,
      nationality: "Saudi", transcriptUploaded: true, transcriptVerified: true,
      certifications: [{ name: "OSCP", credlyId: "CR-OSCP-001", verified: true }, { name: "CEH", credlyId: "CR-CEH-002", verified: true }, { name: "eJPT", verified: true }],
      projects: ["Threat Detection System", "Vulnerability Scanner"], academicScore: 95, skillsScore: 90, softSkillsScore: 88,
      roadmapProgress: 78, badges: ["Top 1%", "Rising Star"], avatar: "AH",
    },
    {
      id: "s2", email: "reem@pnu.edu.sa", passwordHash: simpleHash("Student@123"), role: "student",
      name: "Reem Al-Qahtani", university: "Princess Nourah University", major: "Data Science", gpa: 3.92,
      nationality: "Saudi", transcriptUploaded: true, transcriptVerified: true,
      certifications: [{ name: "Google Data Analytics", verified: true }, { name: "TensorFlow Developer", credlyId: "CR-TF-003", verified: true }],
      projects: ["Sentiment Analysis Tool", "Predictive Analytics Dashboard"], academicScore: 96, skillsScore: 85, softSkillsScore: 82,
      roadmapProgress: 65, badges: ["Academic Excellence"], avatar: "RQ",
    },
    {
      id: "s3", email: "fahad@kfupm.edu.sa", passwordHash: simpleHash("Student@123"), role: "student",
      name: "Fahad Al-Mutairi", university: "KFUPM", major: "Mechanical Engineering", gpa: 3.78,
      nationality: "Saudi", transcriptUploaded: true, transcriptVerified: true,
      certifications: [{ name: "SolidWorks CSWA", verified: true }, { name: "PMP Fundamentals", verified: false }],
      projects: ["Robotic Arm Control System"], academicScore: 90, skillsScore: 74, softSkillsScore: 72,
      roadmapProgress: 45, badges: [], avatar: "FM",
    },
    {
      id: "s4", email: "sara@kau.edu.sa", passwordHash: simpleHash("Student@123"), role: "student",
      name: "Sara Al-Dosari", university: "King Abdulaziz University", major: "Marketing", gpa: 3.60,
      nationality: "Saudi", transcriptUploaded: true, transcriptVerified: false,
      certifications: [{ name: "Google Ads Certification", verified: true }, { name: "HubSpot Inbound Marketing", verified: true }],
      projects: ["Social Media Campaign Analysis"], academicScore: 84, skillsScore: 70, softSkillsScore: 80,
      roadmapProgress: 38, badges: ["Team Player"], avatar: "SD",
    },
    {
      id: "s5", email: "mohammed@imamu.edu.sa", passwordHash: simpleHash("Student@123"), role: "student",
      name: "Mohammed Al-Otaibi", university: "Imam Mohammad Ibn Saud University", major: "Software Engineering", gpa: 3.70,
      nationality: "Saudi", transcriptUploaded: true, transcriptVerified: true,
      certifications: [{ name: "AWS Solutions Architect", credlyId: "CR-AWS-005", verified: true }, { name: "Scrum Master", verified: true }, { name: "React Developer", verified: false }],
      projects: ["E-commerce Platform", "Mobile Banking App"], academicScore: 88, skillsScore: 82, softSkillsScore: 76,
      roadmapProgress: 55, badges: ["Innovation Award"], avatar: "MO",
    },
    // HR / Companies
    {
      id: "h1", email: "hr@aramco.com", passwordHash: simpleHash("Company@123"), role: "hr",
      name: "Nasser Al-Ghamdi", company: "Saudi Aramco", position: "HR Manager", industry: "Energy", avatar: "NG",
    },
    {
      id: "h2", email: "talent@stc.com.sa", passwordHash: simpleHash("Company@123"), role: "hr",
      name: "Huda Al-Salem", company: "STC", position: "Talent Acquisition Lead", industry: "Telecom", avatar: "HS",
    },
    {
      id: "h3", email: "recruit@sabic.com", passwordHash: simpleHash("Company@123"), role: "hr",
      name: "Turki Al-Rashidi", company: "SABIC", position: "Recruitment Lead", industry: "Petrochemicals", avatar: "TR",
    },
    {
      id: "h4", email: "hr@neom.com", passwordHash: simpleHash("Company@123"), role: "hr",
      name: "Layla Al-Anazi", company: "NEOM", position: "HR Specialist", industry: "Technology", avatar: "LA",
    },
    {
      id: "h5", email: "jobs@riyadbank.com", passwordHash: simpleHash("Company@123"), role: "hr",
      name: "Faisal Al-Dossary", company: "Riyad Bank", position: "HR Officer", industry: "Banking", avatar: "FD",
    },
    // Admin
    {
      id: "a1", email: "admin@hireqimah.com", passwordHash: simpleHash("Admin@2026"), role: "admin",
      name: "Platform Admin", avatar: "PA",
    },
    // University Admins
    {
      id: "u1", email: "admin@ksu.edu.sa", passwordHash: simpleHash("Uni@2026"), role: "university",
      name: "Dr. Ahmad Al-Shehri", universityName: "King Saud University", officialDomain: "ksu.edu.sa", adminContact: "+966-11-467-0000", avatar: "AS",
    },
    {
      id: "u2", email: "admin@kau.edu.sa", passwordHash: simpleHash("Uni@2026"), role: "university",
      name: "Dr. Fatimah Al-Zahrani", universityName: "King Abdulaziz University", officialDomain: "kau.edu.sa", adminContact: "+966-12-695-0000", avatar: "FZ",
    },
  ];
}

// Initialize store
function initStore() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(getDefaultUsers()));
  }
}

// User CRUD
export function getAllUsers(): StoredUser[] {
  initStore();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
}

export function getUserByEmail(email: string): StoredUser | undefined {
  return getAllUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function getUserById(id: string): StoredUser | undefined {
  return getAllUsers().find(u => u.id === id);
}

export function getStudents(): StoredUser[] {
  return getAllUsers().filter(u => u.role === "student");
}

export function updateUser(id: string, updates: Partial<StoredUser>) {
  const users = getAllUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }
}

export function registerUser(data: Omit<StoredUser, "id" | "passwordHash" | "createdAt"> & { password: string }): { success: boolean; error?: string } {
  const { password, ...rest } = data;
  if (getUserByEmail(rest.email)) return { success: false, error: "Email already registered." };

  // Input validation
  if (password.length < 8) return { success: false, error: "Password must be at least 8 characters." };
  if (!/[A-Z]/.test(password)) return { success: false, error: "Password must include an uppercase letter." };
  if (!/[0-9]/.test(password)) return { success: false, error: "Password must include a number." };
  if (!/[^A-Za-z0-9]/.test(password)) return { success: false, error: "Password must include a special character." };

  const users = getAllUsers();
  const newUser: StoredUser = {
    ...rest,
    id: generateId(),
    passwordHash: simpleHash(password),
    createdAt: new Date().toISOString(),
    // Defaults for students
    ...(rest.role === "student" ? {
      academicScore: 0, skillsScore: 0, softSkillsScore: 0,
      roadmapProgress: 0, badges: [], certifications: [], projects: [],
      transcriptUploaded: false, transcriptVerified: false,
    } : {}),
  };
  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  addActivityLog(`New ${rest.role} registered: ${rest.email}`);
  return { success: true };
}

// Rate Limiting
function getRateLimits(): Record<string, RateLimit> {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.RATE_LIMITS) || "{}");
}

function setRateLimits(limits: Record<string, RateLimit>) {
  localStorage.setItem(STORAGE_KEYS.RATE_LIMITS, JSON.stringify(limits));
}

function checkRateLimit(email: string): { allowed: boolean; remainingAttempts: number; lockedUntil?: number } {
  const limits = getRateLimits();
  const limit = limits[email.toLowerCase()];
  if (!limit) return { allowed: true, remainingAttempts: MAX_ATTEMPTS };

  if (limit.lockedUntil && Date.now() < limit.lockedUntil) {
    return { allowed: false, remainingAttempts: 0, lockedUntil: limit.lockedUntil };
  }

  // Reset if lockout expired
  if (limit.lockedUntil && Date.now() >= limit.lockedUntil) {
    delete limits[email.toLowerCase()];
    setRateLimits(limits);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  return { allowed: limit.attempts < MAX_ATTEMPTS, remainingAttempts: MAX_ATTEMPTS - limit.attempts };
}

function recordAttempt(email: string, success: boolean) {
  const limits = getRateLimits();
  const key = email.toLowerCase();
  if (success) {
    delete limits[key];
  } else {
    const current = limits[key] || { attempts: 0, lastAttempt: 0 };
    current.attempts += 1;
    current.lastAttempt = Date.now();
    if (current.attempts >= MAX_ATTEMPTS) {
      current.lockedUntil = Date.now() + LOCKOUT_DURATION;
    }
    limits[key] = current;
  }
  setRateLimits(limits);
}

// Login
export function login(email: string, password: string): { success: boolean; error?: string; user?: StoredUser } {
  // Sanitize inputs
  email = email.trim().toLowerCase();
  if (!email || !password) return { success: false, error: "Please fill in all fields." };
  if (email.length > 255 || password.length > 128) return { success: false, error: "Invalid input." };

  const rateCheck = checkRateLimit(email);
  if (!rateCheck.allowed) {
    const remaining = rateCheck.lockedUntil ? Math.ceil((rateCheck.lockedUntil - Date.now()) / 1000) : 0;
    return { success: false, error: `Too many attempts. Try again in ${remaining}s.` };
  }

  const user = getUserByEmail(email);
  if (!user) {
    recordAttempt(email, false);
    // Generic message to prevent user enumeration
    return { success: false, error: `Invalid credentials. ${rateCheck.remainingAttempts - 1} attempts remaining.` };
  }

  if (user.disabled) {
    return { success: false, error: "This account has been disabled. Contact admin." };
  }

  if (!verifyHash(password, user.passwordHash)) {
    recordAttempt(email, false);
    return { success: false, error: `Invalid credentials. ${rateCheck.remainingAttempts - 1} attempts remaining.` };
  }

  recordAttempt(email, true);

  // Create session
  const session: Session = {
    userId: user.id,
    role: user.role,
    loginAt: Date.now(),
    expiresAt: Date.now() + SESSION_TIMEOUT,
    csrfToken: generateCSRF(),
  };
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  addActivityLog(`Login: ${user.email} (${user.role})`);

  return { success: true, user };
}

// Session
export function getSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!raw) return null;
  const session: Session = JSON.parse(raw);
  if (Date.now() > session.expiresAt) {
    logout();
    return null;
  }
  return session;
}

export function refreshSession() {
  const session = getSession();
  if (session) {
    session.expiresAt = Date.now() + SESSION_TIMEOUT;
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  }
}

export function getCurrentUser(): StoredUser | null {
  const session = getSession();
  if (!session) return null;
  return getUserById(session.userId) || null;
}

export function logout() {
  const user = getCurrentUser();
  if (user) addActivityLog(`Logout: ${user.email}`);
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

// ERS Calculation
export function calculateERS(user: StoredUser): number {
  const academic = user.academicScore || 0;
  const skills = user.skillsScore || 0;
  const soft = user.softSkillsScore || 0;
  return Math.round((0.5 * academic) + (0.3 * skills) + (0.2 * soft));
}

// Activity Log
export function addActivityLog(message: string) {
  const logs: { message: string; time: string }[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG) || "[]");
  logs.unshift({ message, time: new Date().toISOString() });
  if (logs.length > 100) logs.length = 100;
  localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(logs));
}

export function getActivityLog(): { message: string; time: string }[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG) || "[]");
}

// File validation
export function validateFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
  const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg"];
  const maxSize = 5 * 1024 * 1024; // 5MB

  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return { valid: false, error: "Only PDF, PNG, and JPEG files are allowed." };
  }
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Invalid file type. Only PDF, PNG, and JPEG are allowed." };
  }
  if (file.size > maxSize) {
    return { valid: false, error: "File size exceeds 5 MB limit." };
  }
  return { valid: true };
}

// Sanitize input (XSS prevention)
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

// Universities list
export const UNIVERSITIES = [
  "King Saud University",
  "King Abdulaziz University",
  "KFUPM",
  "Princess Nourah University",
  "Imam Mohammad Ibn Saud University",
];

export const MAJORS = [
  "Cybersecurity",
  "Software Engineering",
  "Data Science",
  "Artificial Intelligence",
  "Mechanical Engineering",
  "Marketing",
  "Electrical Engineering",
  "Business Administration",
];
