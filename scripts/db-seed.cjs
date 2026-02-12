"use strict";
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const ENTER_CD = "SSMS";
const CHKID = "seed";

const initialEnvKeys = new Set(Object.keys(process.env));

function loadEnvFile(filePath, options = { overrideLoaded: false }) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex < 1) {
      continue;
    }
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (initialEnvKeys.has(key)) {
      continue;
    }
    if (!options.overrideLoaded && process.env[key] !== undefined) {
      continue;
    }
    process.env[key] = value;
  }
}

function loadLocalEnv() {
  const cwd = process.cwd();
  loadEnvFile(path.join(cwd, ".env"));
  loadEnvFile(path.join(cwd, ".env.local"), { overrideLoaded: true });
}

function resolveDatabaseUrl() {
  const direct = process.env.DATABASE_URL;
  if (direct && direct.trim()) {
    return direct.trim();
  }

  const jdbc = process.env.DB_URL;
  if (jdbc && jdbc.startsWith("jdbc:postgresql://")) {
    const url = new URL(jdbc.replace(/^jdbc:/, ""));
    if (process.env.DB_USERNAME) {
      url.username = process.env.DB_USERNAME;
    }
    if (process.env.DB_PASSWORD) {
      url.password = process.env.DB_PASSWORD;
    }
    return url.toString();
  }

  return "postgresql://ssms:ssms@localhost:55432/ssms";
}

function nowIso() {
  return new Date().toISOString();
}

function ymdNow() {
  return new Date().toISOString().slice(0, 10).replaceAll("-", "");
}

async function seedUsers(client) {
  const passwordHash = await bcrypt.hash("admin", 10);
  const rows = [
    {
      enterCd: ENTER_CD,
      sabun: "admin",
      password: passwordHash,
      name: "관리자",
      orgCd: "SSMS",
      orgNm: "SSMS",
      mailId: "admin@ssms.local",
      jikweeNm: "관리자",
      useYn: "Y",
      handPhone: "010-0000-0000",
      note: "초기 관리자 계정",
      roleCd: "admin",
      chkid: CHKID,
      chkdate: nowIso(),
    },
    {
      enterCd: ENTER_CD,
      sabun: "mgr001",
      password: passwordHash,
      name: "담당자1",
      orgCd: "SSMS",
      orgNm: "운영",
      mailId: "mgr001@ssms.local",
      jikweeNm: "매니저",
      useYn: "Y",
      handPhone: "010-1111-1111",
      note: "초기 운영 담당자",
      roleCd: "manager",
      chkid: CHKID,
      chkdate: nowIso(),
    },
    {
      enterCd: ENTER_CD,
      sabun: "dev001",
      password: passwordHash,
      name: "개발자1",
      orgCd: "SSMS",
      orgNm: "추가개발",
      mailId: "dev001@ssms.local",
      jikweeNm: "개발자",
      useYn: "Y",
      handPhone: "010-2222-2222",
      note: "초기 개발자",
      roleCd: "user",
      chkid: CHKID,
      chkdate: nowIso(),
    },
  ];

  for (const row of rows) {
    await client.query(
      `
        insert into tsys305_new
          (enter_cd, sabun, password, name, org_cd, org_nm, mail_id, jikwee_nm, use_yn, hand_phone, note, role_cd, refresh_token, chkid, chkdate)
        values
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, null, $13, $14)
        on conflict (enter_cd, sabun) do update
        set
          name = excluded.name,
          org_cd = excluded.org_cd,
          org_nm = excluded.org_nm,
          mail_id = excluded.mail_id,
          jikwee_nm = excluded.jikwee_nm,
          use_yn = excluded.use_yn,
          hand_phone = excluded.hand_phone,
          note = excluded.note,
          role_cd = excluded.role_cd,
          chkid = excluded.chkid,
          chkdate = excluded.chkdate
      `,
      [
        row.enterCd,
        row.sabun,
        row.password,
        row.name,
        row.orgCd,
        row.orgNm,
        row.mailId,
        row.jikweeNm,
        row.useYn,
        row.handPhone,
        row.note,
        row.roleCd,
        row.chkid,
        row.chkdate,
      ],
    );
  }
}

