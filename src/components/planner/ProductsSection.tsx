import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { InteractiveProduct3DCard } from "@/components/ui/3d-product-card";
import { useProducts, Product } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingFunnelModal } from "@/components/booking/BookingFunnelModal";

export function ProductsSection() {
  const { products, loading } = useProducts();
  const navigate = useNavigate();
  const [bookingProduct, setBookingProduct] = useState<Product | null>(null);

  const handleProductClick = (product: Product) => {
    // Open the booking funnel modal instead of navigating
    setBookingProduct(product);
  };

  if (loading) {
    return (
      <section className="my-16">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">Our Products</h2>
          <p className="text-muted-foreground">
            Explore our exclusive packages and experiences
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full max-w-sm">
              <Skeleton className="aspect-[4/3] w-full rounded-t-2xl" />
              <div className="p-5 space-y-3 bg-card rounded-b-2xl border border-t-0 border-border">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-3">
                  <Skeleton className="h-10 flex-1 rounded-xl" />
                  <Skeleton className="h-10 flex-1 rounded-xl" />
                </div>
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Filter to only show products marked for "Our Products" section
  const visibleProducts = products.filter(p => p.show_in_our_products);

  if (visibleProducts.length === 0) {
    return (
      <section className="my-16">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">Our Products</h2>
          <p className="text-muted-foreground">
            Explore our exclusive packages and experiences
          </p>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          No products available yet.
        </div>
      </section>
    );
  }

  return (
    <section className="my-16">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">Our Products</h2>
        <p className="text-muted-foreground">
          Explore our exclusive packages and experiences
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
        {visibleProducts.map((product) => (
          <InteractiveProduct3DCard
            key={product.id}
            title={product.title}
            price={product.price}
            currency={product.currency}
            priceUnit={product.price_unit}
            description={product.description || ""}
            imageUrl={product.image_url || "/placeholder.svg"}
            videoUrl={product.video_url || undefined}
            mediaType={product.media_type}
            coverageText={product.coverage_text || ""}
            deliverableText={product.deliverable_text || ""}
            isHighlighted={product.is_highlighted}
            highlightLabel={product.highlight_label || "Special Deal"}
            actionText={product.cta_text}
            onActionClick={() => handleProductClick(product)}
          />
        ))}
      </div>

      {/* Booking Funnel Modal */}
      {bookingProduct && (
        <BookingFunnelModal
          isOpen={!!bookingProduct}
          onClose={() => setBookingProduct(null)}
          productId={bookingProduct.id}
          productTitle={bookingProduct.title}
          productPrice={bookingProduct.price}
          currency={bookingProduct.currency || 'USD'}
        />
      )}
    </section>
  );
}
