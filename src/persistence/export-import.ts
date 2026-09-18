import { NetworkProject } from '../network-model/types';
import { NetworkProjectSchema } from '../network-model/schema';

export function exportProjectToJSON(project: NetworkProject, filename = 'network-topology.json'): void {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function parseAndValidateProjectJSON(jsonString: string): {
  success: boolean;
  project?: NetworkProject;
  error?: string;
} {
  try {
    const raw = JSON.parse(jsonString);
    const result = NetworkProjectSchema.safeParse(raw);
    if (!result.success) {
      const errorMsg = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return {
        success: false,
        error: `Schema validation failed: ${errorMsg}`,
      };
    }
    return {
      success: true,
      project: result.data as NetworkProject,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid JSON format';
    return {
      success: false,
      error: `Failed to parse JSON: ${message}`,
    };
  }
}
