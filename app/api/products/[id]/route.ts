import { NextResponse } from "next/server";

import { getProduct } from "@/lib/api/products";
import { writeLog } from "@/lib/data/logs";

/**
 * Product detail page data: the product, its trust analysis, and similar
 * products (pgvector, section 20). Public read route — no admin secret.
 *
 * Returns 404 JSON when the product is unknown or not yet analyzed; the
 * client maps that to the not-found page.
 */
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext): Promise<Response> {
  const { id } = await params;

  try {
    const detail = await getProduct(id);
    if (!detail) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    await writeLog("error", "api/products/[id]", "failed to load product detail", {
      product_id: id,
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to load product" }, { status: 500 });
  }
}