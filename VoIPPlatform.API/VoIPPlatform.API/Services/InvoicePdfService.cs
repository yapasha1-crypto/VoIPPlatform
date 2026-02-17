using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Services
{
    public class InvoicePdfService
    {
        public byte[] GeneratePdf(Invoice invoice)
        {
            var user = invoice.User;
            var userName = user?.FullName ?? user?.Username ?? "Unknown";
            var userEmail = user?.Email ?? string.Empty;

            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial));

                    // ── HEADER ──────────────────────────────────────────────────────
                    page.Header().Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("VoIP PLATFORM").FontSize(20).Bold().FontColor("#1a73e8");
                            col.Item().Text("Telecommunications Services").FontSize(9).FontColor(Colors.Grey.Medium);
                        });

                        row.ConstantItem(150).AlignRight().Column(col =>
                        {
                            col.Item().Text("INVOICE").FontSize(26).Bold().FontColor("#1a73e8");
                            col.Item().Text($"INV-{invoice.Id}").FontSize(11).Bold();
                        });
                    });

                    // ── CONTENT ─────────────────────────────────────────────────────
                    page.Content().PaddingVertical(20).Column(col =>
                    {
                        // Divider
                        col.Item().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(10);
                        col.Item().Height(10);

                        // Invoice meta + Bill To (two-column)
                        col.Item().Row(row =>
                        {
                            // Left: Bill To
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("BILL TO").FontSize(9).Bold().FontColor(Colors.Grey.Medium);
                                c.Item().Height(4);
                                c.Item().Text(userName).Bold();
                                if (!string.IsNullOrEmpty(userEmail))
                                    c.Item().Text(userEmail).FontColor(Colors.Grey.Darken1);
                            });

                            // Right: Invoice details
                            row.ConstantItem(220).Column(c =>
                            {
                                MetaRow(c, "Invoice Date:", invoice.CreatedAt.ToString("dd MMM yyyy"));
                                MetaRow(c, "Due Date:", invoice.DueDate.ToString("dd MMM yyyy"));
                                MetaRow(c, "Period:",
                                    $"{invoice.PeriodStart:dd MMM yyyy} – {invoice.PeriodEnd:dd MMM yyyy}");
                                MetaRow(c, "Status:", invoice.Status.ToString());
                            });
                        });

                        col.Item().Height(20);

                        // ── LINE ITEMS TABLE ────────────────────────────────────────
                        col.Item().Table(table =>
                        {
                            // Column definitions
                            table.ColumnsDefinition(cols =>
                            {
                                cols.RelativeColumn(4);   // Destination
                                cols.RelativeColumn(1.5f); // Minutes
                                cols.RelativeColumn(1.5f); // Rate/Min
                                cols.RelativeColumn(1.5f); // Total
                            });

                            // Header row
                            table.Header(header =>
                            {
                                TableHeaderCell(header, "Destination");
                                TableHeaderCell(header, "Minutes");
                                TableHeaderCell(header, "Rate / Min");
                                TableHeaderCell(header, "Total");
                            });

                            // Data rows
                            bool alternate = false;
                            foreach (var item in invoice.LineItems)
                            {
                                var bg = alternate ? Colors.Grey.Lighten4 : Colors.White;
                                alternate = !alternate;

                                TableCell(table, item.Description, bg, false);
                                TableCell(table, item.Quantity.ToString("F2"), bg, true);
                                TableCell(table, $"${item.UnitPrice:F5}", bg, true);
                                TableCell(table, $"${item.Total:F5}", bg, true);
                            }

                            // Empty state
                            if (!invoice.LineItems.Any())
                            {
                                table.Cell().ColumnSpan(4)
                                    .Padding(8)
                                    .AlignCenter()
                                    .Text("No line items on this invoice.")
                                    .FontColor(Colors.Grey.Medium);
                            }
                        });

                        col.Item().Height(16);

                        // ── TOTAL ROW ───────────────────────────────────────────────
                        col.Item().AlignRight().Row(row =>
                        {
                            row.ConstantItem(200).Column(c =>
                            {
                                c.Item().BorderTop(1).BorderColor(Colors.Grey.Lighten2).PaddingTop(8)
                                    .Row(r =>
                                    {
                                        r.RelativeItem().Text("TOTAL AMOUNT").Bold().FontSize(12);
                                        r.ConstantItem(100).AlignRight()
                                            .Text($"${invoice.TotalAmount:F5}")
                                            .Bold().FontSize(12).FontColor("#1a73e8");
                                    });
                            });
                        });

                        // Notes
                        if (!string.IsNullOrWhiteSpace(invoice.Notes))
                        {
                            col.Item().Height(20);
                            col.Item().Column(c =>
                            {
                                c.Item().Text("Notes").Bold().FontSize(9).FontColor(Colors.Grey.Medium);
                                c.Item().Text(invoice.Notes).FontColor(Colors.Grey.Darken1);
                            });
                        }
                    });

                    // ── FOOTER ──────────────────────────────────────────────────────
                    page.Footer().AlignCenter().Column(col =>
                    {
                        col.Item().BorderTop(1).BorderColor(Colors.Grey.Lighten2).PaddingTop(8);
                        col.Item().AlignCenter().Text("Thank you for your business!")
                            .Bold().FontColor(Colors.Grey.Darken2);
                        col.Item().AlignCenter().Text("VoIP Platform | support@voipplatform.com")
                            .FontSize(8).FontColor(Colors.Grey.Medium);
                    });
                });
            }).GeneratePdf();
        }

        // ── Helpers ──────────────────────────────────────────────────────────────

        private static void MetaRow(ColumnDescriptor col, string label, string value)
        {
            col.Item().Row(r =>
            {
                r.ConstantItem(90).Text(label).FontColor(Colors.Grey.Medium);
                r.RelativeItem().Text(value).Bold();
            });
        }

        private static void TableHeaderCell(TableCellDescriptor header, string text)
        {
            header.Cell()
                .Background("#1a73e8")
                .Padding(6)
                .Text(text)
                .FontColor(Colors.White)
                .Bold();
        }

        private static void TableCell(TableDescriptor table, string text, string background, bool alignRight)
        {
            var cell = table.Cell()
                .Background(background)
                .BorderBottom(1)
                .BorderColor(Colors.Grey.Lighten3)
                .Padding(5);

            if (alignRight)
                cell.AlignRight().Text(text);
            else
                cell.Text(text);
        }
    }
}
