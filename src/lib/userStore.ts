export interface StoredUser {
  id: string;
  name: string;
  email: string;
  studentId?: string | null;
  phone?: string | null;
  password?: string;
  role: 'STUDENT' | 'SECURITY' | 'ADMIN';
  createdAt: Date;
}

// Global cached store to persist across Next.js Turbopack HMR reloads
declare global {
  var __campusfind_users: Map<string, StoredUser> | undefined;
}

function getUserStore(): Map<string, StoredUser> {
  if (!global.__campusfind_users) {
    global.__campusfind_users = new Map<string, StoredUser>();

    // Seed default collegiate accounts
    const initialUsers: StoredUser[] = [
      {
        id: 'demo-maya-lin',
        name: 'Maya Lin',
        email: 'maya.lin@campus.edu',
        studentId: 'STU-88291',
        phone: '(555) 349-2810',
        password: 'password123',
        role: 'STUDENT',
        createdAt: new Date(),
      },
      {
        id: 'demo-officer-vance',
        name: 'Officer Vance',
        email: 'vance.security@campus.edu',
        studentId: 'SEC-402',
        phone: '(555) 019-2834',
        password: 'password123',
        role: 'SECURITY',
        createdAt: new Date(),
      },
      {
        id: 'demo-security-alias',
        name: 'Officer Vance',
        email: 'security@campus.edu',
        studentId: 'SEC-402',
        phone: '(555) 019-2834',
        password: 'password123',
        role: 'SECURITY',
        createdAt: new Date(),
      },
      {
        id: 'demo-admin',
        name: 'Campus Administrator',
        email: 'admin@campus.edu',
        studentId: 'ADM-001',
        phone: '(555) 999-0000',
        password: 'password123',
        role: 'ADMIN',
        createdAt: new Date(),
      },
    ];

    for (const u of initialUsers) {
      global.__campusfind_users.set(u.email.toLowerCase(), u);
    }
  }
  return global.__campusfind_users;
}

export function saveFallbackUser(user: StoredUser): StoredUser {
  const store = getUserStore();
  store.set(user.email.toLowerCase(), user);
  return user;
}

export function findUserByEmail(email: string): StoredUser | undefined {
  const store = getUserStore();
  return store.get(email.toLowerCase().trim());
}

export function findUserByStudentId(studentId: string): StoredUser | undefined {
  const store = getUserStore();
  for (const u of store.values()) {
    if (u.studentId && u.studentId.toUpperCase() === studentId.toUpperCase().trim()) {
      return u;
    }
  }
  return undefined;
}
