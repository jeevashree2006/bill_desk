import React, { useRef, useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, ZoomIn, ZoomOut } from 'lucide-react';

const InvoicePreview = ({ invoice, autoDownload, onBack }) => {
    const invoiceRef = useRef();
    const [zoomLvl, setZoomLvl] = useState(() => {
        return window.innerWidth <= 768 ? Math.max(0.2, (window.innerWidth - 30) / 800) : 1;
    });

    const containerRef = useRef();

    useEffect(() => {
        if (autoDownload && invoiceRef.current) {
            setTimeout(() => {
                handleDownload();
            }, 300);
        }
    }, [autoDownload, invoice]);

    const handleDownload = async () => {
        const element = invoiceRef.current;
        const container = containerRef.current;

        // Temporarily clear the scale visual wrapper so html2canvas doesn't get confused
        const currentTransform = container.style.transform;
        container.style.transform = 'scale(1)';

        // Wait briefly for DOM to paint the unscaled version
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                logging: false,
                useCORS: true,
                windowWidth: 800 // force canvas width
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Invoice_${invoice.invoiceNo}.pdf`);
        } finally {
            // Restore visual layout scaling no matter what
            container.style.transform = currentTransform;
        }
    };

    const numberToWords = (num) => {
        // Simple implementation for demo
        const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
        const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

        const inWords = (n) => {
            if ((n = n.toString()).length > 9) return 'overflow';
            let nArray = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!nArray) return '';
            let str = '';
            str += (nArray[1] != 0) ? (a[Number(nArray[1])] || b[nArray[1][0]] + ' ' + a[nArray[1][1]]) + 'crore ' : '';
            str += (nArray[2] != 0) ? (a[Number(nArray[2])] || b[nArray[2][0]] + ' ' + a[nArray[2][1]]) + 'lakh ' : '';
            str += (nArray[3] != 0) ? (a[Number(nArray[3])] || b[nArray[3][0]] + ' ' + a[nArray[3][1]]) + 'thousand ' : '';
            str += (nArray[4] != 0) ? (a[Number(nArray[4])] || b[nArray[4][0]] + ' ' + a[nArray[4][1]]) + 'hundred ' : '';
            str += (nArray[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(nArray[5])] || b[nArray[5][0]] + ' ' + a[nArray[5][1]]) : '';
            return str;
        }

        const amount = Math.floor(num);
        const words = inWords(amount);
        return 'Rupees ' + words.charAt(0).toUpperCase() + words.slice(1) + ' Only';
    }

    return (
        <div>
            <div className="preview-header">
                {onBack && (
                    <button className="btn-secondary" onClick={onBack}>
                        Back
                    </button>
                )}
                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', marginRight: '15px' }}>
                    <button type="button" className="btn-secondary" style={{ padding: '0 8px' }} onClick={() => setZoomLvl(z => Math.max(z - 0.2, 0.4))} title="Zoom Out">
                        <ZoomOut size={18} />
                    </button>
                    <button type="button" className="btn-secondary" style={{ padding: '0 8px' }} onClick={() => setZoomLvl(z => Math.min(z + 0.2, 3))} title="Zoom In">
                        <ZoomIn size={18} />
                    </button>
                </div>
                <button className="btn-primary" onClick={handleDownload} style={{ margin: 0 }}>
                    <Download size={18} /> Download PDF
                </button>
            </div>

            <div style={{ padding: '2px', overflow: 'auto', marginBottom: '2rem' }}>
                <div ref={containerRef} style={{ transform: `scale(${zoomLvl})`, transformOrigin: 'top left', transition: 'transform 0.2s ease', margin: '0 auto', width: '800px' }}>
                    <div className="invoice-box" ref={invoiceRef}>
                        {/* Header */}
                        <div className="header-section">
                            <h1 className="company-name">SMR FLYASH BRICKS</h1>
                            <p className="company-details">2/96, Visaka Road, Manikanatham, Namakkal - 637207</p>
                            <div className="contact-gst">
                                <span>Contact : 9361216511</span>
                                <span>GST No : 33AJLPN2970J1ZX</span>
                            </div>
                        </div>

                        {/* Bill-to and Invoice Info */}
                        <div className="info-section">
                            <div className="info-left">
                                <div className="info-label bold-border-bottom">Bill To :</div>
                                <div className="info-content">
                                    <p className="bold">{invoice.billTo.name}</p>
                                    <p>{invoice.billTo.address}</p>
                                    {invoice.billTo.gst && <p>GST: {invoice.billTo.gst}</p>}
                                </div>
                            </div>
                            <div className="info-right">
                                <div className="info-row bold-border-bottom">
                                    <span className="info-label flex-2 align-center">Invoice No:</span>
                                    <span className="info-value flex-1 align-center bold">{invoice.invoiceNo}</span>
                                </div>
                                <div className="info-row bold-border-bottom">
                                    <span className="info-label flex-2 align-center">Date :</span>
                                    <span className="info-value flex-1 align-center bold">{invoice.date.split('-').reverse().join('-')}</span>
                                </div>
                                <div className="info-row" style={{ height: 'auto' }}>
                                    <div className="ship-to">
                                        <span className="info-label">Ship To :</span>
                                        <p>{invoice.shipTo}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="items-section-pdf">
                            <table className="pdf-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '8%' }}>S No</th>
                                        <th style={{ width: '32%' }}>Particulars</th>
                                        <th style={{ width: '15%' }}>HSN Code</th>
                                        <th style={{ width: '15%' }}>Qty</th>
                                        <th style={{ width: '15%' }}>Rate</th>
                                        <th style={{ width: '15%' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="center">{index + 1}</td>
                                            <td>{item.particulars}</td>
                                            <td className="center">{item.hsn}</td>
                                            <td className="right">{parseFloat(item.qty).toLocaleString('en-IN')}</td>
                                            <td className="right">
                                                {((parseFloat(item.rate) * 100) / 112).toFixed(2)}
                                                <div className="gst-small">CGST @ 6%</div>
                                                <div className="gst-small">SGST @ 6%</div>
                                            </td>
                                            <td className="right">
                                                {parseFloat(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                <div className="gst-small">{(item.amount * 0.06).toFixed(2)}</div>
                                                <div className="gst-small">{(item.amount * 0.06).toFixed(2)}</div>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Filler rows to manage height like the image */}
                                    <tr style={{ height: '100px' }}>
                                        <td></td><td></td><td></td><td></td><td></td><td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Value and Words */}
                        <div className="total-words-section">
                            <div className="invoice-value-line bold-border-bottom">
                                <span className="bold">INVOICE VALUE ____ {parseFloat(invoice.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="words-line">
                                <p className="bold">Total Amount In Words:</p>
                                <p>{numberToWords(invoice.grandTotal)}</p>
                            </div>
                        </div>

                        {/* HSN Summary Table */}
                        <div className="hsn-summary-section">
                            <table className="hsn-table">
                                <thead>
                                    <tr>
                                        <th>HSN / SAC</th>
                                        <th>GST Rate</th>
                                        <th>Total Value</th>
                                        <th>CGST</th>
                                        <th>SGST</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="center">{invoice.items[0]?.hsn}</td>
                                        <td className="center">12%</td>
                                        <td className="right">{parseFloat(invoice.totalAmount).toLocaleString('en-IN')}</td>
                                        <td className="right">{Math.round(invoice.totalCGST).toLocaleString('en-IN')}</td>
                                        <td className="right">{Math.round(invoice.totalSGST).toLocaleString('en-IN')}</td>
                                        <td className="right">{parseFloat(invoice.grandTotal).toLocaleString('en-IN')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Spacer */}
                        <div style={{ height: '100px', borderLeft: '1px solid black', borderRight: '1px solid black' }}></div>

                        {/* Declaration and Signatory */}
                        <div className="footer-pdf-section">
                            <div className="declaration">
                                <p className="bold">Declaration:</p>
                                <p>We Declare that this Invoice show the actual Price of the goods described and that all particulars are true and correct</p>
                            </div>
                            <div className="signatory">
                                <p className="bold">Authorised Signatory For SMR Flysash Bricks</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .preview-header {
            margin-bottom: 2rem;
            display: flex;
            justify-content: flex-start;
            gap: 15px;
        }
        .invoice-container {
            background: #fff;
            padding: 20px;
            display: flex;
            justify-content: center;
            overflow: auto;
        }
        .invoice-box {
            width: 800px;
            border: 1px solid black;
            font-family: 'Times New Roman', Times, serif;
            color: black;
            background: white;
            box-sizing: border-box;
        }
        .header-section {
            text-align: center;
            padding: 10px;
            border-bottom: 1px solid black;
        }
        .company-name {
            font-size: 28px;
            margin: 0;
            font-weight: 900;
        }
        .company-details {
            margin: 5px 0;
            font-size: 14px;
        }
        .contact-gst {
            display: flex;
            justify-content: center;
            gap: 40px;
            font-size: 14px;
            font-weight: bold;
        }
        .info-section {
            display: flex;
            border-bottom: 1px solid black;
            min-height: 150px;
        }
        .info-left {
            flex: 1;
            border-right: 1px solid black;
        }
        .info-right {
            flex: 1;
        }
        .info-label {
            padding: 2px 8px;
            font-size: 14px;
            display: block;
        }
        .bold-border-bottom {
            border-bottom: 1px solid black;
        }
        .info-content {
            padding: 5px 10px;
            font-size: 13px;
        }
        .info-row {
            display: flex;
            min-height: 30px;
        }
        .info-value {
            padding: 2px 8px;
            font-size: 14px;
            border-left: 1px solid black;
        }
        .flex-2 { flex: 2.5; }
        .flex-1 { flex: 1; }
        .align-center { display: flex; align-items: center; justify-content: center; }
        .ship-to {
            padding: 5px 10px;
            font-size: 13px;
        }
        .pdf-table {
            width: 100%;
            border-collapse: collapse;
        }
        .pdf-table th {
            border-bottom: 1px solid black;
            border-right: 1px solid black;
            padding: 5px;
            font-size: 14px;
        }
        .pdf-table td {
            border-right: 1px solid black;
            padding: 2px 8px;
            font-size: 13px;
            vertical-align: top;
        }
        .pdf-table th:last-child, .pdf-table td:last-child {
            border-right: none;
        }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .gst-small { font-size: 11px; }

        .total-words-section {
            border-top: 1px solid black;
            border-bottom: 1px solid black;
        }
        .invoice-value-line {
            padding: 5px 10px;
            font-size: 15px;
        }
        .words-line {
            padding: 5px 10px;
            font-size: 13px;
        }
        .hsn-table {
            width: 100%;
            border-collapse: collapse;
        }
        .hsn-table th, .hsn-table td {
            border: 1px solid black;
            padding: 4px;
            font-size: 12px;
        }
        .hsn-table th { background: transparent; }
        
        .footer-pdf-section {
            display: flex;
            border-top: 1px solid black;
            min-height: 100px;
        }
        .declaration {
            flex: 1;
            border-right: 1px solid black;
            padding: 5px 10px;
            font-size: 12px;
        }
        .signatory {
            flex: 1;
            padding: 5px 10px;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            font-size: 12px;
            text-align: center;
        }

        @media (max-width: 768px) {
            .preview-header {
                justify-content: flex-start;
                padding: 10px 0;
                margin-bottom: 1rem;
                gap: 15px;
                flex-wrap: wrap;
            }
        }
      `}</style>
        </div>
    );
};

export default InvoicePreview;
