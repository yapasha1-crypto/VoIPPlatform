using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoIPPlatform.API.Models;

namespace VoIPPlatform.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class RatesController : ControllerBase
    {
        private readonly VoIPDbContext _context;

        public RatesController(VoIPDbContext context)
        {
            _context = context;
        }

        // ==================== Tariffs ====================

        [HttpGet("tariffs")]
        public async Task<ActionResult<IEnumerable<Tariff>>> GetTariffs()
        {
            return await _context.Tariffs.ToListAsync();
        }

        [HttpPost("tariffs")]
        public async Task<ActionResult<Tariff>> CreateTariff([FromBody] Tariff tariff)
        {
            if (string.IsNullOrEmpty(tariff.Name))
                return BadRequest("Tariff name is required.");

            _context.Tariffs.Add(tariff);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTariffs), new { id = tariff.Id }, tariff);
        }

        [HttpDelete("tariffs/{id}")]
        public async Task<IActionResult> DeleteTariff(int id)
        {
            var tariff = await _context.Tariffs.FindAsync(id);
            if (tariff == null)
                return NotFound();

            // Check if used by customers? Ideally yes, but skipping for now.
            _context.Tariffs.Remove(tariff);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ==================== Rates ====================

        [HttpGet("tariffs/{tariffId}/rates")]
        public async Task<ActionResult<IEnumerable<Rate>>> GetRates(int tariffId)
        {
            return await _context.Rates
                .Where(r => r.TariffId == tariffId)
                .OrderBy(r => r.Destination)
                .ToListAsync();
        }

        [HttpPost("rates")]
        public async Task<ActionResult<Rate>> AddRate([FromBody] Rate rate)
        {
            var tariff = await _context.Tariffs.FindAsync(rate.TariffId);
            if (tariff == null)
                return BadRequest("Invalid Tariff ID.");

            // Check for duplicate prefix in same tariff
            var exists = await _context.Rates.AnyAsync(r => r.TariffId == rate.TariffId && r.Prefix == rate.Prefix);
            if (exists)
                return Conflict($"Rate for prefix {rate.Prefix} already exists in this tariff.");

            _context.Rates.Add(rate);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRates), new { tariffId = rate.TariffId }, rate);
        }

        [HttpPut("rates/{id}")]
        public async Task<IActionResult> UpdateRate(int id, [FromBody] Rate updatedRate)
        {
            if (id != updatedRate.Id)
                return BadRequest();

            var rate = await _context.Rates.FindAsync(id);
            if (rate == null)
                return NotFound();

            rate.Destination = updatedRate.Destination;
            rate.Prefix = updatedRate.Prefix;
            rate.Price = updatedRate.Price;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("rates/{id}")]
        public async Task<IActionResult> DeleteRate(int id)
        {
            var rate = await _context.Rates.FindAsync(id);
            if (rate == null)
                return NotFound();

            _context.Rates.Remove(rate);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        [HttpPost("tariffs/{tariffId}/import")]
        public async Task<IActionResult> ImportRates(int tariffId, IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest("File is empty.");

                var tariff = await _context.Tariffs.FindAsync(tariffId);
                if (tariff == null)
                    return NotFound("Tariff not found.");

                System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

                var ratesToAdd = new List<Rate>();
                var errors = new List<string>();

                using (var stream = file.OpenReadStream())
                {
                    ExcelDataReader.IExcelDataReader reader = null;
                    try 
                    {
                        if (file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
                            reader = ExcelDataReader.ExcelReaderFactory.CreateCsvReader(stream);
                        else
                            reader = ExcelDataReader.ExcelReaderFactory.CreateReader(stream);
                    }
                    catch (Exception)
                    {
                        // Fallback: Try CSV if reader failed (e.g. .xls extension but csv content)
                        stream.Position = 0;
                        try { reader = ExcelDataReader.ExcelReaderFactory.CreateCsvReader(stream); }
                        catch { throw new Exception("Could not determine file format. Please upload a valid Excel (.xls, .xlsx) or CSV file."); }
                    }

                    using (reader)
                    {
                        // 1. Read Header Row
                        if (!reader.Read())
                            return BadRequest("File is empty.");

                        int destCol = -1, prefixCol = -1, priceCol = -1;
                        
                        var headersFound = new List<string>();

                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            var header = reader.GetValue(i)?.ToString()?.ToLower().Trim();
                            headersFound.Add(header ?? "null");
                            
                            if (string.IsNullOrEmpty(header)) continue;

                            if (header == "destination" || header == "dest" || header == "name" || header == "country") destCol = i;
                            else if (header == "prefix" || header == "code" || header == "dialcode") prefixCol = i;
                            else if (header == "price" || header == "rate" || header == "cost" || header == "buy rate" || header == "sell rate" || header == "amount") priceCol = i;
                        }

                        // Fallback: If Prefix is missing but Destination exists, try to use Destination as Prefix
                        bool usingDestAsPrefix = false;
                        if (prefixCol == -1 && destCol != -1)
                        {
                             prefixCol = destCol;
                             usingDestAsPrefix = true;
                             Console.WriteLine("[Import Info] Prefix column missing. Using Destination column as Prefix.");
                        }

                        if (destCol == -1 || prefixCol == -1 || priceCol == -1)
                        {
                             Console.WriteLine($"[Import Error] Missing Columns. Found: {string.Join(", ", headersFound)}");
                             return BadRequest($"Missing required columns. Found: {string.Join(", ", headersFound)}. Required: Destination (or Name), Prefix (or Code), Price (or Rate).");
                        }

                        // 2. Read Data Rows
                        while (reader.Read())
                        {
                            try
                            {
                                var dest = reader.GetValue(destCol)?.ToString();
                                string? prefix = usingDestAsPrefix ? dest : reader.GetValue(prefixCol)?.ToString();
                                var priceObj = reader.GetValue(priceCol);

                                if (string.IsNullOrWhiteSpace(dest) || string.IsNullOrWhiteSpace(prefix) || priceObj == null)
                                    continue;

                                // Clean up prefix if it was from destination/name
                                if (usingDestAsPrefix)
                                {
                                    string[] parts = prefix.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                                    if (parts.Length > 0 && long.TryParse(parts[0], out _))
                                    {
                                        prefix = parts[0]; 
                                        if (parts.Length > 1) dest = string.Join(" ", System.Linq.Enumerable.Skip(parts, 1));
                                    }
                                }

                                decimal price = 0;
                                var priceStr = priceObj.ToString();
                                 // Remove currency symbols and whitespace
                                priceStr = System.Text.RegularExpressions.Regex.Replace(priceStr, @"[^\d.-]", "");
                                
                                if (!decimal.TryParse(priceStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out price))
                                    decimal.TryParse(priceStr, out price);

                                ratesToAdd.Add(new Rate
                                {
                                    TariffId = tariffId,
                                    Destination = dest,
                                    Prefix = prefix,
                                    Price = price
                                });
                            }
                            catch (Exception ex)
                            {
                                errors.Add(ex.Message);
                            }
                        }
                    }
                }

                if (ratesToAdd.Count > 0)
                {
                    await _context.Rates.AddRangeAsync(ratesToAdd);
                    await _context.SaveChangesAsync();
                }

                Console.WriteLine($"[Import Success] Imported {ratesToAdd.Count} rates.");
                if(errors.Count > 0) Console.WriteLine($"[Import Warnings] Skipped {errors.Count} rows.");

                return Ok(new { count = ratesToAdd.Count, message = $"Successfully imported {ratesToAdd.Count} rates." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Import Critical Error] {ex.Message} \n {ex.StackTrace}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("tariffs/{tariffId}/rates")]
        public async Task<IActionResult> ClearRates(int tariffId)
        {
            var tariff = await _context.Tariffs.FindAsync(tariffId);
            if (tariff == null) return NotFound();

            var rates = _context.Rates.Where(r => r.TariffId == tariffId);
            _context.Rates.RemoveRange(rates);
            await _context.SaveChangesAsync();
            
            return NoContent();
        }


        [HttpPost("tariffs/{tariffId}/import-local")]
        [AllowAnonymous]
        public async Task<IActionResult> ImportLocalRates(int tariffId)
        {
            string filePath = @"C:\Users\mejer\Desktop\VoIPPlatform\RateList.xls";
            if (!System.IO.File.Exists(filePath))
                return NotFound($"File not found at {filePath}");

            var tariff = await _context.Tariffs.FindAsync(tariffId);
            if (tariff == null)
                return NotFound("Tariff not found.");

            System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

            var ratesToAdd = new List<Rate>();

            using (var stream = System.IO.File.OpenRead(filePath))
            {
                using (var reader = ExcelDataReader.ExcelReaderFactory.CreateReader(stream))
                {
                    if (!reader.Read()) return BadRequest("File is empty.");

                    int destCol = -1, prefixCol = -1, priceCol = -1;
                    var headersFound = new List<string>();

                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        var header = reader.GetValue(i)?.ToString()?.ToLower().Trim();
                        headersFound.Add(header ?? "null");

                        if (string.IsNullOrEmpty(header)) continue;
                        if (header == "destination" || header == "dest" || header == "name") destCol = i;
                        else if (header == "prefix" || header == "code" || header == "dialcode") prefixCol = i;
                        else if (header == "price" || header == "rate" || header == "cost" || header == "buy rate") priceCol = i;
                    }

                    bool usingDestAsPrefix = false;
                    if (prefixCol == -1 && destCol != -1)
                    {
                         prefixCol = destCol;
                         usingDestAsPrefix = true;
                    }

                    using (var debugWriter = new System.IO.StreamWriter(@"C:\Users\mejer\Desktop\VoIPPlatform\import_debug.txt"))
                    {
                        if (destCol == -1 || prefixCol == -1 || priceCol == -1)
                        {
                            debugWriter.WriteLine($"[Import Error] Missing Columns. Headers Found: {string.Join(", ", headersFound)}");
                            return BadRequest($"Missing columns. Found headers: {string.Join(", ", headersFound)}");
                        }
                        debugWriter.WriteLine($"[Import Debug] Mapped Columns - Dest: {destCol}, Prefix: {prefixCol}, Price: {priceCol}");

                        int rowCount = 0;
                        while (reader.Read())
                        {
                            rowCount++;
                            try
                            {
                                var dest = reader.GetValue(destCol)?.ToString();
                                string? prefix = usingDestAsPrefix ? dest : reader.GetValue(prefixCol)?.ToString();
                                var priceObj = reader.GetValue(priceCol);
                                
                                if (rowCount <= 3) 
                                    debugWriter.WriteLine($"[Import Debug Row {rowCount}] Raw Price: '{priceObj}' (Type: {priceObj?.GetType().Name})");

                            if (string.IsNullOrWhiteSpace(dest) || string.IsNullOrWhiteSpace(prefix) || priceObj == null) continue;

                             if (usingDestAsPrefix)
                            {
                                string[] parts = prefix.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                                if (parts.Length > 0 && long.TryParse(parts[0], out _))
                                {
                                    prefix = parts[0]; 
                                    if (parts.Length > 1) dest = string.Join(" ", System.Linq.Enumerable.Skip(parts, 1));
                                }
                            }

                            decimal price = 0;
                            var priceStr = priceObj.ToString();
                             // Remove currency symbols and whitespace
                            priceStr = System.Text.RegularExpressions.Regex.Replace(priceStr, @"[^\d.-]", "");
                            
                            if (!decimal.TryParse(priceStr, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out price))
                                decimal.TryParse(priceStr, out price);

                            ratesToAdd.Add(new Rate { TariffId = tariffId, Destination = dest, Prefix = prefix, Price = price });
                        }
                        catch { }
                    }
                    }
                }
            }

            if (ratesToAdd.Count > 0)
            {
                await _context.Rates.AddRangeAsync(ratesToAdd);
                await _context.SaveChangesAsync();
            }

            return Ok(new { count = ratesToAdd.Count, message = $"Imported {ratesToAdd.Count} rates from local file." });
        }
    }
}