async function seedMenus(client) {
  await client.query("delete from quick_menu where enter_cd = $1", [ENTER_CD]);
  await client.query("delete from tsys301_new where enter_cd = $1", [ENTER_CD]);

  const rows = [
    [ENTER_CD, 1, null, "SSMS", null, null, 1, "Y"],
    [ENTER_CD, 100, 1, "운영", null, "pi pi-fw pi-user", 107, "Y"],
    [ENTER_CD, 101, 100, "고객사관리", "/ssms/pages/manage/Company.vue", "pi pi-fw pi-building", 101, "Y"],
    [ENTER_CD, 102, 100, "고객사방문관리", "/ssms/pages/manage/CompanyVisit.vue", null, 104, "N"],
    [ENTER_CD, 103, 100, "HR담당자현황", "/ssms/pages/manage/HrManager.vue", "pi pi-fw pi-users", 110, "Y"],
    [ENTER_CD, 104, 100, "인프라구성관리", "/ssms/pages/manage/InfraManagement.vue", "pi pi-fw pi-folder", 113, "Y"],
    [ENTER_CD, 105, 100, "유지보수통계", "/ssms/pages/manage/ManagerStatus.vue", null, 116, "N"],
    [ENTER_CD, 106, 100, "월간레포트관리", "/ssms/pages/manage/MonthlyReport.vue", null, 119, "N"],
    [ENTER_CD, 107, 100, "외주인력계약관리", "/ssms/pages/manage/OutManage.vue", "pi pi-fw pi-list-check", 122, "Y"],
    [ENTER_CD, 109, 100, "외주인력일정관리", "/ssms/pages/manage/Attendance.vue", "pi pi-fw pi-calendar", 123, "Y"],
    [ENTER_CD, 110, 100, "외주인력근태관리", "/ssms/pages/manage/OutManageTime.vue", "pi pi-fw pi-book", 124, "Y"],
    [ENTER_CD, 200, 1, "추가개발", null, "pi pi-fw pi-plus-circle", 200, "Y"],
    [ENTER_CD, 201, 200, "추가개발관리", "/ssms/pages/develop/DevelopManagement.vue", "pi pi-fw pi-folder", 201, "Y"],
    [ENTER_CD, 202, 200, "추가개발인력관리", "/ssms/pages/develop/DevelopStaff.vue", "pi pi-fw pi-book", 204, "Y"],
    [ENTER_CD, 203, 200, "추가개발프로젝트관리", "/ssms/pages/develop/DevelopProject.vue", "pi pi-fw pi-chart-pie", 207, "Y"],
    [ENTER_CD, 204, 200, "추가개발문의관리", "/ssms/pages/develop/DevelopInquiry.vue", "pi pi-fw pi-info", 210, "Y"],
    [ENTER_CD, 300, 1, "공통", null, "pi pi-fw pi-database", 300, "Y"],
    [ENTER_CD, 301, 300, "일일업무", "/ssms/pages/common/DailyTask.vue", null, 301, "N"],
    [ENTER_CD, 302, 300, "토론방", "/ssms/pages/common/Discussion.vue", null, 302, "N"],
    [ENTER_CD, 900, 1, "시스템", null, "pi pi-fw pi-spin pi-cog", 900, "Y"],
    [ENTER_CD, 901, 900, "사용자관리", "/ssms/pages/system/User.vue", "pi pi-fw pi-address-book", 901, "Y"],
    [ENTER_CD, 902, 900, "메뉴관리", "/ssms/pages/system/Menu.vue", "pi pi-fw pi-server", 910, "Y"],
    [ENTER_CD, 903, 900, "조직관리", "/ssms/pages/system/Org.vue", null, 920, "N"],
    [ENTER_CD, 904, 900, "로그관리", "/ssms/pages/system/Log.vue", null, 930, "N"],
    [ENTER_CD, 905, 900, "사용자승인", "/ssms/pages/system/UserApproval.vue", null, 902, "N"],
    [ENTER_CD, 906, 900, "공통코드관리", "/ssms/pages/system/Code.vue", "pi pi-fw pi-code", 903, "Y"],
  ];

  for (const row of rows) {
    await client.query(
      `
        insert into tsys301_new
          (enter_cd, menu_id, parent_menu_id, menu_label, menu_path, menu_icon, seq, use_yn, chkid, chkdate)
        values
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        on conflict (enter_cd, menu_id) do update
        set
          parent_menu_id = excluded.parent_menu_id,
          menu_label = excluded.menu_label,
          menu_path = excluded.menu_path,
          menu_icon = excluded.menu_icon,
          seq = excluded.seq,
          use_yn = excluded.use_yn,
          chkid = excluded.chkid,
          chkdate = excluded.chkdate
      `,
      [...row, CHKID, nowIso()],
    );
  }
}

