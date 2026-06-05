import { NextResponse } from "next/server";

export function successResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status: number, code?: string) {
  return NextResponse.json({ error: true, message, code }, { status });
}
