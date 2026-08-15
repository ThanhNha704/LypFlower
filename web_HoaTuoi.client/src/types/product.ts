// src/types/product.ts

export interface ProductImage {
    id: number
    url: string
    altText?: string
    sortOrder: number
}

export interface Category {
    id: number
    name: string
    slug: string
    description?: string
    imageUrl?: string
    icon?: string
    sortOrder: number
    productCount: number
}

/** Hiển thị trong Product Grid / Card */
export interface ProductCard {
    id: number
    name: string
    slug: string

    mainImageUrl: string

    price: number
    salePrice?: number
    isOnSale: boolean

    flowerType?: string
    color?: string
    occasion?: string

    soldCount: number

    averageRating?: number
    reviewCount: number

    createdAt?: string
}

/** Trang chi tiết sản phẩm */
export interface ProductDetail extends ProductCard {

    description: string

    subImages: ProductImage[]

    stock: number

    bouquetSize?: string

    weightKg?: number

    category: Category

    bundledProducts: ProductCard[]

    latestReviews: Review[]
}

export interface Review {
    id: number

    userName: string

    userAvatarUrl?: string

    rating: number

    comment: string

    imageUrls: string[]

    adminReply?: string

    createdAt: string
}

/** Bộ lọc sản phẩm */
export interface ProductFilterParams {

    categoryId?: number

    categorySlug?: string

    q?: string

    flowerType?: string

    occasion?: string

    color?: string

    minPrice?: number

    maxPrice?: number

    sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'best_seller'

    page?: number

    pageSize?: number
}

export interface PaginatedProducts {

    total: number

    page: number

    pageSize: number

    items: ProductCard[]
}