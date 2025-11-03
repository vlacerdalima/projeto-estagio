// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill para TextEncoder/Decoder (necessário para Next.js)
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill para Request e Response usando whatwg-fetch ou fetch global
if (typeof globalThis.Request === 'undefined') {
  // Se não existe, criar uma implementação simples
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input?.url || ''
      this.method = init.method || 'GET'
      this.headers = new Headers(init.headers)
      this._init = init
    }
  }

  global.Response = class Response {
    constructor(body, init = {}) {
      this._body = body
      this.status = init.status || 200
      this.statusText = init.statusText || 'OK'
      this.headers = new Headers(init.headers)
      this.ok = this.status >= 200 && this.status < 300
    }

    async json() {
      if (typeof this._body === 'string') {
        return JSON.parse(this._body)
      }
      return this._body
    }

    static json(data, init = {}) {
      const body = JSON.stringify(data)
      return new Response(body, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init.headers,
        },
      })
    }
  }
}


