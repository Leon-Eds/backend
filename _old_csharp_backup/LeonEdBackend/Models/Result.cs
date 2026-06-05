using System.ComponentModel.DataAnnotations;
using LeonEdBackend.Helpers;

namespace LeonEdBackend.Models
{
    public class Result
    {
        public Guid Id { get; set; }

        public Guid SchoolId { get; set; }

        public Guid StudentId { get; set; }

        public Guid ClassId { get; set; }

        public Guid TermId { get; set; }

        public Guid AcademicSessionId { get; set; }

        /// <summary>Sum of all subject totals</summary>
        public decimal TotalScore { get; set; }

        /// <summary>Average across all subjects</summary>
        public decimal Average { get; set; }

        /// <summary>Class position / rank</summary>
        public int Position { get; set; }

        /// <summary>Number of subjects taken</summary>
        public int SubjectCount { get; set; }

        /// <summary>Workflow status: Draft → Submitted → Approved → Published</summary>
        public ResultStatus Status { get; set; } = ResultStatus.Draft;

        [MaxLength(500)]
        public string TeacherComment { get; set; } = string.Empty;

        [MaxLength(500)]
        public string AdminComment { get; set; } = string.Empty;

        public DateTime? SubmittedAt { get; set; }

        public DateTime? ApprovedAt { get; set; }

        public DateTime? PublishedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public School School { get; set; } = null!;
        public Student Student { get; set; } = null!;
        public Class Class { get; set; } = null!;
        public Term Term { get; set; } = null!;
        public AcademicSession AcademicSession { get; set; } = null!;
    }
}
