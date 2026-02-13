using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Services
{
    /// <summary>
    /// Invoice PDF Generation Service Implementation (Phase 7)
    /// Creates professional PDF invoices using QuestPDF
    /// </summary>
    public class InvoiceService : IInvoiceService
    {
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<InvoiceService> _logger;
        private readonly ITaxCalculatorService _taxCalculator;

        // Company Information (Should be moved to configuration/database in production)
        private const string CompanyName = "VoIPPlatform AB";
        private const string CompanyAddress = "Storgatan 12";
        private const string CompanyCity = "Stockholm, Sweden";
        private const string CompanyPostalCode = "11122";
        private const string CompanyTaxId = "SE556789012301"; // Swedish VAT number
        private const string CompanyEmail = "billing@voipplatform.se";
        private const string CompanyPhone = "+46 8 123 456";

        public InvoiceService(
            IWebHostEnvironment env,
            ILogger<InvoiceService> logger,
            ITaxCalculatorService taxCalculator)
        {
            _env = env;
            _logger = logger;
            _taxCalculator = taxCalculator;

            // Configure QuestPDF license (Community license is free for open-source)
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task<string> GenerateInvoicePdfAsync(Payment payment, User user)
        {
            try
            {
                // Create invoices directory structure: /wwwroot/invoices/{userId}/
                var invoicesDir = Path.Combine(_env.WebRootPath ?? "wwwroot", "invoices", user.Id.ToString());
                Directory.CreateDirectory(invoicesDir);

                // Generate filename: INV-2026-000001.pdf
                var filename = $"{payment.InvoiceNumber}.pdf";
                var filePath = Path.Combine(invoicesDir, filename);

                // Generate PDF document
                Document.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Margin(50);
                        page.DefaultTextStyle(x => x.FontSize(10));

                        page.Header().Element(ComposeHeader);
                        page.Content().Element(content => ComposeContent(content, payment, user));
                        page.Footer().Element(ComposeFooter);
                    });
                })
                .GeneratePdf(filePath);

                _logger.LogInformation(
                    "Generated invoice PDF for payment {PaymentId}: {FilePath}",
                    payment.Id, filePath);

                // Return relative path for database storage
                return $"/invoices/{user.Id}/{filename}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate invoice PDF for payment {PaymentId}", payment.Id);
                throw;
            }
        }

        public string? GetInvoicePath(int userId, string invoiceNumber)
        {
            var filename = $"{invoiceNumber}.pdf";
            var filePath = Path.Combine(_env.WebRootPath ?? "wwwroot", "invoices", userId.ToString(), filename);

            return File.Exists(filePath) ? filePath : null;
        }

        public Task<bool> InvoiceExistsAsync(int userId, string invoiceNumber)
        {
            var path = GetInvoicePath(userId, invoiceNumber);
            return Task.FromResult(path != null);
        }

        public Task<bool> DeleteInvoiceAsync(int userId, string invoiceNumber)
        {
            var path = GetInvoicePath(userId, invoiceNumber);
            if (path != null && File.Exists(path))
            {
                File.Delete(path);
                _logger.LogInformation("Deleted invoice {InvoiceNumber} for user {UserId}", invoiceNumber, userId);
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }

        // ==================== PDF Layout Composition ====================

        private void ComposeHeader(IContainer container)
        {
            container.Row(row =>
            {
                // Company Info (Left)
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text(CompanyName).FontSize(20).Bold().FontColor(Colors.Blue.Darken2);
                    column.Item().Text(CompanyAddress).FontSize(9);
                    column.Item().Text($"{CompanyCity} {CompanyPostalCode}").FontSize(9);
                    column.Item().Text($"VAT: {CompanyTaxId}").FontSize(9).Bold();
                    column.Item().PaddingTop(5).Text(CompanyEmail).FontSize(8).FontColor(Colors.Grey.Darken1);
                    column.Item().Text(CompanyPhone).FontSize(8).FontColor(Colors.Grey.Darken1);
                });

                // Invoice Title (Right)
                row.RelativeItem().AlignRight().Column(column =>
                {
                    column.Item().AlignRight().Text("INVOICE").FontSize(28).Bold().FontColor(Colors.Blue.Darken2);
                    column.Item().PaddingTop(10).AlignRight().Text("Payment Receipt").FontSize(11).FontColor(Colors.Grey.Darken1);
                });
            });
        }

        private void ComposeContent(IContainer container, Payment payment, User user)
        {
            container.PaddingVertical(20).Column(column =>
            {
                // Invoice Details Section
                column.Item().Row(row =>
                {
                    // Customer Details (Left)
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text("BILL TO:").FontSize(9).Bold().FontColor(Colors.Grey.Darken2);
                        col.Item().PaddingTop(5).Text(user.FullName).FontSize(11).Bold();
                        col.Item().Text(user.Email).FontSize(9);
                        if (!string.IsNullOrEmpty(user.Address))
                        {
                            col.Item().Text(user.Address).FontSize(9);
                        }
                        if (!string.IsNullOrEmpty(user.City))
                        {
                            col.Item().Text($"{user.City} {user.PostalCode}").FontSize(9);
                        }
                        if (!string.IsNullOrEmpty(user.Country))
                        {
                            col.Item().Text(user.Country).FontSize(9);
                        }
                        if (!string.IsNullOrEmpty(user.TaxRegistrationNumber))
                        {
                            col.Item().PaddingTop(3).Text($"Tax ID: {user.TaxRegistrationNumber}").FontSize(9).Bold();
                        }
                    });

                    // Invoice Info (Right)
                    row.RelativeItem().AlignRight().Column(col =>
                    {
                        col.Item().Row(r =>
                        {
                            r.AutoItem().Width(80).Text("Invoice No:").FontSize(9).Bold();
                            r.AutoItem().Text(payment.InvoiceNumber).FontSize(9);
                        });
                        col.Item().Row(r =>
                        {
                            r.AutoItem().Width(80).Text("Invoice Date:").FontSize(9).Bold();
                            r.AutoItem().Text(payment.TransactionDate.ToString("yyyy-MM-dd")).FontSize(9);
                        });
                        col.Item().Row(r =>
                        {
                            r.AutoItem().Width(80).Text("Payment Method:").FontSize(9).Bold();
                            r.AutoItem().Text(payment.PaymentMethod).FontSize(9);
                        });
                        col.Item().Row(r =>
                        {
                            r.AutoItem().Width(80).Text("Status:").FontSize(9).Bold();
                            r.AutoItem().Text(payment.Status).FontSize(9).FontColor(
                                payment.Status == "Completed" ? Colors.Green.Darken2 : Colors.Orange.Darken2);
                        });
                        if (!string.IsNullOrEmpty(payment.ExternalTransactionId))
                        {
                            col.Item().Row(r =>
                            {
                                r.AutoItem().Width(80).Text("Transaction ID:").FontSize(8);
                                r.AutoItem().Text(payment.ExternalTransactionId).FontSize(8).FontColor(Colors.Grey.Darken1);
                            });
                        }
                    });
                });

                column.Item().PaddingTop(20);

                // Line Items Table
                column.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(3); // Description
                        columns.RelativeColumn(1); // Quantity
                        columns.RelativeColumn(1); // Unit Price
                        columns.RelativeColumn(1); // Amount
                    });

                    // Table Header
                    table.Header(header =>
                    {
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5)
                            .Text("Description").FontColor(Colors.White).FontSize(10).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5)
                            .AlignCenter().Text("Quantity").FontColor(Colors.White).FontSize(10).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5)
                            .AlignRight().Text("Unit Price").FontColor(Colors.White).FontSize(10).Bold();
                        header.Cell().Background(Colors.Blue.Darken2).Padding(5)
                            .AlignRight().Text("Amount").FontColor(Colors.White).FontSize(10).Bold();
                    });

                    // Table Row - Wallet Top-up
                    table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(8)
                        .Text("Wallet Top-up - VoIP Services").FontSize(10);
                    table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(8)
                        .AlignCenter().Text("1").FontSize(10);
                    table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(8)
                        .AlignRight().Text($"${payment.Amount:F2}").FontSize(10);
                    table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(8)
                        .AlignRight().Text($"${payment.Amount:F2}").FontSize(10).Bold();
                });

                column.Item().PaddingTop(10);

                // Tax Breakdown & Total
                column.Item().AlignRight().Column(col =>
                {
                    // Subtotal
                    col.Item().Row(row =>
                    {
                        row.AutoItem().Width(120).Text("Subtotal:").FontSize(10);
                        row.AutoItem().Width(100).AlignRight().Text($"${payment.Amount:F2}").FontSize(10);
                    });

                    // Tax Line
                    if (payment.TaxAmount > 0)
                    {
                        var taxType = DetermineTaxType(payment);
                        col.Item().Row(row =>
                        {
                            row.AutoItem().Width(120).Text($"{taxType}:").FontSize(10);
                            row.AutoItem().Width(100).AlignRight().Text($"${payment.TaxAmount:F2}").FontSize(10);
                        });
                    }
                    else
                    {
                        var taxNote = GetTaxNote(payment);
                        col.Item().Row(row =>
                        {
                            row.AutoItem().Width(120).Text("Tax:").FontSize(10);
                            row.AutoItem().Width(100).AlignRight().Text(taxNote).FontSize(9).Italic()
                                .FontColor(Colors.Grey.Darken1);
                        });
                    }

                    // Total
                    col.Item().PaddingTop(5).BorderTop(2).BorderColor(Colors.Blue.Darken2)
                        .PaddingTop(8).Row(row =>
                        {
                            row.AutoItem().Width(120).Text("TOTAL PAID:").FontSize(12).Bold();
                            row.AutoItem().Width(100).AlignRight().Text($"${payment.TotalPaid:F2}")
                                .FontSize(14).Bold().FontColor(Colors.Blue.Darken2);
                        });
                });

                // Payment Notes
                if (!string.IsNullOrEmpty(payment.Notes))
                {
                    column.Item().PaddingTop(20).Column(col =>
                    {
                        col.Item().Text("Notes:").FontSize(9).Bold();
                        col.Item().PaddingTop(3).Text(payment.Notes).FontSize(9).FontColor(Colors.Grey.Darken1);
                    });
                }

                // Tax Notice (for Reverse Charge)
                if (payment.TaxAmount == 0 && !string.IsNullOrEmpty(user.TaxRegistrationNumber) && _taxCalculator.IsEuCountry(user.Country))
                {
                    column.Item().PaddingTop(15).Background(Colors.Blue.Lighten4).Padding(10).Column(col =>
                    {
                        col.Item().Text("REVERSE CHARGE - VAT").FontSize(9).Bold().FontColor(Colors.Blue.Darken2);
                        col.Item().PaddingTop(3).Text(
                            "This is a B2B transaction. VAT is payable by the recipient under the reverse charge mechanism."
                        ).FontSize(8).FontColor(Colors.Grey.Darken2);
                    });
                }
            });
        }

        private void ComposeFooter(IContainer container)
        {
            container.AlignCenter().Column(column =>
            {
                column.Item().BorderTop(1).BorderColor(Colors.Grey.Lighten1).PaddingTop(10);
                column.Item().Text("Thank you for your business!").FontSize(10).Bold();
                column.Item().PaddingTop(5).Text($"{CompanyName} | {CompanyEmail} | {CompanyPhone}")
                    .FontSize(8).FontColor(Colors.Grey.Darken1);
                column.Item().Text("This is a computer-generated invoice and does not require a signature.")
                    .FontSize(7).Italic().FontColor(Colors.Grey.Darken1);
            });
        }

        // ==================== Helper Methods ====================

        private string DetermineTaxType(Payment payment)
        {
            if (payment.TaxAmount == 0) return "Tax (0%)";

            var taxRate = payment.Amount > 0 ? (payment.TaxAmount / payment.Amount) * 100 : 0;
            return $"VAT ({taxRate:F0}%)";
        }

        private string GetTaxNote(Payment payment)
        {
            if (payment.Notes != null)
            {
                if (payment.Notes.Contains("Reverse Charge")) return "Reverse Charge";
                if (payment.Notes.Contains("Export")) return "Export (0%)";
            }
            return "$0.00";
        }
    }
}
