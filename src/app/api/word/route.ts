import { NextResponse } from "next/server";
import { words } from "@/data/words";

export async function GET() {
  // const randomIndex = Math.floor(Math.random() * words.length);
  // const word = words[randomIndex];
  // fetch localhost:8000
  const response = await fetch('https://localhost:8000/api/word');
  const data = await response.json();
  console.log("Cesar was here...")
  return NextResponse.json({ data });
}
