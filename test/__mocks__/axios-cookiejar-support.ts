// axios-cookiejar-support is ESM-only and cannot be loaded by jest (CommonJS).
// Unit tests mock all HTTP traffic, so the cookie wrapper is not needed here.
export const wrapper = (instance: any) => instance
