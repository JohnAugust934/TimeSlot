import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

function getRequiredEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (!value || value.trim().length === 0) {
    throw new Error(`Environment variable ${name} is required for seed execution.`);
  }

  return value;
}

async function main() {
  const name = getRequiredEnv('SEED_ADMIN_NAME', 'Administrador Local');
  const email = getRequiredEnv('SEED_ADMIN_EMAIL', 'admin@timeslot.local');
  const password = getRequiredEnv('SEED_ADMIN_PASSWORD', 'Admin@123456');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: UserRole.ADMIN,
      active: true,
    },
    create: {
      name,
      email,
      passwordHash,
      role: UserRole.ADMIN,
      active: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
    },
  });

  console.log('Seed concluido com sucesso.');
  console.log({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
  });
}

main()
  .catch((error) => {
    console.error('Erro ao executar seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