async function seedCodes(client) {
  const rows = [
    [ENTER_CD, "ROLE", "admin", "관리자", "Admin", 1, "Y"],
    [ENTER_CD, "ROLE", "manager", "매니저", "Manager", 2, "Y"],
    [ENTER_CD, "ROLE", "user", "사용자", "User", 3, "Y"],
    [ENTER_CD, "GNT_CD", "10", "반차(오전)", "Half Day AM", 1, "Y"],
    [ENTER_CD, "GNT_CD", "20", "반차(오후)", "Half Day PM", 2, "Y"],
    [ENTER_CD, "GNT_CD", "30", "종일", "Full Day", 3, "Y"],
    [ENTER_CD, "STATUS_CD", "10", "요청", "Requested", 1, "Y"],
    [ENTER_CD, "STATUS_CD", "20", "승인", "Approved", 2, "Y"],
    [ENTER_CD, "STATUS_CD", "30", "반려", "Rejected", 3, "Y"],
    [ENTER_CD, "DEV_STATUS", "10", "요청", "Requested", 1, "Y"],
    [ENTER_CD, "DEV_STATUS", "20", "요청보류", "On Hold (Requested)", 2, "Y"],
    [ENTER_CD, "DEV_STATUS", "30", "정의", "Defined", 3, "Y"],
    [ENTER_CD, "DEV_STATUS", "40", "정의보류", "On Hold (Defined)", 4, "Y"],
    [ENTER_CD, "DEV_STATUS", "50", "진행중", "In Progress", 5, "Y"],
    [ENTER_CD, "DEV_STATUS", "60", "진행보류", "On Hold (Progress)", 6, "Y"],
    [ENTER_CD, "DEV_STATUS", "70", "검수중", "In QA", 7, "Y"],
    [ENTER_CD, "DEV_STATUS", "80", "검수보류", "On Hold (QA)", 8, "Y"],
    [ENTER_CD, "DEV_STATUS", "90", "대기", "Ready", 9, "Y"],
    [ENTER_CD, "DEV_STATUS", "100", "완료", "Done", 10, "Y"],
  ];

  for (const row of rows) {
    await client.query(
      `
        insert into tsys005_new
          (enter_cd, grcode_cd, code, code_nm, code_eng_nm, seq, use_yn, note1, note2, note3, note4, num_note, chkdate, chkid, erp_code)
        values
          ($1, $2, $3, $4, $5, $6, $7, null, null, null, null, null, $8, $9, null)
        on conflict (enter_cd, grcode_cd, code) do update
        set
          code_nm = excluded.code_nm,
          code_eng_nm = excluded.code_eng_nm,
          seq = excluded.seq,
          use_yn = excluded.use_yn,
          chkdate = excluded.chkdate,
          chkid = excluded.chkid
      `,
      [...row, nowIso(), CHKID],
    );
  }
}

async function seedCompanies(client) {
  const rows = [
    [
      ENTER_CD,
      "CMP001",
      "샘플고객사",
      "GRP01",
      "A",
      "Y",
      "샘플그룹",
      "20250101",
      "SW",
      "06234",
      "서울",
      "https://ssms.local/cmp001",
    ],
    [
      ENTER_CD,
      "CMP002",
      "글로벌파트너",
      "GRP01",
      "B",
      "Y",
      "글로벌그룹",
      "20250201",
      "CONSULT",
      "04510",
      "부산",
      "https://ssms.local/cmp002",
    ],
  ];

  for (const row of rows) {
    await client.query(
      `
        insert into tmst001_new
          (enter_cd, company_cd, company_nm, company_grp_cd, object_div, manage_div, represent_company, sdate, induty_cd, zip, address, homepage, chkid, chkdate)
        values
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        on conflict (enter_cd, company_cd) do update
        set
          company_nm = excluded.company_nm,
          company_grp_cd = excluded.company_grp_cd,
          object_div = excluded.object_div,
          manage_div = excluded.manage_div,
          represent_company = excluded.represent_company,
          sdate = excluded.sdate,
          induty_cd = excluded.induty_cd,
          zip = excluded.zip,
          address = excluded.address,
          homepage = excluded.homepage,
          chkid = excluded.chkid,
          chkdate = excluded.chkdate
      `,
      [...row, CHKID, nowIso()],
    );
  }
}

