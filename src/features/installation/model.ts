import { openDB, type DBSchema } from 'idb'

export type InstallationStatus =
  | 'not-installed'
  | 'draft'
  | 'configured'
  | 'ready'
  | 'error'

export type LinuxDistribution = 'buildroot' | 'debian' | 'ubuntu'
export type DiskLayout = 'guided' | 'manual'
export type NetworkMode = 'dhcp' | 'static'

export interface InstallationProfile {
  schemaVersion: 1
  installationId: string
  status: InstallationStatus
  imageProfile: 'core' | 'embedded'
  distribution: LinuxDistribution
  diskLayout: DiskLayout
  diskSizeMiB: number
  rootSizeMiB: number
  swapSizeMiB: number
  networkMode: NetworkMode
  ipv4Address: string
  gateway: string
  dnsServers: string
  username: string
  hostname: string
  timezone: string
  createdAt: string
  updatedAt: string
  runtimeVersion: string | null
  imageId: string | null
  errorMessage: string | null
}

export interface StoredSnapshot {
  id: 'current'
  schemaVersion: 2
  v86Version: string
  imageId: string
  memorySize: number
  runtimeFingerprint: string
  createdAt: string
  state: ArrayBuffer
}

interface KernelLabDb extends DBSchema {
  settings: {
    key: string
    value: InstallationProfile
  }
  snapshots: {
    key: string
    value: StoredSnapshot
  }
  progress: {
    key: string
    value: { lessonId: string; completed: boolean; updatedAt: string }
  }
}

const INSTALLATION_KEY = 'installation'
const INSTALLATION_EVENT = 'kernel-lab-installation-change'

function db() {
  return openDB<KernelLabDb>('kernel-lab', 1, {
    upgrade(database) {
      database.createObjectStore('settings')
      database.createObjectStore('snapshots', { keyPath: 'id' })
      database.createObjectStore('progress', { keyPath: 'lessonId' })
    },
  })
}

export function createInstallationDraft(): InstallationProfile {
  const now = new Date().toISOString()
  return {
    schemaVersion: 1,
    installationId: crypto.randomUUID(),
    status: 'draft',
    imageProfile: 'core',
    distribution: 'buildroot',
    diskLayout: 'guided',
    diskSizeMiB: 1024,
    rootSizeMiB: 832,
    swapSizeMiB: 128,
    networkMode: 'dhcp',
    ipv4Address: '192.168.1.100/24',
    gateway: '192.168.1.1',
    dnsServers: '1.1.1.1, 8.8.8.8',
    username: 'student',
    hostname: 'kernel-lab',
    timezone: 'Asia/Shanghai',
    createdAt: now,
    updatedAt: now,
    runtimeVersion: null,
    imageId: null,
    errorMessage: null,
  }
}

export async function readInstallation() {
  const stored = await (await db()).get('settings', INSTALLATION_KEY)
  if (!stored) return undefined
  return normalizeInstallationProfile(stored)
}

export async function writeInstallation(profile: InstallationProfile) {
  const value = {
    ...normalizeInstallationProfile(profile),
    updatedAt: new Date().toISOString(),
  }
  await (await db()).put('settings', value, INSTALLATION_KEY)
  window.dispatchEvent(new CustomEvent(INSTALLATION_EVENT, { detail: value }))
  return value
}

function normalizeInstallationProfile(
  profile: Partial<InstallationProfile> &
    Pick<InstallationProfile, 'installationId' | 'createdAt' | 'updatedAt'>,
): InstallationProfile {
  return {
    schemaVersion: 1,
    installationId: profile.installationId,
    status: profile.status ?? 'draft',
    imageProfile: profile.imageProfile ?? 'core',
    distribution: profile.distribution ?? 'buildroot',
    diskLayout: profile.diskLayout ?? 'guided',
    diskSizeMiB: profile.diskSizeMiB ?? 1024,
    rootSizeMiB: profile.rootSizeMiB ?? 832,
    swapSizeMiB: profile.swapSizeMiB ?? 128,
    networkMode: profile.networkMode ?? 'dhcp',
    ipv4Address: profile.ipv4Address ?? '192.168.1.100/24',
    gateway: profile.gateway ?? '192.168.1.1',
    dnsServers: profile.dnsServers ?? '1.1.1.1, 8.8.8.8',
    username: profile.username ?? 'student',
    hostname: profile.hostname ?? 'kernel-lab',
    timezone: profile.timezone ?? 'Asia/Shanghai',
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    runtimeVersion: profile.runtimeVersion ?? null,
    imageId: profile.imageId ?? null,
    errorMessage: profile.errorMessage ?? null,
  }
}

export async function removeInstallation() {
  const database = await db()
  const transaction = database.transaction(
    ['settings', 'snapshots', 'progress'],
    'readwrite',
  )
  await Promise.all([
    transaction.objectStore('settings').clear(),
    transaction.objectStore('snapshots').clear(),
    transaction.objectStore('progress').clear(),
    transaction.done,
  ])
  window.dispatchEvent(new CustomEvent(INSTALLATION_EVENT))
}

export async function saveSnapshot(snapshot: StoredSnapshot) {
  await (await db()).put('snapshots', snapshot)
}

export async function readSnapshot() {
  return (await db()).get('snapshots', 'current')
}

export async function removeSnapshot() {
  await (await db()).delete('snapshots', 'current')
}

export function onInstallationChange(listener: () => void) {
  window.addEventListener(INSTALLATION_EVENT, listener)
  return () => window.removeEventListener(INSTALLATION_EVENT, listener)
}
