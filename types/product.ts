export interface Product {
  id: number;
  name: string;
  type: string;
}

export const processProducts = (products: any[]): Product[] => {
  return products.map((product: any) => ({
    id: product.product_id,
    name: product.product_name,
    type: product.product_type,
  }));
};