async function seedManagerMappings(client) {
  const rows = [
    [ENTER_CD, "admin", "CMP001", "20250101", "20991231", "초기 관리자 매핑"],
    [ENTER_CD, "mgr001", "CMP002", "20250201", "20991231", "초기 담당자 매핑"],
  ];

  for (const row of rows) {
    await client.query(
      `
        insert into manager_company_mapping
          (enter_cd, sabun, company_cd, sdate, edate, note, chkid, chkdate)
        select
          $1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::varchar, $6::varchar, $7::varchar, $8::timestamptz
        where not exists (
          select 1
          from manager_company_mapping
          where
            enter_cd = $1::varchar and
            sabun = $2::varchar and
            company_cd = $3::varchar
        )
      `,
      [...row, CHKID, nowIso()],
    );
  }
}

async function seedAttendance(client) {
  const today = ymdNow();
  const rows = [
    [ENTER_CD, "admin", today, today, "30", "20", "초기 근태 데이터(관리자)", today],
    [ENTER_CD, "mgr001", today, today, "10", "10", "초기 근태 데이터(담당자)", today],
  ];

  for (const row of rows) {
    await client.query(
      `
        insert into attendance
          (enter_cd, sabun, sdate, edate, gnt_cd, status_cd, note, apply_date, chkid, chkdate)
        select
          $1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::varchar, $6::varchar, $7::varchar, $8::varchar, $9::varchar, $10::timestamptz
        where not exists (
          select 1
          from attendance
          where
            enter_cd = $1::varchar and
            sabun = $2::varchar and
            sdate = $3::varchar and
            edate = $4::varchar and
            coalesce(gnt_cd, '') = coalesce($5::varchar, '') and
            coalesce(status_cd, '') = coalesce($6::varchar, '')
        )
      `,
      [...row, CHKID, nowIso()],
    );
  }
}

async function seedOutManage(client) {
  const rows = [
    [ENTER_CD, "mgr001", "20250101", "20261231", 24, 2, "초기 외주 계약 데이터"],
    [ENTER_CD, "dev001", "20250101", "20261231", 18, 1, "초기 외주 계약 데이터(개발자)"],
  ];

  for (const row of rows) {
    await client.query(
      `
        insert into out_manage
          (enter_cd, sabun, sdate, edate, tot_cnt, svc_cnt, note, chkid, chkdate)
        values
          ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        on conflict (enter_cd, sabun, sdate) do update
        set
          edate = excluded.edate,
          tot_cnt = excluded.tot_cnt,
          svc_cnt = excluded.svc_cnt,
          note = excluded.note,
          chkid = excluded.chkid,
          chkdate = excluded.chkdate
      `,
      [...row, CHKID, nowIso()],
    );
  }
}

async function seedOutManageTime(client) {
  const rows = [
    [ENTER_CD, "mgr001", "10", ymdNow(), "20", ymdNow(), ymdNow(), 0.5, "초기 반차 승인 데이터"],
    [ENTER_CD, "dev001", "20", ymdNow(), "10", ymdNow(), ymdNow(), 0.5, "초기 반차 신청 데이터"],
  ];

  for (const row of rows) {
    await client.query(
      `
        insert into out_manage_time
          (enter_cd, sabun, gnt_cd, apply_date, status_cd, sdate, edate, apply_cnt, note, chkid, chkdate)
        select
          $1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::varchar, $6::varchar, $7::varchar, $8::numeric, $9::varchar, $10::varchar, $11::timestamptz
        where not exists (
          select 1
          from out_manage_time
          where
            enter_cd = $1::varchar and
            sabun = $2::varchar and
            coalesce(gnt_cd, '') = coalesce($3::varchar, '') and
            coalesce(apply_date, '') = coalesce($4::varchar, '') and
            coalesce(status_cd, '') = coalesce($5::varchar, '') and
            sdate = $6::varchar and
            edate = $7::varchar
        )
      `,
      [...row, CHKID, nowIso()],
    );
  }
}

