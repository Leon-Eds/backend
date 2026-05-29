using System.ComponentModel.DataAnnotations;

namespace LeonEdBackend.DTOs.FeeDtos
{
    public class RecordFeePaymentRequest
    {
        [Required]
        public Guid StudentId { get; set; }

        [Required]
        public Guid TermId { get; set; }

        [Required]
        public Guid AcademicSessionId { get; set; }

        [Range(0, double.MaxValue)]
        public decimal AmountDue { get; set; }

        [Range(0, double.MaxValue)]
        public decimal AmountPaid { get; set; }
    }

    public class FeePaymentResponse
    {
        public Guid Id { get; set; }
        public Guid StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string AdmissionNumber { get; set; } = string.Empty;
        public decimal AmountDue { get; set; }
        public decimal AmountPaid { get; set; }
        public decimal Balance { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsCleared { get; set; }
        public DateTime? ClearedAt { get; set; }
    }

    public class ClassFeeOverviewResponse
    {
        public Guid ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public string TermName { get; set; } = string.Empty;
        public int TotalStudents { get; set; }
        public int ClearedCount { get; set; }
        public int PendingCount { get; set; }
        public decimal TotalAmountDue { get; set; }
        public decimal TotalAmountPaid { get; set; }
        public List<FeePaymentResponse> Students { get; set; } = new();
    }
}
