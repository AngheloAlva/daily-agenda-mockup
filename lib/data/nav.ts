import {
  RiHome5Line,
  RiMessage3Line,
  RiFileList3Line,
  RiCheckboxCircleLine,
  RiCalendarLine,
  RiBookOpenLine,
  RiUserSmileLine,
  RiPushpinLine,
  type RemixiconComponentType,
} from "@remixicon/react";

export type NavItem = {
  title: string;
  href: string;
  icon: RemixiconComponentType;
};

export const navItems: NavItem[] = [
  { title: "Inicio", href: "/dashboard", icon: RiHome5Line },
  { title: "Mensajes", href: "/dashboard/mensajes", icon: RiMessage3Line },
  { title: "Informes", href: "/dashboard/informes", icon: RiFileList3Line },
  { title: "Asistencia", href: "/dashboard/asistencia", icon: RiCheckboxCircleLine },
  { title: "Calendario", href: "/dashboard/calendario", icon: RiCalendarLine },
  { title: "Planificación", href: "/dashboard/planificacion", icon: RiBookOpenLine },
  { title: "Párvulos", href: "/dashboard/parvulos", icon: RiUserSmileLine },
  { title: "Mural", href: "/dashboard/mural", icon: RiPushpinLine },
];
