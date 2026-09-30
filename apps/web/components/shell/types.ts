import type { NavGroup } from "../../lib/navigation";

export type ShellUser = {
  name: string;
  email: string;
  initials: string;
  roleLabel: string;
};

export type ShellProps = {
  campusId: string;
  campusName: string;
  schoolName: string;
  user: ShellUser;
  navigation: NavGroup[];
};