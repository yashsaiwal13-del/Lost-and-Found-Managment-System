import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import { ItemType, ItemStatus, UserRole } from '@prisma/client';
import { MOCK_ITEMS } from '@/data/mockData';

export interface StoredItem {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'LOST' | 'FOUND';
  location: string;
  date: string;
  time?: string | null;
  image?: string | null;
  status: 'REPORTED' | 'OPEN' | 'PENDING_CLAIM' | 'RESOLVED' | 'REJECTED';
  storageLocation?: string | null;
  additionalDetails?: string | null;
  reportedById: string;
  reportedByName?: string;
  reportedByEmail?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_FILE = path.join(process.cwd(), 'prisma', 'data-store.json');

// Initialize data file with collegiate mock items if not present
function loadLocalStore(): StoredItem[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('Could not read local data-store.json, creating initial store:', err);
  }

  // Seed default collegiate items
  const initialItems: StoredItem[] = MOCK_ITEMS.map((item, idx) => ({
    id: item.id || `CF-10${idx + 1}`,
    name: item.title,
    description: item.description,
    category: item.category,
    type: (item.type?.toUpperCase() === 'LOST' ? 'LOST' : 'FOUND') as 'LOST' | 'FOUND',
    location: item.location,
    date: (item as any).dateFound || item.date || new Date().toISOString(),
    time: null,
    image: item.imageUrl || null,
    status: (item.status === 'resolved' ? 'RESOLVED' : item.status === 'pending_verification' ? 'PENDING_CLAIM' : 'OPEN') as any,
    storageLocation: item.storageLocation || 'Campus Security Central Locker',
    additionalDetails: null,
    reportedById: 'demo-maya-lin',
    reportedByName: 'Maya Lin',
    reportedByEmail: 'maya.lin@campus.edu',
    createdAt: new Date(Date.now() - (idx + 1) * 3600000 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialItems, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write initial data-store.json:', err);
  }

  return initialItems;
}

function writeLocalStore(items: StoredItem[]) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to data-store.json:', err);
  }
}

/**
 * Permanently save a report to PostgreSQL via Prisma,
 * with seamless fallback to local disk storage when database server is offline.
 */
export async function saveItem(data: {
  name: string;
  description: string;
  category: string;
  type: 'LOST' | 'FOUND';
  location: string;
  date: string | Date;
  time?: string | null;
  image?: string | null;
  storageLocation?: string | null;
  additionalDetails?: string | null;
  reportedById?: string;
  reportedByName?: string;
  reportedByEmail?: string;
}): Promise<{ item: StoredItem; isPostgres: boolean }> {
  const dateObj = data.date instanceof Date ? data.date : new Date(data.date);
  const safeDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
  const itemType = data.type === 'LOST' ? ItemType.LOST : ItemType.FOUND;

  // 1. Attempt PostgreSQL via Prisma
  try {
    let studentId = data.reportedById;
    let studentUser = null;

    if (studentId) {
      studentUser = await prisma.user.findUnique({ where: { id: studentId } });
    }

    if (!studentUser) {
      studentUser = await prisma.user.findFirst({
        where: { role: UserRole.STUDENT },
      });
    }

    if (!studentUser) {
      studentUser = await prisma.user.upsert({
        where: { email: data.reportedByEmail || 'maya.lin@campus.edu' },
        update: {},
        create: {
          name: data.reportedByName || 'Student Reporter',
          email: data.reportedByEmail || 'maya.lin@campus.edu',
          studentId: 'STU-88291',
          role: UserRole.STUDENT,
        },
      });
    }

    const created = await prisma.item.create({
      data: {
        name: data.name.trim(),
        description: data.description.trim(),
        category: data.category.trim(),
        type: itemType,
        status: ItemStatus.REPORTED,
        location: data.location.trim(),
        date: safeDate,
        time: data.time?.trim() || null,
        image: data.image || null,
        storageLocation: data.storageLocation?.trim() || null,
        additionalDetails: data.additionalDetails?.trim() || null,
        reportedById: studentUser.id,
      },
      include: {
        reportedBy: true,
      },
    });

    const storedItem: StoredItem = {
      id: created.id,
      name: created.name,
      description: created.description,
      category: created.category,
      type: created.type as any,
      location: created.location,
      date: created.date.toISOString(),
      time: created.time,
      image: created.image,
      status: created.status as any,
      storageLocation: created.storageLocation,
      additionalDetails: created.additionalDetails,
      reportedById: created.reportedById,
      reportedByName: created.reportedBy.name,
      reportedByEmail: created.reportedBy.email,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };

    // Also mirror to local disk backup
    const localItems = loadLocalStore();
    localItems.unshift(storedItem);
    writeLocalStore(localItems);

    return { item: storedItem, isPostgres: true };
  } catch (err: any) {
    console.warn('PostgreSQL offline on localhost:5432. Saving permanently to local data-store.json:', err?.message || err);

    // 2. Resilient Permanent Local Storage
    const localItems = loadLocalStore();
    const newId = `CF-${data.type === 'LOST' ? 'LOST' : 'FOUND'}-${Date.now().toString().slice(-4)}`;

    const newItem: StoredItem = {
      id: newId,
      name: data.name.trim(),
      description: data.description.trim(),
      category: data.category.trim(),
      type: data.type,
      location: data.location.trim(),
      date: safeDate.toISOString(),
      time: data.time?.trim() || null,
      image: data.image || null,
      status: 'REPORTED',
      storageLocation: data.storageLocation?.trim() || (data.type === 'FOUND' ? 'Campus Safety Desk' : null),
      additionalDetails: data.additionalDetails?.trim() || null,
      reportedById: data.reportedById || 'demo-maya-lin',
      reportedByName: data.reportedByName || 'Student Reporter',
      reportedByEmail: data.reportedByEmail || 'maya.lin@campus.edu',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localItems.unshift(newItem);
    writeLocalStore(localItems);

    return { item: newItem, isPostgres: false };
  }
}

/**
 * Fetch items with optional type, category, and search filters
 */
export async function getItems(filters?: {
  type?: 'LOST' | 'FOUND';
  category?: string;
  search?: string;
  limit?: number;
}): Promise<StoredItem[]> {
  try {
    const where: any = {};
    if (filters?.type) {
      where.type = filters.type === 'LOST' ? ItemType.LOST : ItemType.FOUND;
    }
    if (filters?.category && filters.category !== 'All Categories') {
      where.category = filters.category;
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.item.findMany({
      where,
      include: { reportedBy: true },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
    });

    if (items && items.length > 0) {
      return items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        category: i.category,
        type: i.type as any,
        location: i.location,
        date: i.date.toISOString(),
        time: i.time,
        image: i.image,
        status: i.status as any,
        storageLocation: i.storageLocation,
        additionalDetails: i.additionalDetails,
        reportedById: i.reportedById,
        reportedByName: i.reportedBy.name,
        reportedByEmail: i.reportedBy.email,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      }));
    }
  } catch (err) {
    // Graceful fallback to local store
  }

