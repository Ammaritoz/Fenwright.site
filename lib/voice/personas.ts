import { personas, type Persona } from "@/config/personas";

export function getPersona(id: string): Persona | null {
  return personas.find((p) => p.id === id) ?? null;
}

export function requirePersona(id: string): Persona {
  const persona = getPersona(id);
  if (!persona) throw new Error(`Unknown persona: ${id}`);
  return persona;
}

export const personaIds = personas.map((p) => p.id) as [string, ...string[]];
