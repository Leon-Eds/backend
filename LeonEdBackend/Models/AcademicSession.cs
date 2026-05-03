using System.ComponentModel.DataAnnotations;

namespace LeonEdBackend.Models
{
    public class AcademicSession
    {
        public Guid Id { get; set; }

        public Guid SchoolId { get; set; }

        [Required, MaxLength(50)]
        public string Name { get; set; } = string.Empty; // e.g. "2025/2026"

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public bool IsCurrent { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public School School { get; set; } = null!;
        public ICollection<Term> Terms { get; set; } = new List<Term>();
        public ICollection<Class> Classes { get; set; } = new List<Class>();
    }
}
