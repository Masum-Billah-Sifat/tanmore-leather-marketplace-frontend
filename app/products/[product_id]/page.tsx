"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { useAuthStore } from "@/stores/userAuthStore";
import Image from "next/image";

interface Variant {
  variant_id: string;
  color: string;
  size: string;
  in_stock: boolean;
  stock_amount: number;
  retail_price: number;
  has_retail_discount: boolean;
  retail_discount: number;
  retail_discount_type: string;
  wholesale_enabled: boolean;
  wholesale_price: number | null;
  wholesale_min_quantity: number | null;
  wholesale_discount: number | null;
  wholesale_discount_type: string | null;
  weight_grams: number;
}

interface ProductData {
  product_id: string;
  title: string;
  description: string;
  category_id: string;
  category_name: string;
  seller_id: string;
  seller_store_name: string;
  images: string[];
  promo_video_url: string;
  variants: Variant[];
}

interface Review {
  review_id: string;
  reviewer_user_id: string;
  review_text: string;
  review_image_url?: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  reply?: {
    reply_id: string;
    seller_user_id: string;
    reply_text: string;
    reply_image_url?: string;
    is_edited: boolean;
    created_at: string;
    updated_at: string;
  };
}

export default function ProductPage() {
  const { product_id } = useParams();

  const fetchReviews = useCallback(async () => {
    try {
      setLoadingReviews(true);
      const res = await apiClient.get(`/api/products/${product_id}/reviews`);
      console.log(res.data);
      setReviews(res.data.data.items);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  }, [product_id]); // ✅ include dependencies

  console.log("🔍 ProductPage loaded with product_id:", product_id);

  const [product, setProduct] = useState<ProductData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // 🔑 variant_id -> quantity_in_cart
  const [cartMap, setCartMap] = useState<Record<string, number>>({});

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const [editReviewId, setEditReviewId] = useState<string | null>(null);
  const [editReviewText, setEditReviewText] = useState("");

  // regarding reviews related stuff
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [loadingReviews, setLoadingReviews] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);

  // const fetchReviews = async () => {
  //   try {
  //     setLoadingReviews(true);
  //     const res = await apiClient.get(`/api/products/${product_id}/reviews`);
  //     setReviews(res.data.items);
  //   } catch (err) {
  //     console.error("Failed to fetch reviews:", err);
  //   } finally {
  //     setLoadingReviews(false);
  //   }
  // };

  /* ------------------ Fetch product ------------------ */
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await apiClient.get(`/api/products/${product_id}`);
        setProduct(res.data.data);
        console.log("✅ Product fetched:", res.data.data);
      } catch (err) {
        console.error("❌ Failed to fetch product:", err);

        setError("Product not found or unavailable");
      }
    };

    if (product_id) fetchProduct();
  }, [product_id]);

  /* ------------------ Fetch cart items ------------------ */
  useEffect(() => {
    const fetchCart = async () => {
      // if (!hasHydrated || !isLoggedIn) return

      if (!hasHydrated || !isLoggedIn) {
        console.log(
          "⚠️ Skipping cart fetch: hydrated =",
          hasHydrated,
          "loggedIn =",
          isLoggedIn
        );
        return;
      }

      try {
        const res = await apiClient.get("/api/cart/items");
        // const groups = res.data.data.valid_items
        const groups = res.data.data.valid_items.map((g: any) => ({
          seller_id: g.seller_id || g.SellerID,
          store_name: g.store_name || g.StoreName,
          products: g.products || g.Products,
        }));

        console.log("✅ Cart fetched:", groups);

        const map: Record<string, number> = {};

        for (const group of groups) {
          for (const product of group.products) {
            for (const variant of product.variants) {
              map[variant.variant_id] = variant.quantity_in_cart;
            }
          }
        }
        console.log("🧭 Built cartMap:", map);

        setCartMap(map);
      } catch (err) {
        console.error("Failed to fetch cart items", err);
      }
    };

    fetchCart();
  }, [hasHydrated, isLoggedIn]);

  // useEffect(() => {
  //   const fetchReviews = async () => {
  //     try {
  //       const res = await apiClient.get(`/api/products/${product_id}/reviews`);
  //       setReviews(res.data.items);
  //     } catch (err) {
  //       console.error("Failed to fetch reviews:", err);
  //     } finally {
  //       setLoadingReviews(false);
  //     }
  //   };

  //   if (product_id) fetchReviews();
  // }, [product_id]);

  useEffect(() => {
    if (product_id) fetchReviews();
  }, [product_id, fetchReviews]);

  if (error) return <div className="p-4 text-red-600 text-center">{error}</div>;
  if (!product)
    return <div className="p-4 text-gray-600 text-center">Loading…</div>;

  /* ------------------ Variant logic ------------------ */
  const allColors = Array.from(new Set(product.variants.map((v) => v.color)));
  const allSizes = Array.from(new Set(product.variants.map((v) => v.size)));

  const validColors = selectedSize
    ? new Set(
        product.variants
          .filter((v) => v.size === selectedSize)
          .map((v) => v.color)
      )
    : null;

  const validSizes = selectedColor
    ? new Set(
        product.variants
          .filter((v) => v.color === selectedColor)
          .map((v) => v.size)
      )
    : null;

  const selectedVariant = product.variants.find(
    (v) => v.color === selectedColor && v.size === selectedSize
  );

  console.log("🎯 Selected Color:", selectedColor);
  console.log("🎯 Selected Size:", selectedSize);
  console.log("🎯 Selected Variant:", selectedVariant);

  const variantInCartQty = selectedVariant
    ? cartMap[selectedVariant.variant_id]
    : undefined;

  console.log("🛒 variantInCartQty:", variantInCartQty);

  /* ------------------ Handlers ------------------ */
  const handleAddToCart = async () => {
    if (!isLoggedIn) return alert("Please log in before proceeding.");
    if (!selectedVariant) return;

    try {
      await apiClient.post("/api/cart/add", {
        product_id: product.product_id,
        variant_id: selectedVariant.variant_id,
        required_quantity: quantity,
      });

      setCartMap((prev) => ({
        ...prev,
        [selectedVariant.variant_id]: quantity,
      }));

      alert("Added to cart!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add to cart");
    }
  };

  const handleUpdateCart = async () => {
    if (!selectedVariant) return;

    if (variantInCartQty === quantity) {
      alert("Please change the quantity before updating.");
      return;
    }

    try {
      await apiClient.put("/api/cart/update", {
        variant_id: selectedVariant.variant_id,
        required_quantity: quantity,
      });

      setCartMap((prev) => ({
        ...prev,
        [selectedVariant.variant_id]: quantity,
      }));

      alert("Cart updated!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update cart");
    }
  };

  const handleSubmitReview = async () => {
    if (!isLoggedIn) return alert("Please log in to submit a review.");
    if (!reviewText.trim()) return alert("Review text cannot be empty.");

    try {
      const res = await apiClient.post(`/api/products/${product_id}/reviews`, {
        review_text: reviewText,
      });

      console.log("📨 Review submitted response:", res.data.data); // 👈 Add this

      alert("Review submitted!");
      setReviewText("");

      // 🔁 Re-fetch reviews so UI stays consistent
      await fetchReviews();

      // alert("Review submitted!");
      // setReviewText("");

      // temporarily commentedout for now
      // setReviews((prev) => [res.data.data, ...prev]); // Optional: push new one
    } catch (err: any) {
      console.error("❌ Error submitting review:", err);

      alert(err.response?.data?.error || "Failed to submit review.");
    }
  };

  const handleEditReview = async (review_id: string) => {
    if (!editReviewText.trim()) return alert("Updated review cannot be empty.");

    try {
      await apiClient.put(`/api/products/${product_id}/reviews/${review_id}`, {
        review_text: editReviewText,
      });

      alert("Review updated!");
      setEditReviewId(null);
      setEditReviewText("");
      await fetchReviews(); // Refresh reviews
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update review.");
    }
  };

  const handleArchiveReview = async (review_id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      await apiClient.put(
        `/api/products/${product_id}/reviews/${review_id}/archive`
      );

      alert("Review deleted!");
      await fetchReviews(); // Refresh reviews
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete review.");
    }
  };

  /* ------------------ UI ------------------ */
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
      <p className="text-gray-700 mb-6">{product.description}</p>

      {/* Color */}
      <div className="mb-4">
        <p className="font-semibold mb-1">Color</p>
        <div className="flex gap-2 flex-wrap">
          {allColors.map((color) => {
            const disabled = validColors && !validColors.has(color);
            return (
              <button
                key={color}
                disabled={!!disabled}
                onClick={() => setSelectedColor(color)}
                className={`px-3 py-1 rounded border ${
                  selectedColor === color
                    ? "bg-black text-white"
                    : disabled
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100"
                }`}
              >
                {color}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size */}
      <div className="mb-6">
        <p className="font-semibold mb-1">Size</p>
        <div className="flex gap-2 flex-wrap">
          {allSizes.map((size) => {
            const disabled = validSizes && !validSizes.has(size);
            return (
              <button
                key={size}
                disabled={!!disabled}
                onClick={() => setSelectedSize(size)}
                className={`px-3 py-1 rounded border ${
                  selectedSize === size
                    ? "bg-black text-white"
                    : disabled
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-100"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {selectedVariant && (
        <div className="border-t pt-4">
          <p className="mb-2">
            <b>Price:</b> {selectedVariant.retail_price}
          </p>

          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
              −
            </button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity((q) => q + 1)}>+</button>
          </div>

          <div className="flex gap-4">
            {variantInCartQty !== undefined ? (
              <button
                className="bg-yellow-500 text-white px-4 py-2 rounded"
                onClick={handleUpdateCart}
              >
                Update Cart
              </button>
            ) : (
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={handleAddToCart}
              >
                Add to Cart
              </button>
            )}

            <button className="bg-green-600 text-white px-4 py-2 rounded">
              Buy Now
            </button>
          </div>
        </div>
      )}
      <div className="mt-12 border-t pt-6">
        <h2 className="text-xl font-bold mb-4">📝 Reviews</h2>

        {isLoggedIn && (
          <div className="mb-6">
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Write your review..."
              className="w-full p-2 border rounded mb-2"
            />
            <button
              onClick={handleSubmitReview}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Submit Review
            </button>
          </div>
        )}

        {loadingReviews ? (
          <p className="text-gray-600">Loading reviews...</p>
        ) : reviews?.length === 0 ? (
          <div className="text-center text-gray-600 bg-gray-50 border rounded p-4">
            <p className="mb-2">No reviews found for this product.</p>
            <p className="font-medium">
              Be the first to leave a review and help others!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews?.map((review) => (
              <div
                key={review.review_id}
                className="border p-4 rounded bg-gray-50"
              >
                <p className="mb-1">{review.review_text}</p>
                {review.review_image_url && (
                  <Image
                    src={review.review_image_url}
                    alt="Review"
                    className="max-w-xs mt-2"
                  />
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Posted on {new Date(review.created_at).toLocaleString()}
                  {review.is_edited && " (edited)"}
                </p>

                {/* {review.reviewer_user_id === userId && (
                  <div className="mt-2 flex gap-2">
                    <button className="text-blue-600 text-sm">✏️ Edit</button>
                    <button className="text-red-600 text-sm">🗑️ Delete</button>
                  </div>
                )} */}

                {review.reviewer_user_id === userId && (
                  <div className="mt-2 space-y-2">
                    {editReviewId === review.review_id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editReviewText}
                          onChange={(e) => setEditReviewText(e.target.value)}
                          className="w-full p-2 border rounded"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditReview(review.review_id)}
                            className="bg-blue-600 text-white text-sm px-3 py-1 rounded"
                          >
                            💾 Save
                          </button>
                          <button
                            onClick={() => {
                              setEditReviewId(null);
                              setEditReviewText("");
                            }}
                            className="bg-gray-300 text-black text-sm px-3 py-1 rounded"
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          className="text-blue-600 text-sm"
                          onClick={() => {
                            setEditReviewId(review.review_id);
                            setEditReviewText(review.review_text);
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="text-red-600 text-sm"
                          onClick={() => handleArchiveReview(review.review_id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {review.reply && (
                  <div className="mt-4 ml-4 border-l-4 border-green-500 pl-4 bg-green-50 rounded">
                    <p className="text-sm font-semibold text-green-700">
                      Seller Reply:
                    </p>
                    <p>{review.reply.reply_text}</p>
                    {review.reply.reply_image_url && (
                      <Image
                        src={review.reply.reply_image_url}
                        alt="Reply"
                        className="max-w-xs mt-1"
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Replied on{" "}
                      {new Date(review.reply.created_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// "use client"

// import { useEffect, useState } from "react"
// import { useParams } from "next/navigation"
// import apiClient from "@/lib/apiClient"
// import { useAuthStore } from "@/stores/userAuthStore"

// interface Variant {
//   variant_id: string
//   color: string
//   size: string
//   in_stock: boolean
//   stock_amount: number
//   retail_price: number
//   has_retail_discount: boolean
//   retail_discount: number
//   retail_discount_type: string
//   wholesale_enabled: boolean
//   wholesale_price: number | null
//   wholesale_min_quantity: number | null
//   wholesale_discount: number | null
//   wholesale_discount_type: string | null
//   weight_grams: number
// }

// interface ProductData {
//   product_id: string
//   title: string
//   description: string
//   category_id: string
//   category_name: string
//   seller_id: string
//   seller_store_name: string
//   images: string[]
//   promo_video_url: string
//   variants: Variant[]
// }

// interface CartVariant {
//   variant_id: string
//   quantity_in_cart: number
// }

// interface CartProduct {
//   product_id: string
//   variants: CartVariant[]
// }

// interface CartGroup {
//   seller_id: string
//   products: CartProduct[]
// }

// export default function ProductPage() {
//   const { product_id } = useParams()
//   const [product, setProduct] = useState<ProductData | null>(null)
//   const [error, setError] = useState<string | null>(null)

//   const [selectedColor, setSelectedColor] = useState<string | null>(null)
//   const [selectedSize, setSelectedSize] = useState<string | null>(null)
//   const [quantity, setQuantity] = useState(1)

//   const [cart, setCart] = useState<{ variant_id: string; quantity: number } | null>(null)

//   const isLoggedIn = useAuthStore((state) => state.isLoggedIn)

//   // Fetch product details
//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         const res = await apiClient.get(`/api/products/${product_id}`)
//         setProduct(res.data.data)
//       } catch {
//         setError("Product not found or unavailable")
//       }
//     }

//     if (product_id) fetchProduct()
//   }, [product_id])

//   // Fetch cart data to check if variant already in cart
//   useEffect(() => {
//     const fetchCart = async () => {
//       if (!isLoggedIn || !product_id) return

//       try {
//         const res = await apiClient.get("/api/cart/items")
//         const cartGroups: CartGroup[] = res.data.data.valid_items

//         for (const group of cartGroups) {
//           for (const p of group.products) {
//             if (p.product_id === product_id) {
//               for (const v of p.variants) {
//                 setCart({ variant_id: v.variant_id, quantity: v.quantity_in_cart })
//                 return
//               }
//             }
//           }
//         }
//       } catch (err: any) {
//         console.error("Cart fetch failed", err)
//       }
//     }

//     fetchCart()
//   }, [isLoggedIn, product_id])

//   const allColors = Array.from(new Set(product?.variants.map(v => v.color) ?? []))
//   const allSizes = Array.from(new Set(product?.variants.map(v => v.size) ?? []))

//   const validColors = selectedSize
//     ? new Set(product?.variants.filter(v => v.size === selectedSize).map(v => v.color))
//     : null

//   const validSizes = selectedColor
//     ? new Set(product?.variants.filter(v => v.color === selectedColor).map(v => v.size))
//     : null

//   const selectedVariant = product?.variants.find(
//     v => v.color === selectedColor && v.size === selectedSize
//   )

//   const handleAddToCart = async () => {
//     if (!isLoggedIn) return alert("Please log in before proceeding.")
//     if (!product || !selectedVariant) return

//     try {
//       const res = await apiClient.post("/api/cart/add", {
//         product_id: product.product_id,
//         variant_id: selectedVariant.variant_id,
//         required_quantity: quantity,
//       })

//       const status = res.data?.data?.status
//       if (status === "added_to_cart" || status === "cart_item_reactivated") {
//         setCart({ variant_id: selectedVariant.variant_id, quantity })
//         alert("Added to cart!")
//       }
//     } catch (err: any) {
//       alert(err.response?.data?.message || "Failed to add to cart")
//     }
//   }

//   const handleUpdateCart = async () => {
//     if (!isLoggedIn) return alert("Please log in before proceeding.")
//     if (!selectedVariant || !cart) return

//     if (cart.quantity === quantity) {
//       alert("Please change the quantity before updating.")
//       return
//     }

//     try {
//       await apiClient.put("/api/cart/update", {
//         variant_id: selectedVariant.variant_id,
//         required_quantity: quantity,
//       })

//       setCart({ variant_id: selectedVariant.variant_id, quantity })
//       alert("Cart updated!")
//     } catch (err: any) {
//       alert(err.response?.data?.message || "Failed to update cart")
//     }
//   }

//   if (error) return <div className="p-4 text-red-600 text-center">{error}</div>
//   if (!product) return <div className="p-4 text-gray-600 text-center">Loading…</div>

//   return (
//     <div className="max-w-3xl mx-auto p-6">
//       <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
//       <p className="text-gray-700 mb-6">{product.description}</p>

//       {/* Color selector */}
//       <div className="mb-4">
//         <p className="font-semibold mb-1">Color</p>
//         <div className="flex gap-2 flex-wrap">
//           {allColors.map(color => {
//             const disabled = validColors && !validColors.has(color)
//             return (
//               <button
//                 key={color}
//                 disabled={!!disabled}
//                 onClick={() => setSelectedColor(color)}
//                 className={`px-3 py-1 rounded border ${
//                   selectedColor === color
//                     ? "bg-black text-white"
//                     : !!disabled
//                     ? "bg-gray-200 text-gray-400 cursor-not-allowed"
//                     : "bg-gray-100"
//                 }`}
//               >
//                 {color}
//               </button>
//             )
//           })}
//         </div>
//       </div>

//       {/* Size selector */}
//       <div className="mb-6">
//         <p className="font-semibold mb-1">Size</p>
//         <div className="flex gap-2 flex-wrap">
//           {allSizes.map(size => {
//             const disabled = validSizes && !validSizes.has(size)
//             return (
//               <button
//                 key={size}
//                 disabled={!!disabled}
//                 onClick={() => setSelectedSize(size)}
//                 className={`px-3 py-1 rounded border ${
//                   selectedSize === size
//                     ? "bg-black text-white"
//                     : !!disabled
//                     ? "bg-gray-200 text-gray-400 cursor-not-allowed"
//                     : "bg-gray-100"
//                 }`}
//               >
//                 {size}
//               </button>
//             )
//           })}
//         </div>
//       </div>

//       {selectedVariant && (
//         <div className="border-t pt-4">
//           <p className="mb-2">
//             <b>Price:</b> {selectedVariant.retail_price}
//           </p>

//           <div className="flex items-center gap-4 mb-4">
//             <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
//             <span>{quantity}</span>
//             <button onClick={() => setQuantity(q => q + 1)}>+</button>
//           </div>

//           <div className="flex gap-4">
//             {cart?.variant_id === selectedVariant.variant_id ? (
//               <button
//                 className="bg-yellow-500 text-white px-4 py-2 rounded"
//                 onClick={handleUpdateCart}
//               >
//                 Update Cart
//               </button>
//             ) : (
//               <button
//                 className="bg-blue-600 text-white px-4 py-2 rounded"
//                 onClick={handleAddToCart}
//               >
//                 Add to Cart
//               </button>
//             )}
//             <button className="bg-green-600 text-white px-4 py-2 rounded">
//               Buy Now
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// "use client"

// import { useEffect, useState } from "react"
// import { useParams } from "next/navigation"
// import apiClient from "@/lib/apiClient"
// import { useAuthStore } from "@/stores/userAuthStore"

// interface Variant {
//   variant_id: string
//   color: string
//   size: string
//   in_stock: boolean
//   stock_amount: number
//   retail_price: number
//   has_retail_discount: boolean
//   retail_discount: number
//   retail_discount_type: string
//   wholesale_enabled: boolean
//   wholesale_price: number | null
//   wholesale_min_quantity: number | null
//   wholesale_discount: number | null
//   wholesale_discount_type: string | null
//   weight_grams: number
// }

// interface ProductData {
//   product_id: string
//   title: string
//   description: string
//   category_id: string
//   category_name: string
//   seller_id: string
//   seller_store_name: string
//   images: string[]
//   promo_video_url: string
//   variants: Variant[]
// }

// export default function ProductPage() {
//   const { product_id } = useParams()
//   const [product, setProduct] = useState<ProductData | null>(null)
//   const [error, setError] = useState<string | null>(null)

//   const [selectedColor, setSelectedColor] = useState<string | null>(null)
//   const [selectedSize, setSelectedSize] = useState<string | null>(null)
//   const [quantity, setQuantity] = useState(1)

//   const [cart, setCart] = useState<{ variant_id: string; quantity: number } | null>(null)

//   const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
//   const accessToken = useAuthStore((state) => state.accessToken)

//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         const res = await apiClient.get(`/api/products/${product_id}`)
//         setProduct(res.data.data)
//       } catch {
//         setError("Product not found or unavailable")
//       }
//     }

//     if (product_id) fetchProduct()
//   }, [product_id])

//   const allColors = Array.from(new Set(product?.variants.map(v => v.color) ?? []))
//   const allSizes = Array.from(new Set(product?.variants.map(v => v.size) ?? []))

//   const validColors = selectedSize
//     ? new Set(product?.variants.filter(v => v.size === selectedSize).map(v => v.color))
//     : null

//   const validSizes = selectedColor
//     ? new Set(product?.variants.filter(v => v.color === selectedColor).map(v => v.size))
//     : null

//   const selectedVariant = product?.variants.find(
//     v => v.color === selectedColor && v.size === selectedSize
//   )

//   const handleAddToCart = async () => {
//     if (!isLoggedIn) return alert("Please log in before proceeding.")
//     if (!product || !selectedVariant) return

//     try {
//       const res = await apiClient.post("/api/cart/add", {
//         product_id: product.product_id,
//         variant_id: selectedVariant.variant_id,
//         required_quantity: quantity,
//       })

//       const status = res.data?.data?.status
//       if (status === "added_to_cart" || status === "cart_item_reactivated") {
//         setCart({ variant_id: selectedVariant.variant_id, quantity })
//         alert("Added to cart!")
//       }
//     } catch (err: any) {
//       alert(err.response?.data?.message || "Failed to add to cart")
//     }
//   }

//   const handleUpdateCart = async () => {
//     if (!isLoggedIn) return alert("Please log in before proceeding.")
//     if (!selectedVariant || !cart) return

//     if (cart.quantity === quantity) {
//       alert("Please change the quantity before updating.")
//       return
//     }

//     try {
//       const res = await apiClient.put("/api/cart/update", {
//         variant_id: selectedVariant.variant_id,
//         required_quantity: quantity,
//       })

//       setCart({ variant_id: selectedVariant.variant_id, quantity })
//       alert("Cart updated!")
//     } catch (err: any) {
//       alert(err.response?.data?.message || "Failed to update cart")
//     }
//   }

//   if (error) return <div className="p-4 text-red-600 text-center">{error}</div>
//   if (!product) return <div className="p-4 text-gray-600 text-center">Loading…</div>

//   return (
//     <div className="max-w-3xl mx-auto p-6">
//       <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
//       <p className="text-gray-700 mb-6">{product.description}</p>

//       {/* Color selector */}
//       <div className="mb-4">
//         <p className="font-semibold mb-1">Color</p>
//         <div className="flex gap-2 flex-wrap">
//           {allColors.map(color => {
//             const disabled = validColors && !validColors.has(color)
//             return (
//               <button
//                 key={color}
//                 disabled={!!disabled}
//                 onClick={() => setSelectedColor(color)}
//                 className={`px-3 py-1 rounded border ${
//                   selectedColor === color
//                     ? "bg-black text-white"
//                     : !!disabled
//                     ? "bg-gray-200 text-gray-400 cursor-not-allowed"
//                     : "bg-gray-100"
//                 }`}
//               >
//                 {color}
//               </button>
//             )
//           })}
//         </div>
//       </div>

//       {/* Size selector */}
//       <div className="mb-6">
//         <p className="font-semibold mb-1">Size</p>
//         <div className="flex gap-2 flex-wrap">
//           {allSizes.map(size => {
//             const disabled = validSizes && !validSizes.has(size)
//             return (
//               <button
//                 key={size}
//                 disabled={!!disabled}
//                 onClick={() => setSelectedSize(size)}
//                 className={`px-3 py-1 rounded border ${
//                   selectedSize === size
//                     ? "bg-black text-white"
//                     : !!disabled
//                     ? "bg-gray-200 text-gray-400 cursor-not-allowed"
//                     : "bg-gray-100"
//                 }`}
//               >
//                 {size}
//               </button>
//             )
//           })}
//         </div>
//       </div>

//       {selectedVariant && (
//         <div className="border-t pt-4">
//           <p className="mb-2">
//             <b>Price:</b> {selectedVariant.retail_price}
//           </p>

//           <div className="flex items-center gap-4 mb-4">
//             <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
//             <span>{quantity}</span>
//             <button onClick={() => setQuantity(q => q + 1)}>+</button>
//           </div>

//           <div className="flex gap-4">
//             {cart?.variant_id === selectedVariant.variant_id ? (
//               <button
//                 className="bg-yellow-500 text-white px-4 py-2 rounded"
//                 onClick={handleUpdateCart}
//               >
//                 Update Cart
//               </button>
//             ) : (
//               <button
//                 className="bg-blue-600 text-white px-4 py-2 rounded"
//                 onClick={handleAddToCart}
//               >
//                 Add to Cart
//               </button>
//             )}
//             <button className="bg-green-600 text-white px-4 py-2 rounded">
//               Buy Now
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// "use client"

// import { useEffect, useState } from "react"
// import axios from "axios"
// import { useParams } from "next/navigation"

// interface Variant {
//   variant_id: string
//   color: string
//   size: string
//   in_stock: boolean
//   stock_amount: number
//   retail_price: number
//   has_retail_discount: boolean
//   retail_discount: number
//   retail_discount_type: string
//   wholesale_enabled: boolean
//   wholesale_price: number | null
//   wholesale_min_quantity: number | null
//   wholesale_discount: number | null
//   wholesale_discount_type: string | null
//   weight_grams: number
// }

// interface ProductData {
//   product_id: string
//   title: string
//   description: string
//   category_id: string
//   category_name: string
//   seller_id: string
//   seller_store_name: string
//   images: string[]
//   promo_video_url: string
//   variants: Variant[]
// }

// export default function ProductPage() {
//   const { product_id } = useParams()
//   const [product, setProduct] = useState<ProductData | null>(null)
//   const [error, setError] = useState<string | null>(null)

//   const [selectedColor, setSelectedColor] = useState<string | null>(null)
//   const [selectedSize, setSelectedSize] = useState<string | null>(null)
//   const [quantity, setQuantity] = useState(1)

//   const [cart, setCart] = useState<{ variant_id: string; quantity: number } | null>(null)

//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         const res = await axios.get(
//           `http://localhost:8080/api/products/${product_id}`
//         )
//         setProduct(res.data.data)
//       } catch {
//         setError("Product not found or unavailable")
//       }
//     }

//     if (product_id) fetchProduct()
//   }, [product_id])

//   if (error) return <div className="p-4 text-red-600 text-center">{error}</div>
//   if (!product) return <div className="p-4 text-gray-600 text-center">Loading…</div>

//   const allColors = Array.from(new Set(product.variants.map(v => v.color)))
//   const allSizes = Array.from(new Set(product.variants.map(v => v.size)))

//   const validColors = selectedSize
//     ? new Set(product.variants.filter(v => v.size === selectedSize).map(v => v.color))
//     : null

//   const validSizes = selectedColor
//     ? new Set(product.variants.filter(v => v.color === selectedColor).map(v => v.size))
//     : null

//   const selectedVariant = product.variants.find(
//     v => v.color === selectedColor && v.size === selectedSize
//   )

//   return (
//     <div className="max-w-3xl mx-auto p-6">
//       <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
//       <p className="text-gray-700 mb-6">{product.description}</p>

//       {/* 🎨 Colors */}
//       <div className="mb-4">
//         <p className="font-semibold mb-1">Color</p>
//         <div className="flex gap-2 flex-wrap">
//           {allColors.map(color => {
//             const disabled = validColors && !validColors.has(color)
//             return (
//               <button
//                 key={color}
//                 disabled={!!disabled}
//                 onClick={() => setSelectedColor(color)}
//                 className={`px-3 py-1 rounded border ${
//                   selectedColor === color
//                     ? "bg-black text-white"
//                     : disabled
//                     ? "bg-gray-200 text-gray-400 cursor-not-allowed"
//                     : "bg-gray-100"
//                 }`}
//               >
//                 {color}
//               </button>
//             )
//           })}
//         </div>
//       </div>

//       {/* 📏 Sizes */}
//       <div className="mb-6">
//         <p className="font-semibold mb-1">Size</p>
//         <div className="flex gap-2 flex-wrap">
//           {allSizes.map(size => {
//             const disabled = validSizes && !validSizes.has(size)
//             return (
//               <button
//                 key={size}
//                 disabled={!!disabled}
//                 onClick={() => setSelectedSize(size)}
//                 className={`px-3 py-1 rounded border ${
//                   selectedSize === size
//                     ? "bg-black text-white"
//                     : disabled
//                     ? "bg-gray-200 text-gray-400 cursor-not-allowed"
//                     : "bg-gray-100"
//                 }`}
//               >
//                 {size}
//               </button>
//             )
//           })}
//         </div>
//       </div>

//       {/* 🧮 Variant Actions */}
//       {selectedVariant && (
//         <div className="border-t pt-4">
//           <p className="mb-2">
//             <b>Price:</b> {selectedVariant.retail_price}
//           </p>

//           <div className="flex items-center gap-4 mb-4">
//             <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
//             <span>{quantity}</span>
//             <button onClick={() => setQuantity(q => q + 1)}>+</button>
//           </div>

//           <div className="flex gap-4">
//             {cart?.variant_id === selectedVariant.variant_id ? (
//               <button
//                 className="bg-yellow-500 text-white px-4 py-2 rounded"
//                 onClick={() => setCart({ variant_id: selectedVariant.variant_id, quantity })}
//               >
//                 Update Cart
//               </button>
//             ) : (
//               <button
//                 className="bg-blue-600 text-white px-4 py-2 rounded"
//                 onClick={() => setCart({ variant_id: selectedVariant.variant_id, quantity })}
//               >
//                 Add to Cart
//               </button>
//             )}
//             <button className="bg-green-600 text-white px-4 py-2 rounded">
//               Buy Now
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// "use client"

// import { useEffect, useState } from "react"
// import axios from "axios"
// import { useParams } from "next/navigation"

// interface Variant {
//   variant_id: string
//   color: string
//   size: string
//   in_stock: boolean
//   stock_amount: number
//   retail_price: number
//   has_retail_discount: boolean
//   retail_discount: number
//   retail_discount_type: string
//   wholesale_enabled: boolean
//   wholesale_price: number | null
//   wholesale_min_quantity: number | null
//   wholesale_discount: number | null
//   wholesale_discount_type: string | null
//   weight_grams: number
// }

// interface ProductData {
//   product_id: string
//   title: string
//   description: string
//   category_id: string
//   category_name: string
//   seller_id: string
//   seller_store_name: string
//   images: string[]
//   promo_video_url: string
//   variants: Variant[]
// }

// export default function ProductPage() {
//   const { product_id } = useParams()
//   const [product, setProduct] = useState<ProductData | null>(null)
//   const [error, setError] = useState<string | null>(null)

//   const [selectedColor, setSelectedColor] = useState<string | null>(null)
//   const [selectedSize, setSelectedSize] = useState<string | null>(null)
//   const [quantity, setQuantity] = useState<number>(1)

//   // 🛒 Simulated cart state
//   const [cart, setCart] = useState<{ variant_id: string; quantity: number } | null>(null)

//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         const res = await axios.get(`http://localhost:8080/api/products/${product_id}`)
//         setProduct(res.data.data)
//       } catch (err: any) {
//         console.error("Failed to fetch product:", err)
//         setError("Product not found or unavailable")
//       }
//     }

//     if (product_id) fetchProduct()
//   }, [product_id])

//   if (error) return <div className="p-4 text-red-600 text-center">{error}</div>
//   if (!product) return <div className="p-4 text-gray-600 text-center">Loading product details...</div>

//   // 🔎 Extract unique colors & sizes from all variants
//   const allColors = Array.from(new Set(product.variants.map(v => v.color)))
//   const allSizes = Array.from(new Set(product.variants.map(v => v.size)))

//   // 🔍 Filtered sizes/colors based on selection
//   const filteredSizes = selectedColor
//     ? Array.from(new Set(product.variants.filter(v => v.color === selectedColor).map(v => v.size)))
//     : allSizes

//   const filteredColors = selectedSize
//     ? Array.from(new Set(product.variants.filter(v => v.size === selectedSize).map(v => v.color)))
//     : allColors

//   // ✅ Determine the selected variant
//   const selectedVariant = product.variants.find(
//     v => v.color === selectedColor && v.size === selectedSize
//   )

//   // 🛒 Handlers
//   const handleAddToCart = () => {
//     if (selectedVariant) {
//       setCart({ variant_id: selectedVariant.variant_id, quantity })
//       alert("Added to cart!")
//     }
//   }

//   const handleUpdateCart = () => {
//     if (selectedVariant) {
//       setCart({ variant_id: selectedVariant.variant_id, quantity })
//       alert("Cart updated!")
//     }
//   }

//   const handleBuyNow = () => {
//     if (selectedVariant) {
//       alert(`Buying now: ${selectedVariant.variant_id} with quantity ${quantity}`)
//     }
//   }

//   return (
//     <div className="max-w-3xl mx-auto p-6">
//       <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
//       <p className="text-gray-700 mb-4">{product.description}</p>

//       {/* 🎨 Color Selector */}
//       <div className="mb-4">
//         <label className="block font-semibold mb-1">Color:</label>
//         <div className="flex gap-2 flex-wrap">
//           {filteredColors.map((color) => (
//             <button
//               key={color}
//               onClick={() => {
//                 setSelectedColor(color)
//                 setSelectedSize(null) // reset size on color change
//               }}
//               className={`px-3 py-1 rounded border ${
//                 selectedColor === color ? "bg-black text-white" : "bg-gray-100"
//               }`}
//             >
//               {color}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* 📏 Size Selector */}
//       {/* {selectedColor && ( */}
//         <div className="mb-4">
//           <label className="block font-semibold mb-1">Size:</label>
//           <div className="flex gap-2 flex-wrap">
//             {filteredSizes.map((size) => (
//               <button
//                 key={size}
//                 onClick={() => setSelectedSize(size)}
//                 className={`px-3 py-1 rounded border ${
//                   selectedSize === size ? "bg-black text-white" : "bg-gray-100"
//                 }`}
//               >
//                 {size}
//               </button>
//             ))}
//           </div>
//         </div>
//       {/* )} */}

//       {/* 📦 Variant Detail + Quantity + Buttons */}
//       {selectedVariant && (
//         <div className="mt-6 border-t pt-4">
//           <div className="mb-2">
//             <span className="font-semibold">Price:</span>{" "}
//             {selectedVariant.has_retail_discount
//               ? `${selectedVariant.retail_price} (-${selectedVariant.retail_discount}%)`
//               : selectedVariant.retail_price}
//           </div>

//           {/* 🔢 Quantity selector */}
//           <div className="flex items-center gap-4 mb-4">
//             <button
//               onClick={() => setQuantity((q) => Math.max(1, q - 1))}
//               className="px-3 py-1 rounded bg-gray-200"
//             >
//               –
//             </button>
//             <span className="text-lg">{quantity}</span>
//             <button
//               onClick={() => setQuantity((q) => q + 1)}
//               className="px-3 py-1 rounded bg-gray-200"
//             >
//               +
//             </button>
//           </div>

//           {/* 🛒 Buttons */}
//           <div className="flex gap-4">
//             {cart?.variant_id === selectedVariant.variant_id ? (
//               <button
//                 onClick={handleUpdateCart}
//                 className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
//               >
//                 Update Cart
//               </button>
//             ) : (
//               <button
//                 onClick={handleAddToCart}
//                 className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
//               >
//                 Add to Cart
//               </button>
//             )}
//             <button
//               onClick={handleBuyNow}
//               className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
//             >
//               Buy Now
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// "use client"

// import { useEffect, useState } from "react"
// import axios from "axios"
// import { useParams } from "next/navigation"

// interface Variant {
//   variant_id: string
//   color: string
//   size: string
//   in_stock: boolean
//   stock_amount: number
//   retail_price: number
//   has_retail_discount: boolean
//   retail_discount: number
//   retail_discount_type: string
//   wholesale_enabled: boolean
//   wholesale_price: number | null
//   wholesale_min_quantity: number | null
//   wholesale_discount: number | null
//   wholesale_discount_type: string | null
//   weight_grams: number
// }

// interface ProductData {
//   product_id: string
//   title: string
//   description: string
//   category_id: string
//   category_name: string
//   seller_id: string
//   seller_store_name: string
//   images: string[]
//   promo_video_url: string
//   variants: Variant[]
// }

// export default function ProductPage() {
//   const { product_id } = useParams()
//   const [product, setProduct] = useState<ProductData | null>(null)
//   const [error, setError] = useState<string | null>(null)

//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         const res = await axios.get(`http://localhost:8080/api/products/${product_id}`)
//         setProduct(res.data.data)
//         console.log(res.data.data)
//       } catch (err: any) {
//         console.error("Failed to fetch product:", err)
//         setError("Product not found or unavailable")
//       }
//     }

//     if (product_id) fetchProduct()
//   }, [product_id])

//   if (error) {
//     return <div className="p-4 text-red-600 text-center">{error}</div>
//   }

//   if (!product) {
//     return <div className="p-4 text-gray-600 text-center">Loading product details...</div>
//   }

//   return (
//     <div className="max-w-xl mx-auto p-6">
//       <h1 className="text-2xl font-semibold mb-2">{product.title}</h1>
//       <p className="text-gray-700 mb-4">{product.description}</p>

//       {/* For debug: Remove later */}
//       <pre className="text-xs bg-gray-100 p-2 rounded">{JSON.stringify(product, null, 2)}</pre>
//     </div>
//   )
// }
