import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { INITIAL_MENU_ITEMS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // 1. Primary: Direct Supabase REST Client
    const { data, error } = await supabase
      .from("MenuItem")
      .select("*")
      .order("createdAt", { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return NextResponse.json(data, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      });
    }

    // 2. Secondary: Prisma Database Query
    const prismaClient = prisma as any;
    if (prismaClient && prismaClient.menuItem) {
      const items = await prismaClient.menuItem.findMany({
        orderBy: { createdAt: "asc" },
      });
      if (items && items.length > 0) {
        return NextResponse.json(items, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store, max-age=0, must-revalidate",
          },
        });
      }
    }

    // 3. Fallback to Initial Menu
    return NextResponse.json(INITIAL_MENU_ITEMS, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (err) {
    console.warn("Menu fetch error, returning fallback:", err);
    return NextResponse.json(INITIAL_MENU_ITEMS, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body.id || `menu-${Date.now()}`;
    const payload = {
      id,
      name: body.name,
      category: body.category,
      price: Number(body.price),
      hpp: Number(body.hpp),
      taxPercent: Number(body.taxPercent || 10),
      description: body.description || null,
      icon: body.icon || "🍽️",
      imageUrl: body.imageUrl || null,
      isActive: body.isActive ?? true,
      allowedAddOnCategories: Array.isArray(body.allowedAddOnCategories) ? body.allowedAddOnCategories : null,
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("MenuItem")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      const prismaClient = prisma as any;
      if (prismaClient && prismaClient.menuItem) {
        const item = await prismaClient.menuItem.upsert({
          where: { id },
          update: payload,
          create: payload,
        });
        return NextResponse.json(item);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "ID menu tidak ditemukan." }, { status: 400 });
    }
    const payload = {
      id: body.id,
      name: body.name,
      category: body.category,
      price: Number(body.price),
      hpp: Number(body.hpp),
      taxPercent: Number(body.taxPercent || 10),
      description: body.description || null,
      icon: body.icon || "🍽️",
      imageUrl: body.imageUrl || null,
      isActive: body.isActive ?? true,
      allowedAddOnCategories: Array.isArray(body.allowedAddOnCategories) ? body.allowedAddOnCategories : null,
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("MenuItem")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      const prismaClient = prisma as any;
      if (prismaClient && prismaClient.menuItem) {
        const item = await prismaClient.menuItem.upsert({
          where: { id: body.id },
          update: payload,
          create: payload,
        });
        return NextResponse.json(item);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID menu wajib diberikan." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("MenuItem")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      const prismaClient = prisma as any;
      if (prismaClient && prismaClient.menuItem) {
        await prismaClient.menuItem.delete({ where: { id } });
      }
    }

    return NextResponse.json({ success: true, deleted: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
