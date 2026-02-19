import PDFDocument from 'pdfkit';

/**
 * Generates a PDF buffer for a sales bill.
 * 
 * @param {Object} billData - The bill details (billNumber, customer, items, pricing, storeName, etc.)
 * @returns {Promise<Buffer>} - Buffer containing the PDF data
 */
export const generateSalesBillPDF = async (billData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('error', reject);
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Layout constants
            const leftAlign = 50;
            const rightAlign = 545;
            const col1 = 50;  // Item
            const col2 = 280; // Qty
            const col3 = 330; // Rate
            const col4 = 410; // GST %
            const col5 = 480; // Amount
            
            // --- Header Section ---
            doc.fillColor('#111827').font('Helvetica-Bold').fontSize(22)
               .text(billData.storeName || 'INVOICE', leftAlign, 50);
            
            doc.fontSize(10).font('Helvetica').fillColor('#6b7280')
               .text('TAX INVOICE', 400, 50, { align: 'right', width: 145 });
            
            doc.moveTo(leftAlign, 85).lineTo(rightAlign + 50, 85).strokeColor('#e5e7eb').stroke();

            // --- Info Section ---
            const infoY = 110;
            
            // Left: Bill Info
            doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9).text('BILL DETAILS', col1, infoY);
            doc.font('Helvetica').fillColor('#374151').text(`Invoice No: ${billData.billNumber}`, col1, infoY + 15);
            doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, col1, infoY + 28);

            // Right: Customer Details
            doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9).text('BILL TO', col3, infoY);
            doc.font('Helvetica').fillColor('#374151').text(billData.customer.name, col3, infoY + 15);
            if (billData.customer.phone) {
                doc.text(`Phone: ${billData.customer.phoneCountryCode || ''} ${billData.customer.phone}`, col3, infoY + 28);
            }
            if (billData.customer.email) {
                doc.text(`Email: ${billData.customer.email}`, col3, infoY + 41);
            }

            // --- Table Section ---
            const tableTop = 200;
            
            // Table Header 
            doc.rect(col1, tableTop, rightAlign - col1 + 50, 20).fill('#1e293b');
            
            doc.fillColor('white').font('Helvetica-Bold').fontSize(9);
            doc.text('Item Description', col1 + 5, tableTop + 6);
            doc.text('Qty', col2, tableTop + 6, { width: 40, align: 'center' });
            doc.text('Rate', col3, tableTop + 6, { width: 70, align: 'right' });
            doc.text('GST %', col4, tableTop + 6, { width: 60, align: 'center' });
            doc.text('Amount', col5, tableTop + 6, { width: 70, align: 'right' });
            
            // Table Rows
            doc.fillColor('#374151').font('Helvetica').fontSize(9);
            let y = tableTop + 28;
            billData.items.forEach((item, index) => {
                if (index % 2 === 1) {
                    doc.rect(col1, y - 4, rightAlign - col1 + 50, 18).fill('#f8fafc');
                    doc.fillColor('#374151');
                }
                
                doc.text(item.productName, col1 + 5, y, { width: 210 });
                doc.text(item.quantity.toString(), col2, y, { width: 40, align: 'center' });
                doc.text(`${Number(item.unitPrice).toFixed(2)}`, col3, y, { width: 70, align: 'right' });
                doc.text(`${item.taxParcentage || 0}%`, col4, y, { width: 60, align: 'center' });
                doc.text(`${Number(item.total).toFixed(2)}`, col5, y, { width: 70, align: 'right' });
                y += 18;
            });

            doc.moveTo(leftAlign, y).lineTo(rightAlign + 50, y).strokeColor('#e5e7eb').stroke();
            y += 12;

            // --- Summary Section ---
            const totalX = 380;
            const valueX = 480;
            
            doc.fillColor('#64748b').font('Helvetica');
            doc.text('Subtotal:', totalX, y, { width: 100, align: 'right' });
            doc.text(`Rs. ${Number(billData.pricing.subtotal).toFixed(2)}`, valueX, y, { width: 80, align: 'right' });
            y += 15;
            
            if (billData.pricing.totalTax > 0) {
                const gstHalf = Number(billData.pricing.totalTax) / 2;
                doc.text('CGST:', totalX, y, { width: 100, align: 'right' });
                doc.text(`Rs. ${gstHalf.toFixed(2)}`, valueX, y, { width: 80, align: 'right' });
                y += 15;
                doc.text('SGST:', totalX, y, { width: 100, align: 'right' });
                doc.text(`Rs. ${gstHalf.toFixed(2)}`, valueX, y, { width: 80, align: 'right' });
                y += 15;
            }

            if (billData.pricing.discount > 0) {
                doc.text('Discount:', totalX, y, { width: 100, align: 'right' });
                doc.text(`-Rs. ${Number(billData.pricing.discount).toFixed(2)}`, valueX, y, { width: 80, align: 'right' });
                y += 15;
            }

            doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10);
            doc.text('Grand Total:', totalX, y, { width: 100, align: 'right' });
            doc.text(`Rs. ${Number(billData.pricing.grandTotal).toFixed(2)}`, valueX, y, { width: 80, align: 'right' });

            // --- Footer ---
            const footerY = 750;
            doc.moveTo(leftAlign, footerY).lineTo(rightAlign + 50, footerY).strokeColor('#f1f5f9').stroke();
            
            doc.fillColor('#94a3b8').fontSize(7).font('Helvetica-Oblique')
               .text('This is a computer generated document.', leftAlign, footerY + 10, { align: 'center', width: 512 });
            doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold')
               .text('Thank you for choosing us!', leftAlign, footerY + 22, { align: 'center', width: 512 });




            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};
