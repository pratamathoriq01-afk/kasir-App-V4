import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function jsonWithCors(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("AddOn")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.warn("Supabase AddOn GET error:", error);
      return jsonWithCors([], 200);
    }

    return jsonWithCors(data || []);
  } catch (error) {
    console.error("AddOns API GET error:", error);
    return jsonWithCors([], 200);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = {
      id: body.id || `addon-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: body.name,
      price: Number(body.price || 0),
      hpp: Number(body.hpp || 0),
      category: body.category || "Semua",
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("AddOn")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.error("Supabase AddOn POST error:", error);
      return jsonWithCors({ error: "Gagal menyimpan Add-On", details: error }, 400);
    }

    return jsonWithCors(data, 201);
  } catch (error) {
    console.error("AddOn POST error:", error);
    return jsonWithCors({ error: "Gagal membuat Add-On" }, 500);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return jsonWithCors({ error: "ID Add-On diperlukan" }, 400);
    }

    const { data, error } = await supabase
      .from("AddOn")
      .update({
        name: body.name,
        price: Number(body.price || 0),
        hpp: Number(body.hpp || 0),
        category: body.category || "Semua",
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      return jsonWithCors({ error: "Gagal update Add-On", details: error }, 400);
    }

    return jsonWithCors(data);
  } catch (error) {
    console.error("AddOn PUT error:", error);
    return jsonWithCors({ error: "Gagal update Add-On" }, 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return jsonWithCors({ error: "ID Add-On diperlukan" }, 400);
    }

    const { error } = await supabase.from("AddOn").delete().eq("id", id);
    if (error) {
      return jsonWithCors({ error: "Gagal menghapus Add-On", details: error }, 400);
    }

    return jsonWithCors({ success: true });
  } catch (error) {
    console.error("AddOn DELETE error:", error);
    return jsonWithCors({ error: "Gagal menghapus Add-On" }, 500);
  }
}