  // Fallback to local disk store
  let localItems = loadLocalStore();

  if (filters?.type) {
    localItems = localItems.filter((i) => i.type.toUpperCase() === filters.type);
  }
  if (filters?.category && filters.category !== 'All Categories') {
    localItems = localItems.filter((i) => i.category.toLowerCase() === filters.category!.toLowerCase());
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    localItems = localItems.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
    );
  }

  if (filters?.limit) {
    localItems = localItems.slice(0, filters.limit);
  }

  return localItems;
}

/**
 * Fetch a single item by ID
 */
export async function getItemById(id: string): Promise<StoredItem | null> {
  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: { reportedBy: true },
    });

    if (item) {
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        type: item.type as any,
        location: item.location,
        date: item.date.toISOString(),
        time: item.time,
        image: item.image,
        status: item.status as any,
        storageLocation: item.storageLocation,
        additionalDetails: item.additionalDetails,
        reportedById: item.reportedById,
        reportedByName: item.reportedBy.name,
        reportedByEmail: item.reportedBy.email,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };
    }
  } catch (err) {
    // Database offline fallback
  }

  const localItems = loadLocalStore();
  const match = localItems.find((i) => i.id === id);
  return match || null;
}

/**
 * Fetch all reports submitted by a specific user (or demo user)
 */
export async function getUserReports(identifier?: {
  userId?: string;
  email?: string;
}): Promise<StoredItem[]> {
  try {
    const where: any = {};
    if (identifier?.userId) {
      where.reportedById = identifier.userId;
    } else if (identifier?.email) {
      where.reportedBy = { email: identifier.email };
    }

    const items = await prisma.item.findMany({
      where,
      include: { reportedBy: true },
      orderBy: { createdAt: 'desc' },
    });

    if (items && items.length > 0) {
      return items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        category: i.category,
        type: i.type as any,
        location: i.location,
        date: i.date.toISOString(),
        time: i.time,
        image: i.image,
        status: i.status as any,
        storageLocation: i.storageLocation,
        additionalDetails: i.additionalDetails,
        reportedById: i.reportedById,
        reportedByName: i.reportedBy.name,
        reportedByEmail: i.reportedBy.email,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      }));
    }
  } catch (err) {
    // Fallback to local store
  }

  const localItems = loadLocalStore();
  if (identifier?.userId || identifier?.email) {
    const matched = localItems.filter(
      (i) =>
        (identifier.userId && i.reportedById === identifier.userId) ||
        (identifier.email && i.reportedByEmail?.toLowerCase() === identifier.email.toLowerCase())
    );
    if (matched.length > 0) return matched;
  }

  // Return all student reports from local store as default
  return localItems;
}

/**
 * Update an item's status
 */
export async function updateItemStatus(
  id: string,
  status: 'REPORTED' | 'OPEN' | 'PENDING_CLAIM' | 'RESOLVED' | 'REJECTED'
): Promise<StoredItem | null> {
  try {
    const updated = await prisma.item.update({
      where: { id },
      data: { status: status as any },
      include: { reportedBy: true },
    });

    if (updated) {
      const storedItem: StoredItem = {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        category: updated.category,
        type: updated.type as any,
        location: updated.location,
        date: updated.date.toISOString(),
        time: updated.time,
        image: updated.image,
        status: updated.status as any,
        storageLocation: updated.storageLocation,
        additionalDetails: updated.additionalDetails,
        reportedById: updated.reportedById,
        reportedByName: updated.reportedBy.name,
        reportedByEmail: updated.reportedBy.email,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };

      const localItems = loadLocalStore();
      const idx = localItems.findIndex((i) => i.id === id);
      if (idx !== -1) {
        localItems[idx].status = status;
        writeLocalStore(localItems);
      }

      return storedItem;
    }
  } catch (err) {
    // Local store update
  }

  const localItems = loadLocalStore();
  const item = localItems.find((i) => i.id === id);
  if (item) {
    item.status = status;
    item.updatedAt = new Date().toISOString();
    writeLocalStore(localItems);
    return item;
  }

  return null;
}
