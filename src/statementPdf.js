import jsPDF from 'jspdf';
import { plural } from './units';

// jsPDF's built-in fonts use WinAnsi encoding, which has no rupee glyph (U+20B9),
// so amounts are prefixed with "Rs." rather than "₹".
const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const qtyText = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const dateText = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const RIGHT = PAGE_W - MARGIN;
const BOTTOM = PAGE_H - 18;

const ORDER_COLS = [
    { key: 'sno', label: 'S.No', x: MARGIN, align: 'left', width: 12 },
    { key: 'date', label: 'Date', x: MARGIN + 12, align: 'left', width: 26 },
    { key: 'material', label: 'Material', x: MARGIN + 38, align: 'left', width: 46 },
    { key: 'qty', label: 'Quantity', x: MARGIN + 112, align: 'right' },
    { key: 'rate', label: 'Rate', x: MARGIN + 143, align: 'right' },
    { key: 'amount', label: 'Amount', x: RIGHT, align: 'right' }
];

const PAYMENT_COLS = [
    { key: 'sno', label: 'S.No', x: MARGIN, align: 'left', width: 12 },
    { key: 'date', label: 'Date', x: MARGIN + 12, align: 'left', width: 40 },
    { key: 'amount', label: 'Amount Paid', x: RIGHT, align: 'right' }
];

const truncate = (doc, text, width) => {
    if (!width) return text;
    let value = String(text ?? '');
    if (doc.getTextWidth(value) <= width) return value;
    while (value.length > 1 && doc.getTextWidth(`${value}…`) > width) {
        value = value.slice(0, -1);
    }
    return `${value}…`;
};

const drawCell = (doc, col, value) => {
    const text = truncate(doc, value, col.width);
    doc.text(text, col.x, doc.__y, col.align === 'right' ? { align: 'right' } : undefined);
};

const drawPageFurniture = (doc, profile, pageNo) => {
    // Blue banner
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, PAGE_W, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('BillDesk', MARGIN, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Account Statement', MARGIN, 19);
    doc.text(profile.name, RIGHT, 12, { align: 'right' });
    doc.setFontSize(8);
    doc.text(`Generated ${dateText(new Date())}`, RIGHT, 19, { align: 'right' });

    // Footer
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text('BillDesk — Account Statement', MARGIN, PAGE_H - 10);
    doc.text(`Page ${pageNo}`, RIGHT, PAGE_H - 10, { align: 'right' });

    doc.setTextColor(15, 23, 42);
};

const sectionTitle = (doc, title) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title, MARGIN, doc.__y);
    doc.__y += 2;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, doc.__y, RIGHT, doc.__y);
    doc.__y += 6;
};

const tableHeader = (doc, cols) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(MARGIN, doc.__y - 4.4, RIGHT - MARGIN, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    cols.forEach(col => drawCell(doc, col, col.label));

    doc.__y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
};

// Starts a new page when the next row would cross the bottom margin.
const ensureSpace = (doc, profile, needed, cols) => {
    if (doc.__y + needed <= BOTTOM) return;
    doc.addPage();
    doc.__page += 1;
    drawPageFurniture(doc, profile, doc.__page);
    doc.__y = 38;
    if (cols) tableHeader(doc, cols);
};

const summaryRow = (doc, boxes) => {
    const gap = 4;
    const boxW = (RIGHT - MARGIN - gap * (boxes.length - 1)) / boxes.length;

    boxes.forEach((box, i) => {
        const x = MARGIN + i * (boxW + gap);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, doc.__y, boxW, 16, 2, 2, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(box.label.toUpperCase(), x + 4, doc.__y + 6);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...(box.color || [15, 23, 42]));
        doc.text(truncate(doc, box.value, boxW - 8), x + 4, doc.__y + 12.5);
    });

    doc.__y += 27;
    doc.setTextColor(15, 23, 42);
};