async function seedInfra(client) {
  const masters = [
    [ENTER_CD, "10", "CMP001", "1"],
    [ENTER_CD, "10", "CMP001", "2"],
    [ENTER_CD, "20", "CMP002", "1"],
  ];

  for (const row of masters) {
    await client.query(
      `
        insert into infra_master
          (enter_cd, task_gubun_cd, company_cd, dev_gb_cd, chkid, chkdate)
        select
          $1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::varchar, $6::timestamptz
        where not exists (
          select 1
          from infra_master
          where
            enter_cd = $1::varchar and
            task_gubun_cd = $2::varchar and
            company_cd = $3::varchar and
            dev_gb_cd = $4::varchar
        )
      `,
      [...row, CHKID, nowIso()],
    );
  }

  const sections = [
    [ENTER_CD, "10", "CMP001", "1", "overview", 1, "개요", "TEXT", "summary", "1", "개발 환경 개요"],
    [ENTER_CD, "10", "CMP001", "1", "checklist", 2, "체크리스트", "TABLE", "items", "2", "접속/DB/API 점검 항목"],
    [ENTER_CD, "10", "CMP001", "2", "overview", 1, "개요", "TEXT", "summary", "1", "운영 환경 개요"],
  ];

  for (const row of sections) {
    await client.query(
      `
        insert into infra_section
          (enter_cd, task_gubun_cd, company_cd, dev_gb_cd, section_id, seq, title, type, column_nm, column_seq, contents, chkid, chkdate)
        select
          $1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::varchar, $6::bigint, $7::varchar, $8::varchar, $9::varchar, $10::varchar, $11::text, $12::varchar, $13::timestamptz
        where not exists (
          select 1
          from infra_section
          where
            enter_cd = $1::varchar and
            task_gubun_cd = $2::varchar and
            company_cd = $3::varchar and
            dev_gb_cd = $4::varchar and
            coalesce(section_id, '') = coalesce($5::varchar, '') and
            coalesce(seq, -1) = coalesce($6::bigint, -1) and
            coalesce(column_nm, '') = coalesce($9::varchar, '')
        )
      `,
      [...row, CHKID, nowIso()],
    );
  }
}

async function seedDevelop(client) {
  const inquiries = [
    [ENTER_CD, "CMP001", "급여 기능 개선 요청", "20260315", 1.5, "김영업", "이PM", "10", "N", "급여 v2", "초기 문의 데이터"],
    [ENTER_CD, "CMP002", "채용 대시보드 개편 요청", "20260401", 2.0, "박영업", "최PM", "20", "N", "채용 UI", "초기 문의 데이터"],
  ];

  for (const row of inquiries) {
    await client.query(
      `
        insert into develop_inquiry
          (enter_cd, request_company_cd, in_content, proceed_hope_dt, est_real_mm, sales_nm, charge_nm, in_proceed_code, confirm_yn, project_nm, remark, chkid, chkdate)
        select
          $1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::numeric, $6::varchar, $7::varchar, $8::varchar, $9::varchar, $10::varchar, $11::varchar, $12::varchar, $13::timestamptz
        where not exists (
          select 1
          from develop_inquiry
          where
            enter_cd = $1::varchar and
            request_company_cd = $2::varchar and
            in_content = $3::varchar and
            coalesce(project_nm, '') = coalesce($10::varchar, '')
        )
      `,
      [...row, CHKID, nowIso()],
    );
  }

  const projects = [
    [
      ENTER_CD,
      "HR 코어 고도화",
      "CMP001",
      "10",
      "2 FE, 2 BE",
      "202601",
      "202612",
      "20260110",
      "20261220",
      "Y",
      "Y",
      10.5,
      120000000,
      "초기 프로젝트 데이터",
      null,
    ],
    [
      ENTER_CD,
      "채용 모바일 개선",
      "CMP002",
      "20",
      "1 FE, 1 BE",
      "202602",
      "202609",
      "20260215",
      "20260930",
      "N",
      "Y",
      6.0,
      70000000,
      "초기 프로젝트 데이터",
      null,
    ],
  ];

  for (const row of projects) {
    await client.query(
      `
        insert into develop_project
          (enter_cd, project_nm, request_company_cd, part_cd, input_man_power, contract_std_dt, contract_end_dt, develop_std_dt, develop_end_dt, inspection_yn, tax_bill_yn, real_mm, contract_price, remark, file_seq, chkid, chkdate)
        select
          $1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::varchar, $6::varchar, $7::varchar, $8::varchar, $9::varchar, $10::varchar, $11::varchar, $12::numeric, $13::numeric, $14::varchar, $15::bigint, $16::varchar, $17::timestamptz
        where not exists (
          select 1
          from develop_project
          where enter_cd = $1::varchar and project_nm = $2::varchar
        )
      `,
      [...row, CHKID, nowIso()],
    );
  }

  const managementRows = [
    [
      ENTER_CD,
      "CMP001",
      "202602",
      1,
      "50",
      "급여 API 리팩터링",
      "급여 도메인 API 구조 개선",
      "mgr001",
      "dev001",
      "N",
      "Y",
      "계약 범위 포함",
      "Y",
      "202602",
      "202606",
      2.5,
      3.0,
      "초기 관리 데이터",
      "10",
      "20260201",
      "20260630",
    ],
    [
      ENTER_CD,
      "CMP002",
      "202602",
      1,
      "30",
      "채용 포털 기획",
      "포털 요구사항 정의",
      "mgr001",
      "dev001",
      "Y",
      "N",
      "견적 협의중",
      "N",
      "202602",
      "202605",
      1.0,
      1.5,
      "초기 관리 데이터",
      "20",
      "20260210",
      "20260531",
    ],
  ];

  for (const row of managementRows) {
    await client.query(
      `
        insert into develop_management
          (enter_cd, request_company_cd, request_ym, request_seq, status_cd, request_nm, request_content, manager_sabun, developer_sabun, outside_yn, paid_yn, paid_content, tax_bill_yn, start_ym, end_ym, paid_mm, real_mm, content, part_cd, sdate, edate, chkid, chkdate)
        values
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        on conflict (enter_cd, request_company_cd, request_ym, request_seq) do update
        set
          status_cd = excluded.status_cd,
          request_nm = excluded.request_nm,
          request_content = excluded.request_content,
          manager_sabun = excluded.manager_sabun,
          developer_sabun = excluded.developer_sabun,
          outside_yn = excluded.outside_yn,
          paid_yn = excluded.paid_yn,
          paid_content = excluded.paid_content,
          tax_bill_yn = excluded.tax_bill_yn,
          start_ym = excluded.start_ym,
          end_ym = excluded.end_ym,
          paid_mm = excluded.paid_mm,
          real_mm = excluded.real_mm,
          content = excluded.content,
          part_cd = excluded.part_cd,
          sdate = excluded.sdate,
          edate = excluded.edate,
          chkid = excluded.chkid,
          chkdate = excluded.chkdate
      `,
      [...row, CHKID, nowIso()],
    );
  }
}

