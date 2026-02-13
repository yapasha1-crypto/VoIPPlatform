using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VoIPPlatform.API.Models;
using VoIPPlatform.API.Services;
using System.Security.Claims;

namespace VoIPPlatform.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class RatesController : ControllerBase
    {
        private readonly VoIPDbContext _context;
        private readonly IRateCalculatorService _rateCalculator;

        public RatesController(VoIPDbContext context, IRateCalculatorService rateCalculator)
        {
            _context = context;
            _rateCalculator = rateCalculator;
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

        // ==================== PHASE 6: DYNAMIC RATES ENGINE ====================

        /// <summary>
        /// Get all configured rates (BaseRates with calculated SellPrice) based on tariff plan
        /// Admin/Reseller endpoint for rate configuration simulation
        /// </summary>
        [HttpGet("configure")]
        [Authorize(Roles = "Admin,Reseller")]
        public async Task<ActionResult> GetConfiguredRates([FromQuery] int planId)
        {
            try
            {
                var configuredRates = await _rateCalculator.GetConfiguredRatesAsync(planId);
                return Ok(configuredRates);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get rates for the currently logged-in user based on their assigned tariff plan
        /// User endpoint - read-only view of their pricing
        /// </summary>
        [HttpGet("my-rates")]
        [Authorize(Roles = "User,Company,Reseller,Admin")]
        public async Task<ActionResult> GetMyRates()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { error = "Invalid user token" });
                }

                var configuredRates = await _rateCalculator.GetUserRatesAsync(userId);
                return Ok(configuredRates);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        /// <summary>
        /// Upload CSV file of BaseRates (Buy Rates)
        /// Format: DestinationName, Code, BuyPrice
        /// </summary>
        [HttpPost("upload-base-rates")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadBaseRates(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { error = "File is empty" });

                if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
                    return BadRequest(new { error = "Only CSV files are supported" });

                var baseRatesToAdd = new List<BaseRate>();
                var errors = new List<string>();

                using (var reader = new StreamReader(file.OpenReadStream()))
                {
                    // Read header
                    var header = await reader.ReadLineAsync();
                    if (header == null)
                        return BadRequest(new { error = "File is empty" });

                    // Parse header to find column indices (flexible mapping - case insensitive)
                    var headers = header.Split(',').Select(h => h.Trim().ToLower()).ToArray();

                    int destCol = Array.FindIndex(headers, h =>
                        h == "destination" || h == "destinationname" || h == "dest" || h == "name" || h == "country");

                    int codeCol = Array.FindIndex(headers, h =>
                        h == "code" || h == "prefix" || h == "dialcode");

                    int priceCol = Array.FindIndex(headers, h =>
                        h == "buyprice" || h == "buy price" || h == "buy rate" || h == "buyrate" ||
                        h == "price" || h == "rate" || h == "cost" || h == "buy");

                    // Fallback: If Code column is missing, we'll use Destination as fallback or generate default
                    bool usingDestAsCode = false;
                    if (codeCol == -1 && destCol != -1)
                    {
                        // We'll handle code extraction in the data loop
                        usingDestAsCode = true;
                        Console.WriteLine("[Upload Info] Code column missing. Will attempt extraction from Destination or use default.");
                    }

                    if (destCol == -1 || priceCol == -1)
                    {
                        return BadRequest(new
                        {
                            error = "Missing required columns",
                            required = "Destination (or Dest/Name/Country) and Price (or BuyPrice/Rate/'Buy Rate'/Cost). Code column is optional.",
                            found = string.Join(", ", headers),
                            note = "Header matching is case-insensitive. Found headers are shown in lowercase."
                        });
                    }

                    // Read data rows
                    int lineNumber = 1;
                    while (!reader.EndOfStream)
                    {
                        lineNumber++;
                        var line = await reader.ReadLineAsync();
                        if (string.IsNullOrWhiteSpace(line)) continue;

                        var values = line.Split(',').Select(v => v.Trim()).ToArray();

                        try
                        {
                            // Determine max column index needed
                            int maxColNeeded = usingDestAsCode ? Math.Max(destCol, priceCol) : Math.Max(destCol, Math.Max(codeCol, priceCol));

                            if (values.Length <= maxColNeeded)
                            {
                                errors.Add($"Line {lineNumber}: Not enough columns");
                                continue;
                            }

                            var destination = values[destCol];
                            var priceStr = values[priceCol];

                            if (string.IsNullOrWhiteSpace(destination) || string.IsNullOrWhiteSpace(priceStr))
                            {
                                errors.Add($"Line {lineNumber}: Missing destination or price");
                                continue;
                            }

                            // Handle Code column logic
                            string code;
                            if (usingDestAsCode)
                            {
                                // Try to extract a prefix from destination name or use a normalized version
                                // Example: "Afghanistan [FIX]" -> could use "AFG-FIX" or just "Afghanistan-FIX"
                                // For simplicity, we'll use the destination as a unique code
                                code = destination.Trim();

                                // Optional: Try to extract numeric prefix if destination starts with numbers
                                // e.g., "93 Afghanistan" -> "93"
                                var numericMatch = System.Text.RegularExpressions.Regex.Match(destination, @"^\d+");
                                if (numericMatch.Success && numericMatch.Value.Length > 0)
                                {
                                    code = numericMatch.Value;
                                }
                            }
                            else
                            {
                                code = values[codeCol];
                                if (string.IsNullOrWhiteSpace(code))
                                {
                                    errors.Add($"Line {lineNumber}: Missing code");
                                    continue;
                                }
                            }

                            // Clean price string (remove currency symbols like €, $, spaces, etc.)
                            priceStr = System.Text.RegularExpressions.Regex.Replace(priceStr, @"[^\d.\-]", "");

                            if (!decimal.TryParse(priceStr, System.Globalization.NumberStyles.Any,
                                System.Globalization.CultureInfo.InvariantCulture, out decimal buyPrice))
                            {
                                errors.Add($"Line {lineNumber}: Invalid price format '{values[priceCol]}'");
                                continue;
                            }

                            // Validate price is non-negative
                            if (buyPrice < 0)
                            {
                                errors.Add($"Line {lineNumber}: Price cannot be negative");
                                continue;
                            }

                            // Check if base rate already exists (update instead of duplicate)
                            var existingRate = await _context.BaseRates
                                .FirstOrDefaultAsync(br => br.Code == code && br.DestinationName == destination);

                            if (existingRate != null)
                            {
                                existingRate.BuyPrice = buyPrice;
                                existingRate.UpdatedAt = DateTime.UtcNow;
                            }
                            else
                            {
                                baseRatesToAdd.Add(new BaseRate
                                {
                                    DestinationName = destination,
                                    Code = code,
                                    BuyPrice = buyPrice,
                                    CreatedAt = DateTime.UtcNow
                                });
                            }
                        }
                        catch (Exception ex)
                        {
                            errors.Add($"Line {lineNumber}: {ex.Message}");
                        }
                    }
                }

                if (baseRatesToAdd.Count > 0)
                {
                    await _context.BaseRates.AddRangeAsync(baseRatesToAdd);
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    imported = baseRatesToAdd.Count,
                    updated = errors.Count(e => e.Contains("updated")),
                    errors = errors,
                    message = $"Successfully processed {baseRatesToAdd.Count} base rates"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get all tariff plans (predefined + custom)
        /// </summary>
        [HttpGet("tariff-plans")]
        [Authorize(Roles = "Admin,Reseller")]
        public async Task<ActionResult> GetTariffPlans()
        {
            try
            {
                var plans = await _rateCalculator.GetAllActivePlansAsync();
                return Ok(plans);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        /// <summary>
        /// Create a custom tariff plan
        /// </summary>
        [HttpPost("tariff-plans")]
        [Authorize(Roles = "Admin,Reseller")]
        public async Task<ActionResult> CreateTariffPlan([FromBody] TariffPlan plan)
        {
            try
            {
                var createdPlan = await _rateCalculator.CreateTariffPlanAsync(plan);
                return CreatedAtAction(nameof(GetTariffPlans), new { id = createdPlan.Id }, createdPlan);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get all base rates (Admin only)
        /// </summary>
        [HttpGet("base-rates")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GetBaseRates([FromQuery] int? limit = null)
        {
            try
            {
                var query = _context.BaseRates.OrderBy(br => br.DestinationName);

                if (limit.HasValue)
                {
                    var rates = await query.Take(limit.Value).ToListAsync();
                    return Ok(rates);
                }

                var allRates = await query.ToListAsync();
                return Ok(allRates);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }

        /// <summary>
        /// Assign a tariff plan to a user
        /// </summary>
        [HttpPost("assign-plan")]
        [Authorize(Roles = "Admin,Reseller")]
        public async Task<IActionResult> AssignTariffPlan([FromBody] AssignTariffRequest request)
        {
            try
            {
                var user = await _context.Users.FindAsync(request.UserId);
                if (user == null)
                    return NotFound(new { error = "User not found" });

                var plan = await _context.TariffPlans.FindAsync(request.TariffPlanId);
                if (plan == null)
                    return NotFound(new { error = "Tariff plan not found" });

                user.TariffPlanId = request.TariffPlanId;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = $"Tariff plan '{plan.Name}' assigned to user '{user.Username}'" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Internal server error: {ex.Message}" });
            }
        }
    }

    /// <summary>
    /// Request DTO for assigning tariff plan to user
    /// </summary>
    public class AssignTariffRequest
    {
        public int UserId { get; set; }
        public int TariffPlanId { get; set; }
    }
}

