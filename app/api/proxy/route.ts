import { NextRequest } from 'next/server';
import httpProxyMiddleware from 'next-http-proxy-middleware';

export async function OPTIONS(request: NextRequest) {
  return httpProxyMiddleware(request, {
    target: 'http://192.168.20.16:8080',
    changeOrigin: true,
  });
}