import { z } from "zod";

export const userFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(60, "El nombre no debe superar 60 caracteres."),
  username: z
    .string()
    .trim()
    .min(3, "El alias debe tener al menos 3 caracteres.")
    .max(30, "El alias no debe superar 30 caracteres.")
    .regex(/^[a-z0-9._]+$/i, "Usa solo letras, numeros, puntos o guiones bajos."),
  email: z
    .string()
    .trim()
    .email("Ingresa un correo valido.")
    .max(80, "El correo no debe superar 80 caracteres."),
  city: z
    .string()
    .trim()
    .min(3, "La ciudad debe tener al menos 3 caracteres.")
    .max(60, "La ciudad no debe superar 60 caracteres."),
});

export const plantFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre comun debe tener al menos 2 caracteres.")
    .max(50, "El nombre comun no debe superar 50 caracteres."),
  scientificName: z
    .string()
    .trim()
    .min(4, "El nombre botanico debe tener al menos 4 caracteres.")
    .max(80, "El nombre botanico no debe superar 80 caracteres."),
  locationName: z
    .string()
    .trim()
    .min(3, "La ubicacion debe tener al menos 3 caracteres.")
    .max(50, "La ubicacion no debe superar 50 caracteres."),
  wateringFrequencyLabel: z
    .string()
    .trim()
    .min(5, "Indica una frecuencia de riego valida.")
    .max(40, "La frecuencia de riego no debe superar 40 caracteres."),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
export type PlantFormValues = z.infer<typeof plantFormSchema>;
