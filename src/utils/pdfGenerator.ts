import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { type CalculatedItem } from "@/data/packages";
import { format } from "date-fns";

export function generatePDF(
    items: CalculatedItem[],
    grandTotal: number,
    _categoryTotals: Record<string, number>,
    summaryText: string
) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    // Logo placeholder (Left)
    doc.setFillColor(26, 26, 26); // Charcoal
    doc.circle(20, 20, 8, "F");
    doc.setTextColor(212, 175, 55); // Gold
    doc.setFontSize(14);
    doc.text("JD", 16, 22);

    // Company Name
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("JD Rentals", 35, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Premium Event Setup & Rentals", 35, 26);

    // Date/Time (Right)
    doc.setFontSize(10);
    doc.setTextColor(100);
    const dateStr = format(new Date(), "PPpp");
    doc.text(dateStr, pageWidth - 15, 20, { align: "right" });

    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(15, 32, pageWidth - 15, 32);

    let finalY = 35;

    // Summary Section
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Package Summary:", 15, finalY + 10);
    doc.setFontSize(10);
    doc.setTextColor(60);

    // Split summary text into lines
    const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 30);
    doc.text(splitSummary, 15, finalY + 18);

    finalY += 18 + (splitSummary.length * 5);

    // --- Aggregation Logic ---
    const aggregated = new Map<string, {
        name: string,
        qty: number,
        weightPerPc: number | null,
        totalWeight: number
    }>();

    items.forEach(item => {
        const key = item.name.trim().toLowerCase();
        const existing = aggregated.get(key);

        if (existing) {
            existing.qty += item.qty;
            existing.totalWeight += (item.totalWeight || 0);
        } else {
            aggregated.set(key, {
                name: item.name, // Use original casing from first occurrence
                qty: item.qty,
                weightPerPc: item.weightPerPc,
                totalWeight: item.totalWeight || 0
            });
        }
    });

    const sortedItems = Array.from(aggregated.values()).sort((a, b) => a.name.localeCompare(b.name));

    const tableRows = sortedItems.map((item) => [
        item.name,
        item.qty,
        item.weightPerPc !== null ? item.weightPerPc.toFixed(2) + " kg" : "---",
        item.totalWeight !== null ? item.totalWeight.toFixed(2) + " kg" : "---",
    ]);

    autoTable(doc, {
        startY: finalY,
        head: [["Item Name", "Qty", "Weight/Pc", "Total Weight"]],
        body: tableRows,
        theme: "striped",
        headStyles: { fillColor: [26, 26, 26], textColor: [212, 175, 55] }, // Charcoal + Gold
        columnStyles: {
            0: { fontStyle: "bold" }, // Name
            3: { fontStyle: "bold", halign: "right" }, // Total Weight
            2: { halign: "right" }, // Unit Weight
            1: { halign: "center" }, // Qty
        },
    });

    // Totals Section
    // @ts-ignore
    finalY = doc.lastAutoTable.finalY + 10;

    // Grand Total
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(pageWidth - 80, finalY, 65, 25, 3, 3, "F");

    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text("Total Estimated Weight", pageWidth - 75, finalY + 8);

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`, pageWidth - 75, finalY + 18);

    // Footer
    const footerY = doc.internal.pageSize.height - 20;
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(15, footerY, pageWidth - 15, footerY);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Prepared by JD Rentals Calculator", 15, footerY + 8);
    doc.text("Signature: __________________________", pageWidth - 15, footerY + 8, { align: "right" });

    // Save
    doc.save(`JD_Requirements_${format(new Date(), "yyyy-MM-dd_HHmm")}.pdf`);
}
