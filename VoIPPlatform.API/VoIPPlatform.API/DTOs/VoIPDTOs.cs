namespace VoIPPlatform.API.DTOs
{
    public class VoIPCreateCustomerRequest
    {
        public required string CustomerUsername { get; set; }
        public required string CustomerPassword { get; set; }
        public required string PhoneNumber { get; set; }
        public int? TariffRateId { get; set; }
        public required int CountryCode { get; set; }
        public string? Timezone { get; set; } = "Europe/Stockholm";
    }

    public class VoIPCallHistoryRequest
    {
        public DateTime? FromDate { get; set; }
        public int? CallId { get; set; }
        public int RecordCount { get; set; } = 10;
        public string Direction { get; set; } = "backward";
    }

    public class VoIPCustomerResponse
    {
        public bool Success { get; set; }
        public required string Message { get; set; }
        public required VoIPCustomerData Data { get; set; }
        public string? Error { get; set; }
    }

    public class VoIPCustomerData
    {
        public required string Username { get; set; }
        public decimal Balance { get; set; }
        public bool IsBlocked { get; set; }
        public List<string> PhoneNumbers { get; set; } = new List<string>();
    }

    public class VoIPCallHistoryResponse
    {
        public bool Success { get; set; }
        public required string Message { get; set; }
        public List<VoIPCallDetail> Calls { get; set; } = new List<VoIPCallDetail>();
        public int TotalRecords { get; set; }
    }

    public class VoIPCallDetail
    {
        public int CallId { get; set; }
        public required string FromNumber { get; set; }
        public required string ToNumber { get; set; }
        public DateTime StartTime { get; set; }
        public int DurationSeconds { get; set; }
        public decimal Cost { get; set; }
        public required string Status { get; set; }
    }
}

