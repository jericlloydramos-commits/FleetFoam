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

// Initial canonical 3-role demonstration accounts
const INITIAL_USERS: StoredUser[] = [
  {
    id: 'c6666666-6666-6666-6666-666666666666',
    email: 'admin@fleetfoam.com',
    password: 'password123',
    name: 'Earlstephen (Operations Lead)',
    role: 'OPERATIONS',
  },
  {
    id: 'fbf9ee78-d157-4541-a153-00a9fcaca1b8',
    email: 'crew@fleetfoam.com',
    password: 'password123',
    name: 'Marcus Vance (Crew Specialist)',
    role: 'CREW',
  },
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    email: 'customer@fleetfoam.com',
    password: 'password123',
    name: 'Alex Mercer (Customer)',
    role: 'CUSTOMER',
  },
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
