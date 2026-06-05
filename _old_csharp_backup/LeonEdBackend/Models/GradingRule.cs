using System.ComponentModel.DataAnnotations;
using LeonEdBackend.Helpers;

namespace LeonEdBackend.Models
{
    public class GradingRule
    {
        public Guid Id { get; set; }

        public Guid SchoolId { get; set; }

        public Grade Grade { get; set; }

        public int MinScore { get; set; }

        public int MaxScore { get; set; }

        [MaxLength(100)]
        public string Remark { get; set; } = string.Empty; // e.g. "Excellent", "Very Good"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public School School { get; set; } = null!;
    }
}