export const buildStatement = (profile) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.__page = 1;
    doc.__y = 38;
    drawPageFurniture(doc, profile, 1);

    // ---- Account holder -------------------------------------------------
    sectionTitle(doc, 'Account Details');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Name', MARGIN, doc.__y);
    doc.text('Type', MARGIN + 60, doc.__y);
    doc.text('Phone', MARGIN + 110, doc.__y);

    doc.__y += 5.5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(truncate(doc, profile.name, 55), MARGIN, doc.__y);
    doc.text(profile.type || '—', MARGIN + 60, doc.__y);
    doc.text(profile.phone || '—', MARGIN + 110, doc.__y);
    doc.__y += 10;

    // ---- Money summary --------------------------------------------------
    summaryRow(doc, [
        { label: 'Total Amount', value: money(profile.totalAmount) },
        { label: 'Total Paid', value: money(profile.paid), color: [21, 128, 61] },
        { label: 'Balance Due', value: money(Math.max(0, profile.balance)), color: [220, 38, 38] }
    ]);

    // ---- Materials supplied ---------------------------------------------
    if (profile.materials.length > 0) {
        ensureSpace(doc, profile, 20);
        sectionTitle(doc, 'Materials Supplied');

        doc.setFontSize(9);
        profile.materials.forEach((m) => {
            ensureSpace(doc, profile, 7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 65, 85);
            doc.text(truncate(doc, m.name, 100), MARGIN, doc.__y);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(`${qtyText(m.quantity)} ${plural(m.unit).toLowerCase()}`, RIGHT, doc.__y, { align: 'right' });
            doc.__y += 6;
        });
        doc.__y += 5;
    }

    // ---- Orders ----------------------------------------------------------
    ensureSpace(doc, profile, 26);
    sectionTitle(doc, `Order Details (${profile.orders.length})`);
    tableHeader(doc, ORDER_COLS);

    profile.orders.forEach((o, i) => {
        ensureSpace(doc, profile, 7, ORDER_COLS);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        drawCell(doc, ORDER_COLS[0], String(i + 1));
        drawCell(doc, ORDER_COLS[1], dateText(o.date));
        drawCell(doc, ORDER_COLS[2], o.materialName || '—');
        drawCell(doc, ORDER_COLS[3], `${qtyText(o.quantity)} ${plural(o.materialUnit).toLowerCase()}`);
        drawCell(doc, ORDER_COLS[4], money(o.pricePerUnit));

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        drawCell(doc, ORDER_COLS[5], money(o.totalAmount));

        doc.__y += 2;
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.2);
        doc.line(MARGIN, doc.__y, RIGHT, doc.__y);
        doc.__y += 5;
    });

    ensureSpace(doc, profile, 12);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, doc.__y - 2, RIGHT, doc.__y - 2);
    doc.__y += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('TOTAL BILLED', MARGIN, doc.__y);
    doc.text(money(profile.totalAmount), RIGHT, doc.__y, { align: 'right' });
    doc.__y += 12;

    // ---- Payments --------------------------------------------------------
    ensureSpace(doc, profile, 26);
    sectionTitle(doc, `Payment Details (${profile.payments.length})`);

    if (profile.payments.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text('No payments recorded yet.', MARGIN, doc.__y);
        doc.__y += 10;
    } else {
        tableHeader(doc, PAYMENT_COLS);

        profile.payments.forEach((p, i) => {
            ensureSpace(doc, profile, 7, PAYMENT_COLS);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(51, 65, 85);
            drawCell(doc, PAYMENT_COLS[0], String(i + 1));
            drawCell(doc, PAYMENT_COLS[1], dateText(p.date));

            doc.setFont('helvetica', 'bold');
            doc.setTextColor(21, 128, 61);
            drawCell(doc, PAYMENT_COLS[2], money(p.amount));

            doc.__y += 2;
            doc.setDrawColor(241, 245, 249);
            doc.setLineWidth(0.2);
            doc.line(MARGIN, doc.__y, RIGHT, doc.__y);
            doc.__y += 5;
        });

        ensureSpace(doc, profile, 12);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.5);
        doc.line(MARGIN, doc.__y - 2, RIGHT, doc.__y - 2);
        doc.__y += 3;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text('TOTAL PAID', MARGIN, doc.__y);
        doc.setTextColor(21, 128, 61);
        doc.text(money(profile.paid), RIGHT, doc.__y, { align: 'right' });
        doc.__y += 12;
    }

    // ---- Closing balance -------------------------------------------------
    ensureSpace(doc, profile, 22);
    const settled = profile.balance <= 0;
    doc.setFillColor(...(settled ? [240, 253, 244] : [254, 242, 242]));
    doc.setDrawColor(...(settled ? [187, 247, 208] : [254, 202, 202]));
    doc.setLineWidth(0.4);
    doc.roundedRect(MARGIN, doc.__y, RIGHT - MARGIN, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...(settled ? [21, 128, 61] : [185, 28, 28]));
    doc.text(settled ? 'FULLY SETTLED' : 'BALANCE DUE', MARGIN + 5, doc.__y + 10);
    doc.setFontSize(13);
    doc.text(money(Math.max(0, profile.balance)), RIGHT - 5, doc.__y + 10.5, { align: 'right' });

    return doc;
};

export const downloadStatement = (profile) => {
    const doc = buildStatement(profile);
    const safeName = (profile.name || 'statement').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
    doc.save(`Statement_${safeName}.pdf`);
};