async function seedQuickAndLog(client) {
  const quickRows = [
    [ENTER_CD, "admin", 1, 1],
    [ENTER_CD, "admin", 901, 2],
    [ENTER_CD, "admin", 101, 3],
    [ENTER_CD, "admin", 201, 4],
  ];

  for (const row of quickRows) {
    await client.query(
      `
        insert into quick_menu
          (enter_cd, sabun, menu_id, seq, chkid, chkdate)
        values
          ($1, $2, $3, $4, $5, $6)
        on conflict (enter_cd, sabun, menu_id) do update
        set
          seq = excluded.seq,
          chkid = excluded.chkid,
          chkdate = excluded.chkdate
      `,
      [...row, CHKID, nowIso()],
    );
  }

  await client.query(
    `
      insert into system_log
        (sabun, action_type, request_url, ip_address, success_yn, error_message, created_at)
      select
        'admin', 'SEED', '/scripts/db-seed', '127.0.0.1', 'Y', null, now()
      where not exists (
        select 1
        from system_log
        where action_type = 'SEED'
          and request_url = '/scripts/db-seed'
          and created_at::date = current_date
      )
    `,
  );
}

async function readTableCounts(client) {
  const tables = [
    "tsys305_new",
    "tsys301_new",
    "tsys005_new",
    "tmst001_new",
    "manager_company_mapping",
    "attendance",
    "out_manage",
    "out_manage_time",
    "infra_master",
    "infra_section",
    "develop_inquiry",
    "develop_project",
    "develop_management",
    "quick_menu",
    "system_log",
  ];

  const counts = {};
  for (const table of tables) {
    const result = await client.query(`select count(*)::int as count from ${table}`);
    counts[table] = result.rows[0]?.count ?? 0;
  }
  return counts;
}

async function main() {
  loadLocalEnv();
  const databaseUrl = resolveDatabaseUrl();
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 2,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  const client = await pool.connect();
  try {
    await client.query("begin");

    await seedUsers(client);
    await seedMenus(client);
    await seedCodes(client);
    await seedCompanies(client);
    await seedManagerMappings(client);
    await seedAttendance(client);
    await seedOutManage(client);
    await seedOutManageTime(client);
    await seedInfra(client);
    await seedDevelop(client);
    await seedQuickAndLog(client);

    const counts = await readTableCounts(client);
    await client.query("commit");

    console.log("Seed completed.");
    console.log(`Database: ${databaseUrl}`);
    for (const [table, count] of Object.entries(counts)) {
      console.log(`${table}: ${count}`);
    }
    console.log("Default login: enterCd=SSMS, sabun=admin, password=admin");
  } catch (error) {
    await client.query("rollback");
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

void main();
