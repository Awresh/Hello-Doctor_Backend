import { Op } from "sequelize";
import { Product } from "../models/inventory/product.model.js";
import { SalesBill } from "../models/inventory/sales-bill.model.js";
import { PurchaseBill } from "../models/inventory/purchase-bill.model.js";
import { Customer } from "../models/inventory/customer.model.js";
import { Supplier } from "../models/inventory/supplier.model.js";

class DashboardService {
  getDateFilter(period) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (period === 'Today') {
      return { [Op.gte]: today };
    }
    
    if (period === 'Yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { [Op.gte]: yesterday, [Op.lt]: today };
    }
    
    if (period === 'Month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { [Op.gte]: startOfMonth };
    }
    
    return {};
  }

  async getSalesData(tenantId, dateFilter) {
    const salesBills = await SalesBill.findAll({
      where: { tenantId, status: { [Op.ne]: 'Cancelled' }, createdAt: dateFilter }
    });
    return salesBills.reduce((sum, bill) => sum + (bill.pricing?.grandTotal || 0), 0);
  }

  async getPurchasesData(tenantId, dateFilter) {
    const purchaseBills = await PurchaseBill.findAll({
      where: { tenantId, status: { [Op.ne]: 'cancelled' }, createdAt: dateFilter }
    });
    return purchaseBills.reduce((sum, bill) => sum + (Number(bill.totalAmount) || 0), 0);
  }

  async getEntityCounts(tenantId) {
    const [productCount, customerCount, supplierCount] = await Promise.all([
      Product.count({ where: { tenantId, status: 'Active' } }),
      Customer.count({ where: { tenantId } }),
      Supplier.count({ where: { tenantId } })
    ]);
    return { productCount, customerCount, supplierCount };
  }

  async getLowStockItems(tenantId) {
    const items = await Product.findAll({
      where: { tenantId, stockStatus: { [Op.in]: ['Low Stock', 'Out of Stock'] } },
      limit: 5,
      order: [['updatedAt', 'DESC']]
    });
    return items.map(p => ({
      sku: p.sku,
      product: p.name,
      stock: p.globalStock,
      status: p.stockStatus === 'Out of Stock' ? 'Critical' : 'Low'
    }));
  }

  async getRecentProducts(tenantId) {
    const products = await Product.findAll({
      where: { tenantId },
      limit: 10,
      order: [['createdAt', 'DESC']]
    });
    return products.map(p => ({
      recordId: p.id,
      name: p.name,
      quantity: p.globalStock,
      sku: p.sku,
      date: p.createdAt,
      status: p.stockStatus === 'In Stock' ? 'inStock' : 'lowStock'
    }));
  }

  async calculateProfitAndTopSelling(tenantId, totalSales) {
    const allSalesBills = await SalesBill.findAll({
      where: { tenantId, status: { [Op.ne]: 'Cancelled' } },
      attributes: ['items']
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
            if (!productSalesMap[pId]) {
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

            const itemBuyPrice = Number(item.buyPrice) || Number(productCostMap.get(pId)?.buyPrice) || 0;
            const itemQuantity = Number(item.quantity) || 0;
            totalCOGS += (itemBuyPrice * itemQuantity);
          }
        });
      }
    });

    const calculatedProfit = totalSales - totalCOGS;
    const finalProfit = calculatedProfit > 0 ? calculatedProfit : 0;
    const finalLoss = calculatedProfit < 0 ? Math.abs(calculatedProfit) : 0;

    const sortedTopSelling = Object.values(productSalesMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topProductIds = sortedTopSelling.map(i => i.id);
    const topProducts = await Product.findAll({
      where: { id: topProductIds },
      attributes: ['id', 'name', 'globalStock']
    });
    const productMap = new Map(topProducts.map(p => [p.id, p]));

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

    return { finalProfit, finalLoss, formattedTopSelling };
  }

  async getDashboardStats(tenantId, period) {
    const dateFilter = this.getDateFilter(period);
    
    const [totalSales, totalPurchases, counts, lowStockItems, recentProducts] = await Promise.all([
      this.getSalesData(tenantId, dateFilter),
      this.getPurchasesData(tenantId, dateFilter),
      this.getEntityCounts(tenantId),
      this.getLowStockItems(tenantId),
      this.getRecentProducts(tenantId)
    ]);

    const { finalProfit, finalLoss, formattedTopSelling } = await this.calculateProfitAndTopSelling(tenantId, totalSales);

    return {
      reportData: [
        { title: "Total Sales", value: totalSales, icon: "ti-trending-up", color: "#3B82F6" },
        { title: "Total Purchases", value: totalPurchases, icon: "ti-shopping-cart", color: "#F59E0B" },
        { title: "Total Profit", value: finalProfit, icon: "ti-chart-line", color: "#10B981" },
        { title: "Net Loss", value: finalLoss, icon: "ti-chart-pie", color: "#DC2626" }
      ],
      productData: [
        { title: "Products", value: counts.productCount, icon: "ti-brand-databricks" },
        { title: "Patients", value: counts.customerCount, icon: "ti-building-hospital" },
        { title: "Suppliers", value: counts.supplierCount, icon: "ti-device-tablet-plus" }
      ],
      lowStockItems,
      itemsList: recentProducts,
      topSellingProducts: formattedTopSelling
    };
  }
}

export default new DashboardService();
