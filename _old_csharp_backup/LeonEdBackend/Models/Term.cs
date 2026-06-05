using LeonEdBackend.Helpers;

namespace LeonEdBackend.Models
{
    public class Term
    {
        public Guid Id { get; set; }

        public Guid AcademicSessionId { get; set; }

        public TermNumber TermNumber { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public bool IsCurrent { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public AcademicSession AcademicSession { get; set; } = null!;
    }
}
