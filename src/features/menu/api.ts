import type { MenuNode, NavigationMenuItem } from "@/entities/menu/types";
import { request } from "@/shared/api/http";

const normalizeLegacyPath = (menuPath?: string): string => {
  if (!menuPath) {
    return "/dashboard";
  }

  const withoutExtension = menuPath.replace(/\.vue$/i, "").trim();
  if (withoutExtension === "" || withoutExtension === "/") {
    return "/dashboard";
  }

  const normalized = `/${withoutExtension.replace(/^\/+/, "")}`;
  if (normalized.toLowerCase() === "/dashboard") {
    return "/dashboard";
  }

  const mappedRoutes: Record<string, string> = {
    "/ssms/pages/system/menu": "/system/menu",
    "/ssms/pages/system/user": "/system/user",
    "/ssms/pages/system/code": "/system/code",
    "/ssms/pages/system/quickmenu": "/system/quick-menu",
    "/ssms/pages/system/log": "/system/log",
    "/ssms/pages/system/org": "/legacy/ssms/pages/system/Org",
    "/ssms/pages/system/userapproval": "/legacy/ssms/pages/system/UserApproval",
    "/ssms/pages/manage/inframanagement": "/manage/infra-management",
    "/ssms/pages/manage/attendance": "/manage/attendance",
    "/ssms/pages/manage/company": "/manage/company",
    "/ssms/pages/manage/companyvisit": "/legacy/ssms/pages/manage/CompanyVisit",
    "/ssms/pages/manage/managerstatus": "/manage/manager-status",
    "/ssms/pages/manage/hrmanager": "/manage/manager-status",
    "/ssms/pages/manage/monthlyreport": "/legacy/ssms/pages/manage/MonthlyReport",
    "/ssms/pages/manage/preaction": "/legacy/ssms/pages/manage/PreAction",
    "/ssms/pages/manage/outmanage": "/manage/out-manage",
    "/ssms/pages/manage/outmanagetime": "/manage/out-manage-time",
    "/ssms/pages/common/dailytask": "/legacy/ssms/pages/common/DailyTask",
    "/ssms/pages/common/discussion": "/legacy/ssms/pages/common/Discussion",
    "/ssms/pages/develop/developinquiry": "/develop/inquiry",
    "/ssms/pages/develop/developproject": "/develop/project",
    "/ssms/pages/develop/developstaff": "/develop/staff",
    "/ssms/pages/develop/developmanagement": "/develop/management",
  };

  const mapped = mappedRoutes[normalized.toLowerCase()];
  if (mapped) {
    return mapped;
  }

  return `/legacy${normalized}`;
};

const mapNode = (node: MenuNode, index: number): NavigationMenuItem => {
  const id = String(node.menuId ?? `${node.menuLabel}-${index}`);
  const children = (node.items ?? []).map((child, childIndex) => mapNode(child, childIndex));

  return {
    id,
    label: node.menuLabel || "제목없음",
    href: normalizeLegacyPath(node.menuPath),
    icon: node.menuIcon,
    items: children,
  };
};

export const menuApi = {
  getTree: () => request<MenuNode[]>("/menu/tree"),
  toNavigation: (nodes: MenuNode[]): NavigationMenuItem[] => nodes.map((node, index) => mapNode(node, index)),
};
