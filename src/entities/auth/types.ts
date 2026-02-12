export type LoginRequest = {
  enterCd: string;
  sabun: string;
  password: string;
};

export type LoginResponse = {
  statusCode?: string;
  message?: string;
};

export type UserInfo = {
  enterCd: string;
  sabun: string;
  name: string;
  roleCd?: string;
  orgCd?: string;
  orgNm?: string;
  mailId?: string;
  jikweeNm?: string;
  useYn?: string;
  handPhone?: string;
  note?: string;
};
