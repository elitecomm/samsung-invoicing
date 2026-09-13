import PDFDocument from "pdfkit";
import type { InvoiceWithItems } from "@/lib/types";

const SERVICE_CENTER = {
  name: "Samsung Service Center",
  company: "Elite Communication",
  address: "B-20/44, A-7, Bhelupur, (Besides Hotel Diamond), Varanasi - 221010",
  contact: "9569894030, 9026723192",
  email: "elitecom2020.vns@gmail.com",
  gstNo: "09AFMPS0091NIZR",
};

const TERMS = [
  "The customer should be satisfied with the repairs done & performance of the product at the time of making the payment.",
  "Repair warranty only for the problem repaired - as mentioned in invoice.",
  "In case of any clarifications or discrepancies, please contact the manager of the service center.",
  "All payments would be collected in cash / UPI / card as applicable.",
  "All disputes are subject to Varanasi jurisdiction only.",
  "Advance payment for any order placed will not be refunded.",
  "E. & O.E.",
  "Device must be collected within 30 days of completion of repair. After 30 days, no responsibility for the device will be taken.",
];

export async function generateInvoicePDF(invoice: InvoiceWithItems): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      bufferPages: true,
      info: {
        Title: `Invoice ${invoice.invoiceNo}`,
        Author: SERVICE_CENTER.company,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const pageMargin = 40;
    const contentWidth = pageWidth - pageMargin * 2;

    // Header (Changed from blue #1428a0 to clean light gray #f3f4f6 with dark text)
    doc.rect(0, 0, pageWidth, 100).fill("#f3f4f6");
    doc.fillColor("#111827").fontSize(26).font("Helvetica-Bold")
      .text("TAX INVOICE", pageMargin, 25, { width: contentWidth, align: "center" });
    doc.fontSize(16).font("Helvetica")
      .text(SERVICE_CENTER.name, pageMargin, 55, { width: contentWidth, align: "center" });
    doc.fontSize(10)
      .text(SERVICE_CENTER.company, pageMargin, 75, { width: contentWidth, align: "center" });

    // Company details box
    let y = 115;
    doc.fillColor("#333333").fontSize(11).font("Helvetica-Bold")
      .text("From:", pageMargin, y);
    doc.font("Helvetica").fontSize(10)
      .text(SERVICE_CENTER.company, pageMargin, y + 15)
      .text(SERVICE_CENTER.address, pageMargin, y + 30, { width: contentWidth / 2 })
      .text(`Contact: ${SERVICE_CENTER.contact}`, pageMargin, y + 55)
      .text(`Email: ${SERVICE_CENTER.email}`, pageMargin, y + 70)
      .text(`GSTIN: ${SERVICE_CENTER.gstNo}`, pageMargin, y + 85);

    // Invoice details box on the right
    const rightX = pageWidth / 2 + 10;
    doc.font("Helvetica-Bold").fontSize(11)
      .text("Invoice Details:", rightX, y);
    doc.font("Helvetica").fontSize(10)
      .text(`Invoice No: ${invoice.invoiceNo}`, rightX, y + 15)
      .text(`Date: ${new Date(invoice.date).toLocaleString("en-IN")}`, rightX, y + 30)
      .text(`Job No: ${invoice.jobNo}`, rightX, y + 45)
      .text(`Status: ${invoice.jobStatus.replace("_", " ").toUpperCase()}`, rightX, y + 60)
      .text(`Payment: ${invoice.paymentStatus.toUpperCase()}`, rightX, y + 75);

    y += 110;
    doc.moveTo(pageMargin, y).lineTo(pageWidth - pageMargin, y).strokeColor("#cccccc").lineWidth(1).stroke();
    y += 15;

    // Customer info
    doc.font("Helvetica-Bold").fontSize(11).text("Bill To:", pageMargin, y);
    doc.font("Helvetica").fontSize(10)
      .text(invoice.customerName, pageMargin, y + 15)
      .text(`Mobile: ${invoice.mobile}`, pageMargin, y + 30);
    if (invoice.deviceModel) {
      doc.text(`Device: ${invoice.deviceModel}`, pageMargin, y + 45);
    }

    const rightInfoY = y;
    doc.font("Helvetica-Bold").fontSize(11).text("Device Info:", rightX, rightInfoY);
    doc.font("Helvetica").fontSize(10);
    let rightInfoOffset = 15;
    if (invoice.serialNo) {
      doc.text(`Serial/IMEI: ${invoice.serialNo}${invoice.imei ? " / " + invoice.imei : ""}`, rightX, rightInfoY + rightInfoOffset);
      rightInfoOffset += 15;
    }
    if (invoice.problem) {
      doc.text(`Problem: ${invoice.problem}`, rightX, rightInfoY + rightInfoOffset, { width: contentWidth / 2 - 20 });
      rightInfoOffset += 30;
    }
    if (invoice.technicianName) {
      doc.text(`Technician: ${invoice.technicianName}`, rightX, rightInfoY + rightInfoOffset);
    }

    y += Math.max(70, rightInfoOffset + 10);
    doc.moveTo(pageMargin, y).lineTo(pageWidth - pageMargin, y).strokeColor("#dddddd").lineWidth(0.5).stroke();
    y += 15;

    // Fixed Table Columns (Adjusted widths so Amount column stays within margins)
    const colSno = pageMargin;
    const colDesc = pageMargin + 35;
    const colQty = pageMargin + 280;
    const colRate = pageMargin + 335;
    const colAmount = pageMargin + 420;

    // Table Header (Light gray fill instead of blue)
    doc.rect(pageMargin, y, contentWidth, 22).fill("#f3f4f6");
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(10);
    doc.text("S.No", colSno + 5, y + 6, { width: 30 });
    doc.text("Description", colDesc, y + 6, { width: 235 });
    doc.text("Qty", colQty, y + 6, { width: 45, align: "center" });
    doc.text("Rate", colRate, y + 6, { width: 75, align: "right" });
    doc.text("Amount", colAmount, y + 6, { width: 75, align: "right" });
    y += 25;

    // Items
    const items = invoice.items && invoice.items.length > 0
      ? invoice.items
      : [{ description: "Service Charge", quantity: 1, rate: invoice.serviceCharge, amount: invoice.serviceCharge }];

    doc.fillColor("#333333").font("Helvetica").fontSize(10);
    items.forEach((item, idx) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      const rowH = 20;
      if (idx % 2 === 0) {
        doc.rect(pageMargin, y - 3, contentWidth, rowH).fill("#f9fafb");
        doc.fillColor("#333333");
      }
      doc.text(String(idx + 1), colSno + 5, y + 2, { width: 30 });
      doc.text(item.description, colDesc, y + 2, { width: 235 });
      doc.text(String(item.quantity), colQty, y + 2, { width: 45, align: "center" });
      doc.text(`₹${Number(item.rate).toFixed(2)}`, colRate, y + 2, { width: 75, align: "right" });
      doc.text(`₹${Number(item.amount).toFixed(2)}`, colAmount, y + 2, { width: 75, align: "right" });
      y += rowH;
    });

    y += 10;
    doc.moveTo(pageMargin, y).lineTo(pageWidth - pageMargin, y).strokeColor("#dddddd").lineWidth(0.5).stroke();
    y += 15;

    // Totals (right-aligned box)
    const totalsX = pageWidth - 250;
    const totalsW = 210;

    const drawTotalsRow = (label: string, value: string, bold = false) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(10);
      doc.fillColor("#333333").text(label, totalsX, y, { width: totalsW - 70 });
      doc.text(value, totalsX + totalsW - 70, y, { width: 70, align: "right" });
      y += 18;
    };

    drawTotalsRow("Subtotal:", `₹${Number(invoice.subtotal).toFixed(2)}`);
    drawTotalsRow("Service Charge:", `₹${Number(invoice.serviceCharge).toFixed(2)}`);
    drawTotalsRow(`Tax (${invoice.taxRate}%):`, `₹${Number(invoice.taxAmount).toFixed(2)}`);
    if (Number(invoice.discount) > 0) {
      drawTotalsRow("Discount:", `-₹${Number(invoice.discount).toFixed(2)}`);
    }
    
    y += 2;
    doc.moveTo(totalsX, y).lineTo(totalsX + totalsW, y).strokeColor("#666666").lineWidth(1).stroke();
    y += 5;
    drawTotalsRow("TOTAL:", `₹${Number(invoice.total).toFixed(2)}`, true);
    drawTotalsRow("Paid:", `₹${Number(invoice.paid).toFixed(2)}`);
    drawTotalsRow("BALANCE:", `₹${Number(invoice.balance).toFixed(2)}`, true);

    // Amount in words
    y += 5;
    doc.font("Helvetica-Oblique").fontSize(9).fillColor("#555555")
      .text(`Amount in words: ${numberToWords(Math.round(Number(invoice.total)))} Rupees Only`, pageMargin, y, { width: contentWidth });
    y += 25;

    // Warranty info
    if (invoice.warrantyDays) {
      doc.fillColor("#111827").font("Helvetica-Bold").fontSize(10)
        .text(`✓ Repair Warranty: ${invoice.warrantyDays} days from date of invoice`, pageMargin, y);
      if (invoice.warrantyExpiry) {
        doc.fillColor("#555555").font("Helvetica").fontSize(9)
          .text(`Warranty valid till: ${new Date(invoice.warrantyExpiry).toLocaleDateString("en-IN")}`, pageMargin, y + 14);
      }
      y += 30;
    }

    // Notes
    if (invoice.notes) {
      doc.fillColor("#333333").font("Helvetica-Bold").fontSize(10).text("Notes:", pageMargin, y);
      doc.font("Helvetica").fontSize(9).text(invoice.notes, pageMargin, y + 14, { width: contentWidth });
      y += 40;
    }

    // Terms
    y = Math.max(y, doc.y + 20);
    if (y > 680) {
      doc.addPage();
      y = 50;
    }
    doc.moveTo(pageMargin, y).lineTo(pageWidth - pageMargin, y).strokeColor("#dddddd").lineWidth(0.5).stroke();
    y += 15;

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#333333")
      .text("Terms & Conditions:", pageMargin, y);
    y += 15;
    doc.font("Helvetica").fontSize(8).fillColor("#555555");
    TERMS.forEach((term, idx) => {
      if (y > 760) {
        doc.addPage();
        y = 50;
      }
      doc.text(`${idx + 1}. ${term}`, pageMargin + 5, y, { width: contentWidth * 0.65 });
      y += 11;
    });

    // Signature
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#333333")
      .text("For Elite Communication", pageWidth - 180, 680, { width: 140, align: "center" });
    doc.moveTo(pageWidth - 180, 740).lineTo(pageWidth - 40, 740).strokeColor("#333333").lineWidth(1).stroke();
    doc.fontSize(9).text("Authorized Signatory", pageWidth - 180, 745, { width: 140, align: "center" });

    // Footer
    const footerY = doc.page.height - 30;
    doc.fillColor("#999999").fontSize(8)
      .text(`Generated on ${new Date().toLocaleString("en-IN")}`, pageMargin, footerY, { width: contentWidth, align: "center" });

    doc.end();
  });
}

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  };

  return convert(num);
}