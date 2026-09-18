import { z } from 'zod';

export const DevicePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const DeviceInstanceSchema = z.object({
  id: z.string().min(1, 'Device ID must not be empty'),
  deviceTypeId: z.string().min(1, 'Device Type ID must not be empty'),
  name: z.string().min(1, 'Device name must not be empty'),
  position: DevicePositionSchema,
});

export const LinkEndpointSchema = z.object({
  deviceId: z.string().min(1, 'Endpoint device ID must not be empty'),
  interfaceId: z.string().min(1, 'Endpoint interface ID must not be empty'),
});

export const NetworkLinkSchema = z.object({
  id: z.string().min(1, 'Link ID must not be empty'),
  endpointA: LinkEndpointSchema,
  endpointB: LinkEndpointSchema,
  cableTypeId: z.string().min(1).optional().default('ethernet-copper'),
});

export const NetworkProjectSchema = z.object({
  schemaVersion: z.literal(1),
  name: z.string().min(1, 'Project name must not be empty'),
  devices: z.array(DeviceInstanceSchema),
  links: z.array(NetworkLinkSchema),
});

export type NetworkProjectInput = z.infer<typeof NetworkProjectSchema>;
