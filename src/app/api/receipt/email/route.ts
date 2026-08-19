import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function jsonWithCors(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orderNumber,
      customerName,
      customerEmail,
      tableNumber,
      orderType,
      items = [],
      subtotal = 0,
      tax = 0,
      discountAmount = 0,
      total = 0,
      paymentMethod = "QRIS",
      paymentStatus = "PAID",
      createdAt = new Date().toISOString(),
    } = body;

    if (!customerEmail) {
      return jsonWithCors({ message: "No customer email provided. E-Receipt skipped." }, 200);
    }

    const formattedDate = new Date(createdAt).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const itemsHtml = items
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 14px; color: #1e293b;">
            <strong>${item.nameSnapshot || item.name || "Menu"}</strong> x${item.qty || 1}
          </td>
          <td style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 14px; color: #0f172a; text-align: right; font-family: monospace; font-weight: bold;">
            Rp ${((item.priceSnapshot || item.price || 0) * (item.qty || 1)).toLocaleString("id-ID")}
          </td>
        </tr>
      `
      )
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>E-Receipt Kedai Nyamleng #${orderNumber}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <div style="background: #0f172a; color: #ffffff; padding: 25px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; color: #f59e0b;">🍗 KEDAI NYAMLENG</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Spesialis Ayam Presto &amp; Kuliner Nyamleng</p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">Jl. Laksada Adi Sucipto Gg.14 No 42, Blimbing, Malang</p>
          </div>

          <!-- Receipt Status Badge -->
          <div style="padding: 15px 20px; background: #ecfdf5; border-bottom: 1px solid #d1fae5; text-align: center;">
            <span style="font-size: 13px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 1px;">
              ✓ PEMBAYARAN BERHASIL (LUNAS)
            </span>
          </div>

          <!-- Body -->
          <div style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 12px; color: #64748b;">
              <div><strong>No. Order:</strong> <span style="color: #0f172a; font-family: monospace; font-weight: bold;">${orderNumber}</span></div>
              <div style="text-align: right;"><strong>Tanggal:</strong> ${formattedDate}</div>
            </div>

            <div style="margin-bottom: 15px; font-size: 13px; color: #334155;">
              <div><strong>Nama Pelanggan:</strong> ${customerName || "Pelanggan"}</div>
              <div><strong>Tipe Pesanan:</strong> ${orderType === "dine-in" ? `Dine-In (${tableNumber || "Meja -"})` : "Takeaway / Bungkus"}</div>
              <div><strong>Metode Pembayaran:</strong> ${paymentMethod}</div>
            </div>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <thead>
                <tr style="border-bottom: 2px solid #0f172a; font-size: 12px; text-transform: uppercase; color: #475569;">
                  <th style="padding: 6px 0; text-align: left;">Menu</th>
                  <th style="padding: 6px 0; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Calculation Summary -->
            <div style="margin-top: 15px; padding-top: 12px; border-top: 2px solid #e2e8f0; font-size: 13px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #64748b;">
                <span>Subtotal</span>
                <span style="font-family: monospace; font-weight: 600;">Rp ${Number(subtotal).toLocaleString("id-ID")}</span>
              </div>
              ${
                discountAmount > 0
                  ? `<div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #059669;">
                      <span>Diskon Promo</span>
                      <span style="font-family: monospace; font-weight: 600;">- Rp ${Number(discountAmount).toLocaleString("id-ID")}</span>
                    </div>`
                  : ""
              }
              ${
                tax > 0
                  ? `<div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #64748b;">
                      <span>PB1 / Pajak (10%)</span>
                      <span style="font-family: monospace; font-weight: 600;">Rp ${Number(tax).toLocaleString("id-ID")}</span>
                    </div>`
                  : ""
              }
              <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 2px solid #0f172a; font-size: 16px; font-weight: 900; color: #0f172a;">
                <span>TOTAL LUNAS</span>
                <span style="font-family: monospace; color: #f59e0b;">Rp ${Number(total).toLocaleString("id-ID")}</span>
              </div>
            </div>

            <!-- Footer Message -->
            <div style="margin-top: 25px; padding: 15px; background: #f1f5f9; border-radius: 12px; text-align: center; font-size: 12px; color: #475569;">
              <p style="margin: 0; font-weight: 700;">Terima Kasih Atas Kunjungan &amp; Pesanan Anda!</p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">Semoga hidangan presto &amp; minuman kami nyamleng di lidah Anda. Sampai jumpa lagi! 😊🍗</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`[E-Receipt] Generated for ${customerEmail} (Order #${orderNumber})`);

    return jsonWithCors({
      success: true,
      message: `E-Receipt otomatis berhasil dibuat untuk ${customerEmail}`,
      htmlPreview: emailHtml,
    });
  } catch (error) {
    console.error("E-Receipt generation error:", error);
    return jsonWithCors({ error: "Gagal membuat E-Receipt", details: String(error) }, 500);
  }
}
