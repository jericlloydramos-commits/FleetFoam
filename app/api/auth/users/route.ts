import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Shared server-side user registry for cross-browser, cross-profile evaluation
const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'registered_users.json');

interface StoredUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  createdAt?: string;
}

// Initial seed accounts from database and evaluation roster
const INITIAL_USERS: StoredUser[] = [
  { id: 'usr-earl-1', email: 'earlstephensenoran@gmail.com', password: 'password123', name: 'Earlstephen Señoran (Frontend)', role: 'OPERATIONS' },
  { id: 'usr-earl-2', email: 'e@gmail.com', password: 'password123', name: 'EARLSTEPHEN SEÑORAN', role: 'CUSTOMER' },
  { id: 'usr-earl-3', email: 'earl@fleetfoam.com', password: 'password123', name: 'Earlstephen Señoran (Frontend)', role: 'OPERATIONS' },
  { id: 'usr-marriane', email: 'marriane@fleetfoam.com', password: 'password123', name: 'Marriane Angel Samson (Project Manager)', role: 'OPERATIONS' },
  { id: 'usr-michael', email: 'michael@fleetfoam.com', password: 'password123', name: 'Michael Sapinoso (Backend/Database)', role: 'OPERATIONS' },
  { id: 'usr-jeric', email: 'jeric@fleetfoam.com', password: 'password123', name: 'Jeric Ramos (QA/DevOps Lead)', role: 'OPERATIONS' },
  { id: 'usr-ops', email: 'ops@fleetfoam.com', password: 'password123', name: 'Sarah Jenkins (Ops Admin)', role: 'OPERATIONS' },
  { id: 'usr-admin', email: 'admin@fleetfoam.com', password: 'password123', name: 'System Administrator', role: 'OPERATIONS' },
  { id: 'usr-crew', email: 'crew@fleetfoam.com', password: 'password123', name: 'Marcus Vance (Lead Detailing Tech)', role: 'CREW' },
  { id: 'usr-customer', email: 'customer@fleetfoam.com', password: 'password123', name: 'Brooke Sterling (VIP Fleet Customer)', role: 'CUSTOMER' },
  { id: 'usr-jaylord', email: 'jaylord@gmail.com', password: 'password123', name: 'Jaylord', role: 'CREW' },
  { id: 'usr-romer', email: 'romer@gmail.com', password: 'password123', name: 'Romer DelaCruz', role: 'CUSTOMER' },
  { id: 'usr-amil', email: 'amil@gmail.com', password: 'password123', name: 'Carl Amil', role: 'CREW' },
  { id: 'usr-algones', email: 'algones@gmail.com', password: 'password123', name: 'Mark Algones', role: 'CUSTOMER' },
  { id: 'usr-grape', email: 'grape@gmail.com', password: 'password123', name: 'Grape', role: 'CREW' },
  { id: 'usr-delacruz', email: 'delacruz@gmail.com', password: 'password123', name: 'Dela Cruz', role: 'CREW' },
];

function ensureDataFile(): StoredUser[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(INITIAL_USERS, null, 2), 'utf-8');
      return INITIAL_USERS;
    }
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(INITIAL_USERS, null, 2), 'utf-8');
      return INITIAL_USERS;
    }
    // Ensure all INITIAL_USERS exist in file
    let updated = false;
    for (const initU of INITIAL_USERS) {
      if (!parsed.some((u: StoredUser) => u.email.toLowerCase() === initU.email.toLowerCase())) {
        parsed.push(initU);
        updated = true;
      }
    }
    if (updated) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch {
    return INITIAL_USERS;
  }
}

function saveUsers(users: StoredUser[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save shared users to file:', err);
  }
}

// GET /api/auth/users — Return all registered accounts across tabs/profiles
export async function GET() {
  const users = ensureDataFile();
  return NextResponse.json({ users });
}

// POST /api/auth/users — Register a new account or update credentials across tabs/profiles
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, password, name, role } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const users = ensureDataFile();

    const existingIndex = users.findIndex(
      (u) => u.email.toLowerCase() === normalizedEmail
    );

    const updatedUser: StoredUser = {
      id: id || (existingIndex >= 0 ? users[existingIndex].id : 'usr-' + Date.now()),
      email: normalizedEmail,
      password: password,
      name: name?.trim() || (existingIndex >= 0 ? users[existingIndex].name : normalizedEmail.split('@')[0]),
      role: role || (existingIndex >= 0 ? users[existingIndex].role : 'CUSTOMER'),
      createdAt: existingIndex >= 0 ? users[existingIndex].createdAt : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      // Update password & name if changed
      users[existingIndex] = { ...users[existingIndex], ...updatedUser };
    } else {
      users.push(updatedUser);
    }

    saveUsers(users);
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
