export interface User {
  id: number;
  uuid: string;
  username: string;
  email: string;
  openid: string;
  avatar: string;
  address: string;
  signature: string;
  register: number;
  freeze: boolean;
}