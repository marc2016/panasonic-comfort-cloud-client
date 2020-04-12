export class LoginData {
  loginId: string
  password: string
  language?: number

  constructor(loginId: string, password: string, language?: number) {
    this.loginId = loginId
    this.password = password
    this.language = language
  }
}
