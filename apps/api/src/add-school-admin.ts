import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { hashPassword } from "./auth.js";
import { readHidden } from "./prompts.js";

loadEnv({ path: resolve(process.cwd(), "../../.env") });
const { prisma } = await import("@greenfield/database");

async function main(): Promise<void> {
  const prompts = createInterface({ input: process.stdin, output: process.stdout });
  let schoolName: string;
  let schoolSlug: string;
  let campusName: string;
  let campusSlug: string;
  let email: string;
  try {
    schoolName = (await prompts.question("New school name: ")).trim();
    schoolSlug = (await prompts.question("School ID (lowercase letters, numbers, hyphens): "))
      .trim()
      .toLowerCase();
    campusName = (await prompts.question("First campus name: ")).trim();
    campusSlug = (await prompts.question("Campus ID (lowercase letters, numbers, hyphens): "))
      .trim()
      .toLowerCase();
    email = (await prompts.question("School administrator email: ")).trim().toLowerCase();
  } finally {
    prompts.close();
  }

  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!schoolName || !campusName || !slugPattern.test(schoolSlug) || !slugPattern.test(campusSlug)) {
    throw new Error("Enter school and campus names with valid IDs.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid administrator email address.");
  }
  if (await prisma.school.findUnique({ where: { slug: schoolSlug } })) {
    throw new Error("That school ID is already in use.");
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  let passwordHash: string | undefined;
  if (!existingUser) {
    const password = await readHidden("Administrator password (minimum 12 characters): ");
    const confirmation = await readHidden("Confirm password: ");
    if (password.length < 12 || password.length > 1024) {
      throw new Error("The password must be between 12 and 1024 characters.");
    }
    if (password !== confirmation) throw new Error("The passwords do not match.");
    passwordHash = await hashPassword(password);
  }

  await prisma.$transaction(async (transaction) => {
    const school = await transaction.school.create({
      data: { name: schoolName, slug: schoolSlug },
    });
    const campus = await transaction.campus.create({
      data: { schoolId: school.id, name: campusName, slug: campusSlug },
    });
    const user = existingUser
      ? await transaction.user.findUniqueOrThrow({ where: { id: existingUser.id } })
      : await transaction.user.create({ data: { email, passwordHash: passwordHash! } });
    await transaction.campusMembership.create({
      data: { campusId: campus.id, userId: user.id, role: "SCHOOL_ADMIN" },
    });
    await transaction.roleAssignment.create({
      data: { userId: user.id, roleKey: "SCHOOL_ADMIN", scopeType: "CAMPUS", scopeId: campus.id },
    });
  });

  console.log(
    existingUser
      ? `Created ${schoolName} and its first campus; the existing account is its administrator.`
      : `Created ${schoolName}, its first campus, and its first administrator.`,
  );
}

try {
  if (process.argv.includes("--check")) {
    const schoolCount = await prisma.school.count();
    console.log(`School setup is available. Current school count: ${schoolCount}.`);
  } else {
    await main();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "School setup failed.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
