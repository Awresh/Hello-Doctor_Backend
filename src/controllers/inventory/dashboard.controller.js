import { Op } from "sequelize";
import { Product } from "../../models/inventory/product.model.js";
import { SalesBill } from "../../models/inventory/sales-bill.model.js";
import { PurchaseBill } from "../../models/inventory/purchase-bill.model.js";
import { Customer } from "../../models/inventory/customer.model.js";
import { Supplier } from "../../models/inventory/supplier.model.js";
import { sendResponse } from "../../utils/response.util.js";
import { STATUS_CODES } from "../../config/statusCodes.js";
import { MESSAGES } from "../../config/serverConfig.js";

export const getDashboardStats = async (req, res) => {
    try {
        const tenant = req.tenant;
        const tenantId = tenant ? tenant.id : null;
        if (!tenantId) {
            return sendResponse(res, { statusCode: STATUS_CODES.UNAUTHORIZED, message: "Tenant not found" });
        }

        const { period } = req.query; // Today, Yesterday, Month, Custom
        // For Custom, we'd need startDate and endDate in query as well, but keeping it simple for now based on options.

        let dateFilter = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (period === 'Today') {
            dateFilter = {
                [Op.gte]: today
            };
        } else if (period === 'Yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayEnd = new Date(today); // Today start is yesterday end
            dateFilter = {
                [Op.gte]: yesterday,
                [Op.lt]: yesterdayEnd
            };
        } else if (period === 'Month') {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            dateFilter = {
                [Op.gte]: startOfMonth
            };
        }
        // Add more cases or custom range handling if needed

        // 1. Report Data
        // Total Sales
        const salesBills = await SalesBill.findAll({
            where: {
                tenantId,
                status: { [Op.ne]: 'Cancelled' }, // Exclude cancelled
                createdAt: dateFilter
            }
        });
        const totalSales = salesBills.reduce((sum, bill) => sum + (bill.pricing?.grandTotal || 0), 0);

        // Total Purchases
        const purchaseBills = await PurchaseBill.findAll({
            where: {
                tenantId,
                status: { [Op.ne]: 'cancelled' },
                createdAt: dateFilter // Using createdAt for simplicity, or purchaseDate
            }
        });
        const totalPurchases = purchaseBills.reduce((sum, bill) => sum + (Number(bill.totalAmount) || 0), 0);

        // Total Profit (Simplified: Sales - Purchases)
        // Note: Real profit calc is more complex (COGS), but requirement implies simple dashboard stats for now.
        const totalProfit = totalSales - totalPurchases;

        // 2. Product Data (Counts) - usually total counts, not filtered by date unless requested (usually dashboard shows current total stats)
        const productCount = await Product.count({ where: { tenantId, status: 'Active' } });
        const customerCount = await Customer.count({ where: { tenantId } });
        const supplierCount = await Supplier.count({ where: { tenantId } });
        // Services/Employees might need other models or logic if they exist, passing 0/placeholders if not available in current context or need more info.
        // Assuming Service might be a type of Product or separate. For now, let's look for Service model or category? 
        // Based on file list, no explicit Service model in inventory, maybe category based?
        // Leaving Services/Employees as placeholders or simple counts if easy.

        // 3. Low Stock
        const lowStockItems = await Product.findAll({
            where: {
                tenantId,
                stockStatus: { [Op.in]: ['Low Stock', 'Out of Stock'] }, // 'Critical' isn't in ENUM (Active, Inactive, Archived) or stockStatus (In Stock, Out of Stock, Low Stock)
                // Note: file 'product.model.js' has stockStatus enum: 'In Stock', 'Out of Stock', 'Low Stock'
            },
            limit: 5,
            order: [['updatedAt', 'DESC']]
        });

        const formattedLowStock = lowStockItems.map(p => ({
            sku: p.sku,
            product: p.name,
            stock: p.globalStock, // or storeAllocations check
            status: p.stockStatus === 'Out of Stock' ? 'Critical' : 'Low' // Mapping for UI
        }));

        // 4. Items List (Recent products)
        const recentProducts = await Product.findAll({
            where: { tenantId },
            limit: 10,
            order: [['createdAt', 'DESC']]
        });

        const formattedItemsList = recentProducts.map(p => ({
            recordId: p.id,
            name: p.name,
            quantity: p.globalStock,
            sku: p.sku,
            date: p.createdAt,
            status: p.stockStatus === 'In Stock' ? 'inStock' : 'lowStock' // UI exptects camelCase values likely
        }));

        // 5. Top Selling (Global - All Time)
        // Aggregating from all sales bills to find top selling products based on quantity
        const allSalesBills = await SalesBill.findAll({
            where: {
                tenantId,
                status: { [Op.ne]: 'Cancelled' }
            },
            attributes: ['items'] // Only fetch items for performance
        });

        const productSalesMap = {};
        const productIdsForCost = new Set();

        allSalesBills.forEach(bill => {
            if (Array.isArray(bill.items)) {
                bill.items.forEach(item => {
                    const pId = item.productId || item.id;
                    if (pId) productIdsForCost.add(pId);
                });
            }
        });

        // Fetch buy prices for all sold products
        const productsForCost = await Product.findAll({
            where: { id: Array.from(productIdsForCost) },
            attributes: ['id', 'buyPrice', 'name', 'globalStock']
        });

        const productCostMap = new Map(productsForCost.map(p => [p.id, p]));

        let totalCOGS = 0;

        allSalesBills.forEach(bill => {
            if (Array.isArray(bill.items)) {
                bill.items.forEach(item => {
                    const pId = item.productId || item.id;
                    if (pId) {
                        // Top Selling Calculation
                        if (!productSalesMap[pId]) {
                            // Try to get name from Map first (live data), else item name
                            const pData = productCostMap.get(pId);
                            productSalesMap[pId] = {
                                id: pId,
                                name: pData ? pData.name : (item.name || 'Unknown Product'),
                                count: 0,
                                totalRevenue: 0
                            };
                        }
                        productSalesMap[pId].count += (Number(item.quantity) || 0);
                        productSalesMap[pId].totalRevenue += (Number(item.total) || 0);

                        // Profit Calculation (COGS)
                        // Use item.buyPrice if available (snapshot), else fallback to current product buyPrice
                        const itemBuyPrice = Number(item.buyPrice) || Number(productCostMap.get(pId)?.buyPrice) || 0;
                        const itemQuantity = Number(item.quantity) || 0;
                        totalCOGS += (itemBuyPrice * itemQuantity);
                    }
                });
            }
        });

        // Real Profit = Total Sales Revenue - Cost of Goods Sold
        const calculatedProfit = totalSales - totalCOGS;

        // Total Profit (Net)
        // If profit is positive, show in Profit. If negative, show in Net Loss.
        const finalProfit = calculatedProfit > 0 ? calculatedProfit : 0;
        const finalLoss = calculatedProfit < 0 ? Math.abs(calculatedProfit) : 0;

        // Convert map to array and sort by count desc
        const sortedTopSelling = Object.values(productSalesMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Start with top 5

        // Fetch product names since sales bill items might have stale/incomplete data
        const topProductIds = sortedTopSelling.map(i => i.id);
        const topProducts = await Product.findAll({
            where: { id: topProductIds },
            attributes: ['id', 'name', 'globalStock']
        });
        const productMap = new Map(topProducts.map(p => [p.id, p]));

        // formatted top selling
        const formattedTopSelling = sortedTopSelling.map((p, index) => {
            const productInfo = productMap.get(p.id);
            const currentStock = productInfo ? (productInfo.globalStock || 0) : 0;
            const totalVolume = p.count + currentStock;
            const percentage = totalVolume > 0 ? Math.round((p.count / totalVolume) * 100) : 0;

            return {
                rank: index + 1,
                brand: productInfo ? productInfo.name : p.name,
                sales: `₹${p.totalRevenue.toLocaleString()}`,
                count: p.count,
                stock: currentStock,
                percentage: percentage
            };
        });

        const responseData = {
            reportData: [
                { title: "Total Sales", value: totalSales, icon: "ti-trending-up", color: "#3B82F6" },
                // { title: "Total Expenses", value: 0, icon: "ti-wallet", color: "#F59E0B" }, // Placeholder as no Expense model exists yet
                { title: "Total Purchases", value: totalPurchases, icon: "ti-shopping-cart", color: "#F59E0B" },
                { title: "Total Profit", value: finalProfit, icon: "ti-chart-line", color: "#10B981" },
                { title: "Net Loss", value: finalLoss, icon: "ti-chart-pie", color: "#DC2626" },
            ],
            productData: [
                { title: "Products", value: productCount, icon: "ti-brand-databricks" },
                { title: "Patients", value: customerCount, icon: "ti-building-hospital" },
                { title: "Suppliers", value: supplierCount, icon: "ti-device-tablet-plus" },
                // Services/Employees placeholders
            ],
            lowStockItems: formattedLowStock,
            itemsList: formattedItemsList,
            topSellingProducts: formattedTopSelling
        };

        return sendResponse(res, { statusCode: STATUS_CODES.OK, message: "Dashboard stats fetched", data: responseData });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return sendResponse(res, { statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR, message: MESSAGES.INTERNAL_SERVER_ERROR, data: error.message });
    }
};
