import { ProductRepository } from "../repositories/product.repository.js";

export class ProductService {
    constructor() {
        this.productRepository = new ProductRepository();
    }

    async getAllProducts(tenantId, storeData) {
        const whereClause = { tenantId, type: 'Product' };
        const products = await this.productRepository.findAll(whereClause, this.productRepository.getIncludes());

        return products.map(product => this.formatProduct(product, storeData)).filter(p => p !== null);
    }

    formatProduct(product, storeData) {
        const productObj = product.toJSON();
        const distributedStock = Array.isArray(productObj.storeAllocations)
            ? productObj.storeAllocations.reduce((acc, curr) => acc + (curr.stock || 0), 0)
            : 0;
        productObj.totalStock = (productObj.globalStock || 0) + distributedStock;

        if (storeData) {
            const allocation = productObj.storeAllocations?.find(sa => sa.storeId == storeData.id);
            if (!allocation) return null;

            productObj.stock = allocation.stock || 0;
            const isStoreProduct = product.storeId == storeData.id;
            if (allocation.sellingPrice) productObj.sellingPrice = allocation.sellingPrice || 0;

            const storeMinStock = allocation.minStock || productObj.minStock || 10;
            productObj.stockStatus = allocation.stock <= 0 ? 'Out of Stock' 
                : allocation.stock <= storeMinStock ? 'Low Stock' : 'In Stock';

            delete productObj.storeAllocations;
            delete productObj.globalStock;

            return { ...productObj, showAction_Edit: isStoreProduct, showAction_View: isStoreProduct, 
                showAction_Delete: isStoreProduct, showAction_Toggle: isStoreProduct };
        }

        return { ...productObj, showAction_Edit: true, showAction_View: true, 
            showAction_Delete: true, showAction_Toggle: true };
    }

    async getProductById(id) {
        const product = await this.productRepository.findById(id, this.productRepository.getIncludes());
        if (!product) throw { statusCode: 404, message: "Product not found" };
        return product;
    }

    async createProduct(data, tenantId, storeData) {
        let { name, categoryId, brandId, unitId, supplierId, isActive, buyPrice, sellingPrice, 
            sku, status, globalStock, storeAllocations, stock = 0, minStock, gstRate, gstType } = data;

        const storeId = storeData?.id;
        if (storeData) {
            storeAllocations = [{
                storeId, stock: stock == 0 ? globalStock : stock, sellingPrice, buyPrice,
                minStock: minStock || 5, isActive: true
            }];
        }

        const currentStock = storeData ? (stock || 0) : (globalStock || 0);
        const currentMinStock = minStock || 10;
        const stockStatus = currentStock <= 0 ? 'Out of Stock' 
            : currentStock <= currentMinStock ? 'Low Stock' : 'In Stock';

        return await this.productRepository.create({
            tenantId, name, categoryId, brandId, unitId, supplierId, isActive, buyPrice,
            sellingPrice, minStock, sku, status, storeId, stockStatus, gstRate, gstType,
            globalStock: globalStock || 0, storeAllocations: storeAllocations || []
        });
    }

    async updateProduct(id, updates) {
        const [count] = await this.productRepository.update(id, updates);
        if (count === 0) throw { statusCode: 404, message: "Product not found" };
        return await this.productRepository.findById(id, []);
    }

    async deleteProduct(id) {
        const count = await this.productRepository.delete(id);
        if (count === 0) throw { statusCode: 404, message: "Product not found" };
    }

    async toggleProductStatus(id, status) {
        const [count] = await this.productRepository.updateStatus(id, status);
        if (count === 0) throw { statusCode: 404, message: "Product not found" };
        return await this.productRepository.findById(id, []);
    }
}
