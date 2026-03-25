import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Informe um e-mail valido.'),
  password: z.string().min(6, 'Informe uma senha com pelo menos 6 caracteres.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
