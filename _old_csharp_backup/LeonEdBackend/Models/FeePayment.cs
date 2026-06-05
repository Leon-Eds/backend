using LeonEdBackend.Helpers;

namespace LeonEdBackend.Models
{
    public class FeePayment
    {
        public Guid Id { get; set; }

        public Guid SchoolId { get; set; }

        public Guid StudentId { get; set; }

        public Guid TermId { get; set; }

        public Guid AcademicSessionId { get; set; }

        public decimal AmountDue { get; set; }

        public decimal AmountPaid { get; set; }

        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

        public Guid? ClearedByUserId { get; set; }

        public DateTime? ClearedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public School School { get; set; } = null!;
        public Student Student { get; set; } = null!;
        public Term Term { get; set; } = null!;
        public AcademicSession AcademicSession { get; set; } = null!;
        public User? ClearedByUser { get; set; }
    }
}
