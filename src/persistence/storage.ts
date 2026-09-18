import { NetworkProject } from '../network-model/types';
import { NetworkProjectSchema } from '../network-model/schema';

const STORAGE_KEY = 'nic_saved_topology_v1';

export function saveProjectToStorage(project: NetworkProject): boolean {
  try {
    const serialized = JSON.stringify(project);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (err) {
    console.error('Failed to save topology to localStorage:', err);
    return false;
  }
}

export function loadProjectFromStorage(): NetworkProject | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const validated = NetworkProjectSchema.safeParse(parsed);
    if (!validated.success) {
      console.warn('Saved project failed schema validation:', validated.error);
      return null;
    }
    return validated.data as NetworkProject;
  } catch (err) {
    console.error('Failed to load topology from localStorage:', err);
    return null;
  }
}

export function clearProjectStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear project storage:', err);
  }
}
