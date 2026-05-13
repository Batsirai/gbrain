import type { Operation } from '../core/operations.ts';

export interface McpToolDef {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

export function buildToolDefs(ops: Operation[]): McpToolDef[] {
  return ops.map(op => {
    for (const [k, v] of Object.entries(op.params)) {
      if (v.type === 'array' && !v.items) {
        throw new Error(
          `buildToolDefs: ${op.name} parameter "${k}" is type "array" but missing items; OpenAI-compatible APIs require JSON Schema "items" for array tool parameters.`,
        );
      }
    }
    return {
      name: op.name,
      description: op.description,
      inputSchema: {
        type: 'object' as const,
        properties: Object.fromEntries(
          Object.entries(op.params).map(([k, v]) => [k, {
            type: v.type === 'array' ? 'array' : v.type,
            ...(v.description ? { description: v.description } : {}),
            ...(v.enum ? { enum: v.enum } : {}),
            ...(v.items ? { items: { type: v.items.type } } : {}),
          }]),
        ),
        required: Object.entries(op.params)
          .filter(([, v]) => v.required)
          .map(([k]) => k),
      },
    };
  });
}
